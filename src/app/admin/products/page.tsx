"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiSearchLine } from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/utils/helpers";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import axios from "axios";
import toast from "react-hot-toast";

interface Product {
  _id: string;
  name: string;
  images: string[];
  price: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  category?: { name: string };
  createdAt: string;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebounce(search, 400);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20", ...(debouncedSearch && { search: debouncedSearch }) });
      const res = await axios.get<{ data: Product[]; pagination: { total: number } }>(`/api/products?${params}`);
      setProducts(res.data.data);
      setTotal(res.data.pagination.total);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, [page, debouncedSearch]);

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await axios.patch(`/api/products/${id}`, { isActive: !current });
      setProducts((prev) => prev.map((p) => p._id === id ? { ...p, isActive: !current } : p));
      toast.success(`Product ${!current ? "activated" : "deactivated"}`);
    } catch { toast.error("Failed to update"); }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await axios.delete(`/api/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      toast.success("Product deleted");
    } catch { toast.error("Failed to delete"); }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Products</h1>
          <p className="text-sm text-neutral-400 mt-0.5">{total} total products</p>
        </div>
        <Link href="/admin/products/new">
          <Button leftIcon={<RiAddLine />}>Add Product</Button>
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-neutral-100 mb-5 p-4">
        <div className="flex items-center gap-2 bg-[#F7F6F0] rounded-xl px-3 py-2 max-w-sm">
          <RiSearchLine className="text-neutral-400" size={16} />
          <input
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100">
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Product</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Price</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Stock</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Status</th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><Skeleton className="w-10 h-10" rounded="lg" /><Skeleton className="h-4 w-40" /></div></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-16" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-4 w-12" /></td>
                    <td className="px-4 py-4"><Skeleton className="h-5 w-16" rounded="full" /></td>
                    <td className="px-6 py-4 text-right"><Skeleton className="h-8 w-20 ml-auto" rounded="lg" /></td>
                  </tr>
                ))
              : products.map((product) => (
                  <motion.tr
                    key={product._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-[#FAFAF9] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#F7F6F0] overflow-hidden shrink-0">
                          {product.images?.[0] ? (
                            <Image src={product.images[0]} alt={product.name} width={40} height={40} className="object-cover w-full h-full" />
                          ) : <div className="w-full h-full flex items-center justify-center text-xs text-neutral-300 font-bold">N/A</div>}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-neutral-800">{product.name}</p>
                          {product.category && <p className="text-xs text-neutral-400">{product.category.name}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-semibold text-neutral-800">{formatCurrency(product.price)}</td>
                    <td className="px-4 py-4">
                      <span className={`text-sm font-medium ${product.stock === 0 ? "text-red-500" : product.stock <= 5 ? "text-amber-500" : "text-green-600"}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <button onClick={() => toggleActive(product._id, product.isActive)}>
                        <Badge variant={product.isActive ? "success" : "neutral"} dot>
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/admin/products/${product._id}/edit`}>
                          <button className="p-1.5 rounded-lg hover:bg-blue-50 text-neutral-400 hover:text-blue-600 transition-colors">
                            <RiEditLine size={16} />
                          </button>
                        </Link>
                        <button onClick={() => deleteProduct(product._id)} className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors">
                          <RiDeleteBinLine size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
