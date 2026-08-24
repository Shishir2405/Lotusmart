"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiSearchLine,
  RiEyeLine,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiFilter3Line,
} from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, normalizeImageUrl } from "@/utils/helpers";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import axios from "axios";
import toast from "@/components/ui/toast";

interface Product {
  _id: string;
  name: string;
  images: string[];
  price: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  showOnWebsite?: boolean;
  showOnApp?: boolean;
  category?: { name: string };
  createdAt: string;
}

type StatusFilter = "all" | "active" | "inactive";

const LIMIT = 20;

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const debouncedSearch = useDebounce(search, 400);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(LIMIT),
        status,
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      const res = await axios.get<{
        data: Product[];
        pagination: { total: number; pages: number };
      }>(`/api/products?${params}`);
      setProducts(res.data.data);
      setTotal(res.data.pagination.total);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page, status, debouncedSearch]);

  const handleStatusChange = (newStatus: StatusFilter) => {
    setStatus(newStatus);
    setPage(1);
  };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      await axios.patch(`/api/products/${id}`, { isActive: !current });
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, isActive: !current } : p))
      );
      toast.success(`Product ${!current ? "activated" : "deactivated"}`);
      if (status !== "all") {
        fetchProducts();
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try {
      await axios.delete(`/api/products/${id}`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
      setTotal((prev) => Math.max(0, prev - 1));
      toast.success("Product deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  const totalPages = Math.ceil(total / LIMIT) || 1;
  const startItem = total === 0 ? 0 : (page - 1) * LIMIT + 1;
  const endItem = Math.min(page * LIMIT, total);

  return (
    <div className="p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Products</h1>
          <p className="text-sm text-neutral-400 mt-0.5">{total} total products</p>
        </div>
        <Link href="/admin/products/new">
          <Button leftIcon={<RiAddLine />}>Add Product</Button>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-[#F7F6F0] rounded-xl px-3 py-2 w-full md:max-w-xs">
          <RiSearchLine className="text-neutral-400" size={16} />
          <input
            placeholder="Search products..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
          />
        </div>

        <div className="flex items-center gap-1.5 bg-neutral-100/70 p-1 rounded-xl">
          <button
            onClick={() => handleStatusChange("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              status === "all"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            All Products
          </button>
          <button
            onClick={() => handleStatusChange("active")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              status === "active"
                ? "bg-emerald-500 text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Active
          </button>
          <button
            onClick={() => handleStatusChange("inactive")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              status === "inactive"
                ? "bg-neutral-800 text-white shadow-sm"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            Inactive
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden shadow-sm">
        <table className="w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50/50">
              <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Product
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Price
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Stock
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Status
              </th>
              <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-50">
            {loading ? (
              Array.from({ length: 8 }).map((_, i) => (
                <tr key={i}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10" rounded="lg" />
                      <Skeleton className="h-4 w-40" />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-16" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-4 w-12" />
                  </td>
                  <td className="px-4 py-4">
                    <Skeleton className="h-5 w-16" rounded="full" />
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Skeleton className="h-8 w-20 ml-auto" rounded="lg" />
                  </td>
                </tr>
              ))
            ) : products.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-sm text-neutral-400">
                  No products found.
                </td>
              </tr>
            ) : (
              products.map((product) => (
                <motion.tr
                  key={product._id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="hover:bg-[#FAFAF9] transition-colors"
                >
                  <td className="px-6 py-4">
                    <Link
                      href={`/admin/products/${product._id}`}
                      className="flex items-center gap-3 group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-[#F7F6F0] overflow-hidden shrink-0 group-hover:ring-2 group-hover:ring-[#E84672] transition-all">
                        {product.images?.[0] ? (
                          <Image
                            src={normalizeImageUrl(product.images[0])}
                            alt={product.name}
                            width={40}
                            height={40}
                            className="object-cover w-full h-full"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-neutral-300 font-bold">
                            N/A
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-neutral-800 group-hover:text-[#E84672] transition-colors">
                          {product.name}
                        </p>
                        {product.category && (
                          <p className="text-xs text-neutral-400">
                            {product.category.name}
                          </p>
                        )}
                      </div>
                    </Link>
                  </td>
                  <td className="px-4 py-4 text-sm font-semibold text-neutral-800">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`text-sm font-medium ${
                        product.stock === 0
                          ? "text-red-500"
                          : product.stock <= 5
                          ? "text-amber-500"
                          : "text-green-600"
                      }`}
                    >
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex flex-col items-start gap-1">
                      <button
                        type="button"
                        onClick={() => toggleActive(product._id, product.isActive)}
                        title="Click to toggle status"
                      >
                        <Badge variant={product.isActive ? "success" : "neutral"} dot>
                          {product.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                      {(product.showOnWebsite === false || product.showOnApp === false) && (
                        <span
                          className="text-[10px] font-semibold text-neutral-400"
                          title="Sell-on channel is restricted for this product"
                        >
                          {product.showOnWebsite === false && product.showOnApp === false
                            ? "Off Website & App"
                            : product.showOnWebsite === false
                            ? "Off Website"
                            : "Off App"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/admin/products/${product._id}`}>
                        <button
                          className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-700 transition-colors"
                          title="View Product Details"
                        >
                          <RiEyeLine size={16} />
                        </button>
                      </Link>
                      <Link href={`/admin/products/${product._id}/edit`}>
                        <button
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-neutral-400 hover:text-blue-600 transition-colors"
                          title="Edit Product"
                        >
                          <RiEditLine size={16} />
                        </button>
                      </Link>
                      <button
                        onClick={() => deleteProduct(product._id)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                        title="Delete Product"
                      >
                        <RiDeleteBinLine size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>

        {total > 0 && (
          <div className="px-6 py-4 bg-neutral-50/50 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-neutral-500">
            <div>
              Showing <span className="font-semibold text-neutral-800">{startItem}</span> to{" "}
              <span className="font-semibold text-neutral-800">{endItem}</span> of{" "}
              <span className="font-semibold text-neutral-800">{total}</span> products
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1 || loading}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 font-medium hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                <RiArrowLeftSLine size={14} /> Previous
              </button>

              <span className="px-2 font-medium text-neutral-600">
                Page {page} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-700 font-medium hover:bg-neutral-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
              >
                Next <RiArrowRightSLine size={14} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
