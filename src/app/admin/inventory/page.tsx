"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiSearchLine,
  RiInboxLine,
  RiAlertLine,
  RiCloseCircleLine,
  RiCheckboxCircleLine,
  RiSaveLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiEqualizerLine,
  RiStackLine,
  RiAddLine,
  RiSubtractLine,
  RiCloseLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import axios from "axios";
import toast from "@/components/ui/toast";
import { normalizeImageUrl } from "@/utils/helpers";


interface Product {
  _id: string;
  name: string;
  images: string[];
  sku: string;
  stock: number;
  lowStockThreshold: number;
  unit: string;
  category?: { _id: string; name: string };
  isActive: boolean;
  updatedAt: string;
}

type StockStatus = "all" | "in_stock" | "low_stock" | "out_of_stock";
type SortKey = "name" | "stock_asc" | "stock_desc" | "updated";
type BulkOperation = "set" | "add" | "reduce";

const ITEMS_PER_PAGE = 20;


function getStockStatus(product: Product): "in_stock" | "low_stock" | "out_of_stock" {
  if (product.stock === 0) return "out_of_stock";
  if (product.stock <= product.lowStockThreshold) return "low_stock";
  return "in_stock";
}

function getRowBg(product: Product): string {
  const status = getStockStatus(product);
  if (status === "out_of_stock") return "bg-red-50/60";
  if (status === "low_stock") return "bg-amber-50/60";
  return "";
}


export default function AdminInventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StockStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingRows, setEditingRows] = useState<
    Record<string, { stock: number; lowStockThreshold: number }>
  >({});
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set());

  
  const [bulkModalOpen, setBulkModalOpen] = useState(false);
  const [bulkOp, setBulkOp] = useState<BulkOperation>("set");
  const [bulkQty, setBulkQty] = useState<number>(0);
  const [bulkSaving, setBulkSaving] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ITEMS_PER_PAGE),
        ...(debouncedSearch && { search: debouncedSearch }),
      });
      const res = await axios.get<{
        data: Product[];
        pagination: { total: number };
      }>(`/api/products?${params}`);
      setProducts(res.data.data);
      setTotal(res.data.pagination.total);
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    products.forEach((p) => {
      if (p.category) map.set(p.category._id, p.category.name);
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [products]);

  const filteredProducts = useMemo(() => {
    let list = [...products];

    
    if (statusFilter !== "all") {
      list = list.filter((p) => getStockStatus(p) === statusFilter);
    }

    
    if (categoryFilter) {
      list = list.filter((p) => p.category?._id === categoryFilter);
    }

    
    switch (sortKey) {
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "stock_asc":
        list.sort((a, b) => a.stock - b.stock);
        break;
      case "stock_desc":
        list.sort((a, b) => b.stock - a.stock);
        break;
      case "updated":
        list.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        );
        break;
    }

    return list;
  }, [products, statusFilter, categoryFilter, sortKey]);

  
  const stats = useMemo(() => {
    const totalProducts = products.length;
    let inStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    products.forEach((p) => {
      const s = getStockStatus(p);
      if (s === "in_stock") inStock++;
      else if (s === "low_stock") lowStock++;
      else outOfStock++;
    });
    return { totalProducts, inStock, lowStock, outOfStock };
  }, [products]);

  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  
  const startEdit = (p: Product) => {
    setEditingRows((prev) => ({
      ...prev,
      [p._id]: { stock: p.stock, lowStockThreshold: p.lowStockThreshold },
    }));
  };

  const updateEditField = (
    id: string,
    field: "stock" | "lowStockThreshold",
    value: number,
  ) => {
    setEditingRows((prev) => ({
      ...prev,
      [id]: { ...prev[id], [field]: value },
    }));
  };

  const saveRow = async (id: string) => {
    const edit = editingRows[id];
    if (!edit) return;

    setSavingIds((prev) => new Set(prev).add(id));
    try {
      await axios.patch(`/api/products/${id}`, {
        stock: edit.stock,
        lowStockThreshold: edit.lowStockThreshold,
      });
      setProducts((prev) =>
        prev.map((p) =>
          p._id === id
            ? { ...p, stock: edit.stock, lowStockThreshold: edit.lowStockThreshold }
            : p,
        ),
      );
      setEditingRows((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      toast.success("Stock updated");
    } catch {
      toast.error("Failed to save");
    } finally {
      setSavingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p._id)));
    }
  };

  
  const openBulkModal = (op: BulkOperation) => {
    setBulkOp(op);
    setBulkQty(0);
    setBulkModalOpen(true);
  };

  const executeBulk = async () => {
    if (selectedIds.size === 0) return;
    setBulkSaving(true);
    try {
      await axios.post("/api/admin/products/bulk-stock", {
        operation: bulkOp,
        productIds: Array.from(selectedIds),
        quantity: bulkQty,
      });
      toast.success(
        `Stock ${bulkOp === "set" ? "set to" : bulkOp === "add" ? "increased by" : "reduced by"} ${bulkQty} for ${selectedIds.size} product(s)`,
      );
      setBulkModalOpen(false);
      setSelectedIds(new Set());
      fetchProducts();
    } catch {
      toast.error("Bulk update failed");
    } finally {
      setBulkSaving(false);
    }
  };

  
  return (
    <div className="p-8">
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">
          Inventory Management
        </h1>
        <p className="text-sm text-neutral-400 mt-0.5">
          Monitor and update stock levels across all products
        </p>
      </div>

      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0 }}
          className="bg-white rounded-2xl border border-neutral-100 p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#F7F6F0] flex items-center justify-center">
              <RiStackLine className="text-[#5C6B3C]" size={20} />
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-medium">Total Products</p>
              <p className="text-xl font-bold text-neutral-900">
                {loading ? "-" : stats.totalProducts}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-2xl border border-neutral-100 p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
              <RiCheckboxCircleLine className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-medium">In Stock</p>
              <p className="text-xl font-bold text-green-600">
                {loading ? "-" : stats.inStock}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-neutral-100 p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
              <RiAlertLine className="text-amber-600" size={20} />
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-medium">Low Stock</p>
              <p className="text-xl font-bold text-amber-600">
                {loading ? "-" : stats.lowStock}
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white rounded-2xl border border-neutral-100 p-5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
              <RiCloseCircleLine className="text-red-500" size={20} />
            </div>
            <div>
              <p className="text-xs text-neutral-400 font-medium">Out of Stock</p>
              <p className="text-xl font-bold text-red-500">
                {loading ? "-" : stats.outOfStock}
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      
      <div className="bg-white rounded-2xl border border-neutral-100 mb-5 p-4">
        <div className="flex flex-wrap items-center gap-3">
          
          <div className="flex items-center gap-2 bg-[#F7F6F0] rounded-xl px-3 py-2 min-w-[220px] flex-1 max-w-sm">
            <RiSearchLine className="text-neutral-400 shrink-0" size={16} />
            <input
              placeholder="Search by name or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
          </div>

          
          <div className="flex items-center gap-1 bg-[#F7F6F0] rounded-xl p-1">
            {(
              [
                { key: "all", label: "All" },
                { key: "in_stock", label: "In Stock" },
                { key: "low_stock", label: "Low Stock" },
                { key: "out_of_stock", label: "Out of Stock" },
              ] as { key: StockStatus; label: string }[]
            ).map((opt) => (
              <button
                key={opt.key}
                onClick={() => setStatusFilter(opt.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                  statusFilter === opt.key
                    ? "bg-white text-neutral-800 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-[#F7F6F0] rounded-xl px-3 py-2 text-sm text-neutral-700 outline-none border-none cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          
          <div className="flex items-center gap-1.5">
            <RiEqualizerLine className="text-neutral-400" size={14} />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              className="bg-[#F7F6F0] rounded-xl px-3 py-2 text-sm text-neutral-700 outline-none border-none cursor-pointer"
            >
              <option value="name">Name</option>
              <option value="stock_asc">Stock: Low to High</option>
              <option value="stock_desc">Stock: High to Low</option>
              <option value="updated">Last Updated</option>
            </select>
          </div>
        </div>
      </div>

      
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-[#2A2518] text-white rounded-2xl mb-4 px-5 py-3 flex items-center justify-between"
          >
            <span className="text-sm font-medium">
              {selectedIds.size} product(s) selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="!text-white hover:!bg-white/10"
                leftIcon={<RiEqualizerLine size={14} />}
                onClick={() => openBulkModal("set")}
              >
                Set Stock
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="!text-white hover:!bg-white/10"
                leftIcon={<RiAddLine size={14} />}
                onClick={() => openBulkModal("add")}
              >
                Add Stock
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="!text-white hover:!bg-white/10"
                leftIcon={<RiSubtractLine size={14} />}
                onClick={() => openBulkModal("reduce")}
              >
                Reduce Stock
              </Button>
              <button
                onClick={() => setSelectedIds(new Set())}
                className="ml-2 p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <RiCloseLine size={18} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={
                      filteredProducts.length > 0 &&
                      selectedIds.size === filteredProducts.length
                    }
                    onChange={toggleAll}
                    className="rounded border-neutral-300 text-[#E84672] focus:ring-[#E84672]/30"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Product
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  SKU
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Category
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Stock
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Low Threshold
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Unit
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
              {loading
                ? Array.from({ length: 8 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-4">
                        <Skeleton className="w-4 h-4" rounded="sm" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-9 h-9" rounded="lg" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-12" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-12" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-14" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-5 w-16" rounded="full" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Skeleton className="h-8 w-16 ml-auto" rounded="lg" />
                      </td>
                    </tr>
                  ))
                : filteredProducts.map((product) => {
                    const status = getStockStatus(product);
                    const isEditing = !!editingRows[product._id];
                    const isSaving = savingIds.has(product._id);

                    return (
                      <motion.tr
                        key={product._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`hover:bg-[#FAFAF9] transition-colors ${getRowBg(product)}`}
                      >
                        
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(product._id)}
                            onChange={() => toggleSelect(product._id)}
                            className="rounded border-neutral-300 text-[#E84672] focus:ring-[#E84672]/30"
                          />
                        </td>

                        
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-[#F7F6F0] overflow-hidden shrink-0">
                              {product.images?.[0] ? (
                                <Image
                                  src={normalizeImageUrl(product.images[0])}
                                  alt={product.name}
                                  width={36}
                                  height={36}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <RiInboxLine
                                    className="text-neutral-300"
                                    size={16}
                                  />
                                </div>
                              )}
                            </div>
                            <p className="text-sm font-medium text-neutral-800 truncate max-w-[180px]">
                              {product.name}
                            </p>
                          </div>
                        </td>

                        
                        <td className="px-4 py-3">
                          <span className="text-xs font-mono text-neutral-500">
                            {product.sku}
                          </span>
                        </td>

                        
                        <td className="px-4 py-3">
                          <span className="text-sm text-neutral-600">
                            {product.category?.name ?? "-"}
                          </span>
                        </td>

                        
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="number"
                              min={0}
                              value={editingRows[product._id].stock}
                              onChange={(e) =>
                                updateEditField(
                                  product._id,
                                  "stock",
                                  Math.max(0, Number(e.target.value)),
                                )
                              }
                              className="w-20 rounded-lg border border-neutral-200 px-2 py-1 text-sm text-neutral-800 outline-none focus:ring-2 focus:ring-[#E84672]/30 focus:border-[#E84672]"
                            />
                          ) : (
                            <button
                              onClick={() => startEdit(product)}
                              className={`text-sm font-semibold cursor-pointer hover:underline ${
                                product.stock === 0
                                  ? "text-red-500"
                                  : product.stock <= product.lowStockThreshold
                                    ? "text-amber-600"
                                    : "text-neutral-800"
                              }`}
                            >
                              {product.stock}
                            </button>
                          )}
                        </td>

                        
                        <td className="px-4 py-3">
                          {isEditing ? (
                            <input
                              type="number"
                              min={0}
                              value={editingRows[product._id].lowStockThreshold}
                              onChange={(e) =>
                                updateEditField(
                                  product._id,
                                  "lowStockThreshold",
                                  Math.max(0, Number(e.target.value)),
                                )
                              }
                              className="w-20 rounded-lg border border-neutral-200 px-2 py-1 text-sm text-neutral-800 outline-none focus:ring-2 focus:ring-[#E84672]/30 focus:border-[#E84672]"
                            />
                          ) : (
                            <button
                              onClick={() => startEdit(product)}
                              className="text-sm text-neutral-500 cursor-pointer hover:underline"
                            >
                              {product.lowStockThreshold}
                            </button>
                          )}
                        </td>

                        
                        <td className="px-4 py-3">
                          <span className="text-sm text-neutral-600">
                            {product.unit}
                          </span>
                        </td>

                        
                        <td className="px-4 py-3">
                          <Badge
                            variant={
                              status === "in_stock"
                                ? "success"
                                : status === "low_stock"
                                  ? "warning"
                                  : "error"
                            }
                            dot
                          >
                            {status === "in_stock"
                              ? "In Stock"
                              : status === "low_stock"
                                ? "Low Stock"
                                : "Out of Stock"}
                          </Badge>
                        </td>

                        
                        <td className="px-6 py-3 text-right">
                          {isEditing ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                variant="primary"
                                leftIcon={<RiSaveLine size={14} />}
                                isLoading={isSaving}
                                onClick={() => saveRow(product._id)}
                              >
                                Save
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() =>
                                  setEditingRows((prev) => {
                                    const next = { ...prev };
                                    delete next[product._id];
                                    return next;
                                  })
                                }
                              >
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <button
                              onClick={() => startEdit(product)}
                              className="p-1.5 rounded-lg hover:bg-[#F7F6F0] text-neutral-400 hover:text-[#5C6B3C] transition-colors"
                              title="Edit stock"
                            >
                              <RiEqualizerLine size={16} />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        
        {!loading && filteredProducts.length === 0 && (
          <div className="py-16 text-center">
            <RiInboxLine className="mx-auto text-neutral-300 mb-3" size={40} />
            <p className="text-neutral-500 text-sm">No products found</p>
          </div>
        )}
      </div>

      
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-neutral-400">
            Page {page} of {totalPages} ({total} products)
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              disabled={page <= 1}
              leftIcon={<RiArrowUpLine className="rotate-[-90deg]" size={14} />}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum: number;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                      page === pageNum
                        ? "bg-[#E84672] text-white"
                        : "text-neutral-600 hover:bg-[#F7F6F0]"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <Button
              size="sm"
              variant="ghost"
              disabled={page >= totalPages}
              rightIcon={
                <RiArrowDownLine className="rotate-[-90deg]" size={14} />
              }
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </Button>
          </div>
        </div>
      )}

      
      <AnimatePresence>
        {bulkModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setBulkModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md mx-4"
            >
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold text-neutral-900">
                  {bulkOp === "set"
                    ? "Set Stock"
                    : bulkOp === "add"
                      ? "Add Stock"
                      : "Reduce Stock"}
                </h2>
                <button
                  onClick={() => setBulkModalOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 transition-colors"
                >
                  <RiCloseLine size={20} />
                </button>
              </div>

              <p className="text-sm text-neutral-500 mb-4">
                This will{" "}
                {bulkOp === "set"
                  ? "set the stock to"
                  : bulkOp === "add"
                    ? "add"
                    : "reduce by"}{" "}
                the specified quantity for{" "}
                <strong>{selectedIds.size} selected product(s)</strong>.
              </p>

              <div className="mb-6">
                <label className="text-sm font-medium text-neutral-700 mb-1.5 block">
                  Quantity
                </label>
                <input
                  type="number"
                  min={0}
                  value={bulkQty}
                  onChange={(e) => setBulkQty(Math.max(0, Number(e.target.value)))}
                  autoFocus
                  className="w-full rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm text-neutral-800 placeholder:text-neutral-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[#E84672]/30 focus:border-[#E84672]"
                  placeholder="Enter quantity..."
                />
              </div>

              <div className="flex items-center justify-end gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setBulkModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  isLoading={bulkSaving}
                  onClick={executeBulk}
                  leftIcon={
                    bulkOp === "set" ? (
                      <RiEqualizerLine size={14} />
                    ) : bulkOp === "add" ? (
                      <RiAddLine size={14} />
                    ) : (
                      <RiSubtractLine size={14} />
                    )
                  }
                >
                  {bulkOp === "set"
                    ? "Set Stock"
                    : bulkOp === "add"
                      ? "Add Stock"
                      : "Reduce Stock"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
