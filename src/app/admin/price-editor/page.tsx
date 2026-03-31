"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiSearchLine,
  RiSaveLine,
  RiArrowGoBackLine,
  RiPercentLine,
  RiArrowUpLine,
  RiArrowDownLine,
  RiCheckLine,
  RiCloseLine,
  RiFilterLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { formatCurrency, formatRelativeTime } from "@/utils/helpers";
import { useDebounce } from "@/hooks/useDebounce";
import axios from "axios";
import toast from "react-hot-toast";


interface Product {
  _id: string;
  name: string;
  images: string[];
  price: number;
  pricePerKg?: number;
  pricePerGram?: number;
  compareAtPrice?: number;
  stock: number;
  unit: string;
  category?: { _id: string; name: string };
  productType?: string;
  lastPriceUpdate?: string;
  updatedAt: string;
}

interface EditableRow {
  price: number;
  pricePerKg: number;
  pricePerGram: number;
  compareAtPrice: number;
}

type SortOption = "name" | "price-asc" | "price-desc" | "updated";
type CategoryFilter = "all" | "spice" | "dry_fruit";


export default function QuickPriceEditorPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [sortBy, setSortBy] = useState<SortOption>("name");
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  
  const [originalValues, setOriginalValues] = useState<Record<string, EditableRow>>({});
  const [editedValues, setEditedValues] = useState<Record<string, EditableRow>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  
  const [showBulkPanel, setShowBulkPanel] = useState(false);
  const [bulkPercentage, setBulkPercentage] = useState<string>("0");
  const [bulkDirection, setBulkDirection] = useState<"increase" | "decrease">("increase");

  
  const [savingRows, setSavingRows] = useState<Set<string>>(new Set());

  const debouncedSearch = useDebounce(search, 300);

  
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "100" });
      const productTypes: string[] = [];
      if (categoryFilter === "all") {
        productTypes.push("spice", "dry_fruit");
      } else {
        productTypes.push(categoryFilter);
      }
      params.set("productType", productTypes.join(","));

      const res = await axios.get<{ data: Product[] }>(`/api/products?${params}`);
      const data = res.data.data;
      setProducts(data);

      
      const originals: Record<string, EditableRow> = {};
      for (const p of data) {
        originals[p._id] = {
          price: p.price ?? 0,
          pricePerKg: p.pricePerKg ?? 0,
          pricePerGram: p.pricePerGram ?? 0,
          compareAtPrice: p.compareAtPrice ?? 0,
        };
      }
      setOriginalValues(originals);
      setEditedValues({});
      setErrors({});
      setSelectedIds(new Set());
      setLastUpdated(new Date().toISOString());
    } catch {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [categoryFilter]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  
  const filteredProducts = useMemo(() => {
    let list = [...products];

    
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category?.name.toLowerCase().includes(q),
      );
    }

    
    switch (sortBy) {
      case "name":
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "price-asc":
        list.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        list.sort((a, b) => b.price - a.price);
        break;
      case "updated":
        list.sort(
          (a, b) =>
            new Date(b.lastPriceUpdate ?? b.updatedAt).getTime() -
            new Date(a.lastPriceUpdate ?? a.updatedAt).getTime(),
        );
        break;
    }

    return list;
  }, [products, debouncedSearch, sortBy]);

  
  const getRowValues = (id: string): EditableRow => {
    return editedValues[id] ?? originalValues[id] ?? { price: 0, pricePerKg: 0, pricePerGram: 0, compareAtPrice: 0 };
  };

  const isRowModified = (id: string): boolean => {
    if (!editedValues[id]) return false;
    const orig = originalValues[id];
    const edit = editedValues[id];
    return (
      orig.price !== edit.price ||
      orig.pricePerKg !== edit.pricePerKg ||
      orig.pricePerGram !== edit.pricePerGram ||
      orig.compareAtPrice !== edit.compareAtPrice
    );
  };

  const modifiedProductIds = useMemo(() => {
    return Object.keys(editedValues).filter(isRowModified);
    
  }, [editedValues, originalValues]);

  const hasChanges = modifiedProductIds.length > 0;

  
  const updateField = (
    id: string,
    field: keyof EditableRow,
    rawValue: string,
  ) => {
    const numValue = rawValue === "" ? 0 : parseFloat(rawValue);
    if (isNaN(numValue) || numValue < 0) {
      setErrors((prev) => ({ ...prev, [id]: `Invalid ${field}` }));
      return;
    }
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });

    const current = getRowValues(id);
    const updated = { ...current, [field]: numValue };

    
    if (field === "pricePerKg" && numValue > 0) {
      updated.pricePerGram = parseFloat((numValue / 1000).toFixed(2));
    } else if (field === "pricePerGram" && numValue > 0) {
      updated.pricePerKg = parseFloat((numValue * 1000).toFixed(2));
    }

    setEditedValues((prev) => ({ ...prev, [id]: updated }));
  };

  const undoRow = (id: string) => {
    setEditedValues((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  };

  
  const saveRow = async (id: string) => {
    if (!isRowModified(id)) return;
    const values = getRowValues(id);

    setSavingRows((prev) => new Set(prev).add(id));
    try {
      await axios.patch(`/api/products/${id}`, {
        price: values.price,
        pricePerKg: values.pricePerKg,
        pricePerGram: values.pricePerGram,
        compareAtPrice: values.compareAtPrice || undefined,
        lastPriceUpdate: new Date().toISOString(),
      });

      
      setOriginalValues((prev) => ({ ...prev, [id]: { ...values } }));
      setEditedValues((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setLastUpdated(new Date().toISOString());
      toast.success("Price updated");
    } catch {
      toast.error("Failed to save price");
    } finally {
      setSavingRows((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  
  const saveAllChanges = async () => {
    if (!hasChanges) return;

    const updates = modifiedProductIds.map((id) => {
      const v = getRowValues(id);
      return {
        id,
        price: v.price,
        pricePerKg: v.pricePerKg,
        pricePerGram: v.pricePerGram,
        compareAtPrice: v.compareAtPrice || undefined,
      };
    });

    setSaving(true);
    try {
      await axios.post("/api/admin/products/bulk-price", { updates });

      
      const newOriginals = { ...originalValues };
      for (const id of modifiedProductIds) {
        newOriginals[id] = { ...getRowValues(id) };
      }
      setOriginalValues(newOriginals);
      setEditedValues({});
      setLastUpdated(new Date().toISOString());
      toast.success(`${updates.length} price(s) updated successfully`);
    } catch {
      toast.error("Failed to save prices");
    } finally {
      setSaving(false);
    }
  };

  
  const applyBulkAdjustment = () => {
    const pct = parseFloat(bulkPercentage);
    if (isNaN(pct) || pct === 0) {
      toast.error("Enter a valid percentage");
      return;
    }

    const targetIds = selectedIds.size > 0 ? [...selectedIds] : filteredProducts.map((p) => p._id);

    if (targetIds.length === 0) {
      toast.error("No products to update");
      return;
    }

    const multiplier = bulkDirection === "increase" ? 1 + pct / 100 : 1 - pct / 100;

    const newEdits = { ...editedValues };
    for (const id of targetIds) {
      const current = getRowValues(id);
      newEdits[id] = {
        price: parseFloat((current.price * multiplier).toFixed(2)),
        pricePerKg: current.pricePerKg
          ? parseFloat((current.pricePerKg * multiplier).toFixed(2))
          : 0,
        pricePerGram: current.pricePerGram
          ? parseFloat((current.pricePerGram * multiplier).toFixed(2))
          : 0,
        compareAtPrice: current.compareAtPrice
          ? parseFloat((current.compareAtPrice * multiplier).toFixed(2))
          : 0,
      };
    }
    setEditedValues(newEdits);
    setShowBulkPanel(false);
    toast.success(
      `${bulkDirection === "increase" ? "Increased" : "Decreased"} prices by ${pct}% for ${targetIds.length} product(s)`,
    );
  };

  
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map((p) => p._id)));
    }
  };

  
  const rowBgClass = (id: string): string => {
    if (errors[id]) return "bg-red-50/60";
    if (isRowModified(id)) return "bg-amber-50/60";
    return "hover:bg-[#FAFAF9]";
  };

  
  return (
    <div className="p-8">
      
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            Quick Price Editor
          </h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Update spice &amp; dry fruit prices daily
          </p>
          {lastUpdated && (
            <p className="text-xs text-neutral-400 mt-1">
              Last refreshed: {formatRelativeTime(lastUpdated)}
            </p>
          )}
        </div>
        <div className="flex items-center gap-3">
          {hasChanges && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
            >
              <Badge variant="warning" dot>
                {modifiedProductIds.length} unsaved change{modifiedProductIds.length !== 1 ? "s" : ""}
              </Badge>
            </motion.div>
          )}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RiPercentLine />}
            onClick={() => setShowBulkPanel(!showBulkPanel)}
          >
            Bulk Adjust
          </Button>
          <Button
            leftIcon={<RiSaveLine />}
            onClick={saveAllChanges}
            isLoading={saving}
            disabled={!hasChanges || saving}
          >
            Save All Changes
          </Button>
        </div>
      </div>

      
      <AnimatePresence>
        {showBulkPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-5"
          >
            <div className="bg-white rounded-2xl border border-neutral-100 p-5">
              <div className="flex items-center gap-2 mb-3">
                <RiPercentLine className="text-[#E84672]" size={18} />
                <h3 className="text-sm font-semibold text-neutral-800">
                  Bulk Price Adjustment
                </h3>
                <span className="text-xs text-neutral-400">
                  {selectedIds.size > 0
                    ? `${selectedIds.size} selected`
                    : `All ${filteredProducts.length} visible products`}
                </span>
              </div>
              <div className="flex items-end gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setBulkDirection("increase")}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      bulkDirection === "increase"
                        ? "bg-green-50 text-green-700 border border-green-200"
                        : "bg-neutral-50 text-neutral-500 border border-neutral-200"
                    }`}
                  >
                    <RiArrowUpLine size={14} />
                    Increase
                  </button>
                  <button
                    onClick={() => setBulkDirection("decrease")}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      bulkDirection === "decrease"
                        ? "bg-red-50 text-red-700 border border-red-200"
                        : "bg-neutral-50 text-neutral-500 border border-neutral-200"
                    }`}
                  >
                    <RiArrowDownLine size={14} />
                    Decrease
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.5"
                    value={bulkPercentage}
                    onChange={(e) => setBulkPercentage(e.target.value)}
                    className="w-28 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-800 pr-8 focus:outline-none focus:ring-2 focus:ring-[#E84672]/30 focus:border-[#E84672]"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-neutral-400">
                    %
                  </span>
                </div>
                <Button size="sm" onClick={applyBulkAdjustment}>
                  Apply
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowBulkPanel(false)}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      
      <div className="bg-white rounded-2xl border border-neutral-100 mb-5 p-4">
        <div className="flex items-center gap-4 flex-wrap">
          
          <div className="flex items-center gap-2 bg-[#F7F6F0] rounded-xl px-3 py-2 flex-1 min-w-[200px] max-w-sm">
            <RiSearchLine className="text-neutral-400 shrink-0" size={16} />
            <input
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
            />
          </div>

          
          <div className="flex items-center gap-2">
            <RiFilterLine className="text-neutral-400" size={16} />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
              className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#E84672]/30 focus:border-[#E84672]"
            >
              <option value="all">All Categories</option>
              <option value="spice">Spices</option>
              <option value="dry_fruit">Dry Fruits</option>
            </select>
          </div>

          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#E84672]/30 focus:border-[#E84672]"
          >
            <option value="name">Sort: Name</option>
            <option value="price-asc">Sort: Price Low-High</option>
            <option value="price-desc">Sort: Price High-Low</option>
            <option value="updated">Sort: Last Updated</option>
          </select>

          
          <span className="text-xs text-neutral-400 ml-auto">
            {filteredProducts.length} product{filteredProducts.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      filteredProducts.length > 0 &&
                      selectedIds.size === filteredProducts.length
                    }
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-neutral-300 text-[#E84672] focus:ring-[#E84672]/30"
                  />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Product
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Category
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Price (&#8377;)
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Price/KG
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Price/Gram
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Compare Price
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Stock
                </th>
                <th className="text-left px-3 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Last Updated
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading
                ? Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-4">
                        <Skeleton className="w-4 h-4" rounded="sm" />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <Skeleton className="w-10 h-10" rounded="lg" />
                          <Skeleton className="h-4 w-32" />
                        </div>
                      </td>
                      <td className="px-3 py-4">
                        <Skeleton className="h-5 w-16" rounded="full" />
                      </td>
                      <td className="px-3 py-4">
                        <Skeleton className="h-8 w-20" rounded="lg" />
                      </td>
                      <td className="px-3 py-4">
                        <Skeleton className="h-8 w-20" rounded="lg" />
                      </td>
                      <td className="px-3 py-4">
                        <Skeleton className="h-8 w-20" rounded="lg" />
                      </td>
                      <td className="px-3 py-4">
                        <Skeleton className="h-8 w-20" rounded="lg" />
                      </td>
                      <td className="px-3 py-4">
                        <Skeleton className="h-4 w-10" />
                      </td>
                      <td className="px-3 py-4">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-8 w-16 ml-auto" rounded="lg" />
                      </td>
                    </tr>
                  ))
                : filteredProducts.map((product) => {
                    const values = getRowValues(product._id);
                    const modified = isRowModified(product._id);
                    const hasError = !!errors[product._id];
                    const isSavingRow = savingRows.has(product._id);

                    return (
                      <motion.tr
                        key={product._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`transition-colors ${rowBgClass(product._id)}`}
                      >
                        
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(product._id)}
                            onChange={() => toggleSelect(product._id)}
                            className="w-4 h-4 rounded border-neutral-300 text-[#E84672] focus:ring-[#E84672]/30"
                          />
                        </td>

                        
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#F7F6F0] overflow-hidden shrink-0">
                              {product.images?.[0] ? (
                                <Image
                                  src={product.images[0]}
                                  alt={product.name}
                                  width={40}
                                  height={40}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-lg">
                                  {product.productType === "dry_fruit" ? "DF" : "SP"}
                                </div>
                              )}
                            </div>
                            <p className="text-sm font-medium text-neutral-800 max-w-[160px] truncate">
                              {product.name}
                            </p>
                          </div>
                        </td>

                        
                        <td className="px-3 py-3">
                          <Badge
                            variant={product.productType === "spice" ? "primary" : "secondary"}
                          >
                            {product.productType === "spice"
                              ? "Spice"
                              : product.productType === "dry_fruit"
                                ? "Dry Fruit"
                                : product.category?.name ?? "-"}
                          </Badge>
                        </td>

                        
                        <td className="px-3 py-3">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                              &#8377;
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={values.price || ""}
                              onChange={(e) =>
                                updateField(product._id, "price", e.target.value)
                              }
                              className={`w-24 rounded-lg border bg-white pl-7 pr-2 py-1.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#E84672]/30 focus:border-[#E84672] ${
                                hasError
                                  ? "border-red-300"
                                  : modified
                                    ? "border-amber-300"
                                    : "border-neutral-200"
                              }`}
                            />
                          </div>
                        </td>

                        
                        <td className="px-3 py-3">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                              &#8377;
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={values.pricePerKg || ""}
                              onChange={(e) =>
                                updateField(product._id, "pricePerKg", e.target.value)
                              }
                              className={`w-24 rounded-lg border bg-white pl-7 pr-2 py-1.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#E84672]/30 focus:border-[#E84672] ${
                                modified ? "border-amber-300" : "border-neutral-200"
                              }`}
                              placeholder="/kg"
                            />
                          </div>
                        </td>

                        
                        <td className="px-3 py-3">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                              &#8377;
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={values.pricePerGram || ""}
                              onChange={(e) =>
                                updateField(product._id, "pricePerGram", e.target.value)
                              }
                              className={`w-24 rounded-lg border bg-white pl-7 pr-2 py-1.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#E84672]/30 focus:border-[#E84672] ${
                                modified ? "border-amber-300" : "border-neutral-200"
                              }`}
                              placeholder="/g"
                            />
                          </div>
                        </td>

                        
                        <td className="px-3 py-3">
                          <div className="relative">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400">
                              &#8377;
                            </span>
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={values.compareAtPrice || ""}
                              onChange={(e) =>
                                updateField(product._id, "compareAtPrice", e.target.value)
                              }
                              className={`w-24 rounded-lg border bg-white pl-7 pr-2 py-1.5 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-[#E84672]/30 focus:border-[#E84672] ${
                                modified ? "border-amber-300" : "border-neutral-200"
                              }`}
                              placeholder="MRP"
                            />
                          </div>
                        </td>

                        
                        <td className="px-3 py-3">
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

                        
                        <td className="px-3 py-3">
                          <span className="text-xs text-neutral-400">
                            {product.lastPriceUpdate
                              ? formatRelativeTime(product.lastPriceUpdate)
                              : formatRelativeTime(product.updatedAt)}
                          </span>
                        </td>

                        
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {modified && (
                              <>
                                <button
                                  onClick={() => undoRow(product._id)}
                                  title="Undo changes"
                                  className="p-1.5 rounded-lg hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
                                >
                                  <RiArrowGoBackLine size={15} />
                                </button>
                                <Button
                                  size="sm"
                                  onClick={() => saveRow(product._id)}
                                  isLoading={isSavingRow}
                                  disabled={isSavingRow || hasError}
                                  leftIcon={<RiCheckLine size={14} />}
                                  className="!px-2.5 !py-1"
                                >
                                  Save
                                </Button>
                              </>
                            )}
                            {!modified && !hasError && (
                              <span className="text-xs text-green-500 flex items-center gap-1">
                                <RiCheckLine size={14} />
                              </span>
                            )}
                            {hasError && (
                              <span className="text-xs text-red-500 flex items-center gap-1">
                                <RiCloseLine size={14} />
                                {errors[product._id]}
                              </span>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
            </tbody>
          </table>
        </div>

        
        {!loading && filteredProducts.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-neutral-400 text-sm">
              No products found. Try adjusting your filters.
            </p>
          </div>
        )}
      </div>

      
      <div className="flex items-center gap-6 mt-4 text-xs text-neutral-400">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-white border border-neutral-200" />
          Unchanged
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-amber-50 border border-amber-300" />
          Modified (unsaved)
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm bg-red-50 border border-red-300" />
          Error
        </div>
      </div>
    </div>
  );
}
