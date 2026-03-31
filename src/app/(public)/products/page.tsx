"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  RiSearchLine,
  RiFilter3Line,
  RiCloseLine,
  RiSortDesc,
} from "react-icons/ri";
import { ProductCard, type ProductCardData } from "@/components/products/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useDebounce } from "@/hooks/useDebounce";
import axios from "axios";

const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "popular", label: "Most Popular" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const CATEGORIES = [
  { slug: "all", label: "All" },
  { slug: "whole-spices", label: "Whole Spices" },
  { slug: "ground-spices", label: "Ground Spices" },
  { slug: "dry-fruits", label: "Dry Fruits" },
  { slug: "nuts-seeds", label: "Nuts & Seeds" },
  { slug: "gift-boxes", label: "Gift Boxes" },
  { slug: "organic", label: "Organic" },
];

interface ProductsResponse {
  data: ProductCardData[];
  pagination: { page: number; totalPages: number; total: number };
}

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [category, setCategory] = useState(searchParams.get("category") ?? "all");
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") ?? "newest");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") ?? "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") ?? "");
  const [inStock, setInStock] = useState(searchParams.get("inStock") === "true");
  const [page, setPage] = useState(Number(searchParams.get("page") ?? 1));

  const debouncedSearch = useDebounce(search, 400);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
        sortBy,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(category !== "all" && { category }),
        ...(minPrice && { minPrice }),
        ...(maxPrice && { maxPrice }),
        ...(inStock && { inStock: "true" }),
      });
      const res = await axios.get<ProductsResponse>(`/api/products?${params}`);
      setProducts(res.data.data);
      setPagination(res.data.pagination);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, sortBy, debouncedSearch, category, minPrice, maxPrice, inStock]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  
  useEffect(() => { setPage(1); }, [debouncedSearch, category, sortBy, minPrice, maxPrice, inStock]);

  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setSortBy("newest");
    setMinPrice("");
    setMaxPrice("");
    setInStock(false);
    setPage(1);
  };

  const hasFilters = search || category !== "all" || minPrice || maxPrice || inStock;

  return (
    <div className="container-wide py-8">
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">
            {category !== "all" ? CATEGORIES.find((c) => c.slug === category)?.label : "All Products"}
          </h1>
          {!loading && <p className="text-sm text-neutral-400 mt-0.5">{pagination.total} products</p>}
        </div>
        <div className="flex items-center gap-2">
          {hasFilters && (
            <Button variant="ghost" size="sm" leftIcon={<RiCloseLine />} onClick={clearFilters}>
              Clear filters
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RiFilter3Line />}
            onClick={() => setFiltersOpen((v) => !v)}
            className="lg:hidden"
          >
            Filters
          </Button>
        </div>
      </div>

      <div className="flex gap-8">
        
        <aside
          className={`shrink-0 w-64 ${filtersOpen ? "fixed inset-0 z-50 bg-white p-6 overflow-y-auto lg:static lg:z-auto lg:bg-transparent lg:p-0" : "hidden lg:block"}`}
        >
          {filtersOpen && (
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <h2 className="text-lg font-bold">Filters</h2>
              <button onClick={() => setFiltersOpen(false)}><RiCloseLine size={22} /></button>
            </div>
          )}

          <div className="space-y-6">
            
            <Input
              label="Search"
              placeholder="Search products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<RiSearchLine />}
            />

            
            <div>
              <p className="text-sm font-semibold text-neutral-700 mb-3">Category</p>
              <div className="space-y-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.slug}
                    onClick={() => setCategory(cat.slug)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      category === cat.slug
                        ? "bg-[#FFF1F3] text-[#E84672] font-medium"
                        : "text-neutral-600 hover:bg-[#F7F6F0]"
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            
            <div>
              <p className="text-sm font-semibold text-neutral-700 mb-3">Price Range</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Min"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E84672]"
                />
                <span className="text-neutral-400 shrink-0">—</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full border border-neutral-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#E84672]"
                />
              </div>
            </div>

            
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="w-4 h-4 accent-[#E84672] rounded"
              />
              <span className="text-sm text-neutral-700">In stock only</span>
            </label>
          </div>
        </aside>

        
        <div className="flex-1 min-w-0">
          
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setSortBy(opt.value)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    sortBy === opt.value
                      ? "bg-[#E84672] text-white"
                      : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <RiSortDesc className="text-neutral-400 shrink-0 hidden sm:block" size={18} />
          </div>

          {loading ? (
            <ProductGridSkeleton count={12} />
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-neutral-300 mb-4 flex justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></div>
              <h3 className="text-xl font-semibold text-neutral-700 mb-2">No products found</h3>
              <p className="text-neutral-400 mb-6">Try adjusting your filters or search term</p>
              <Button variant="outline" onClick={clearFilters}>Clear all filters</Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                {products.map((product, i) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                  >
                    <ProductCard product={product} />
                  </motion.div>
                ))}
              </div>

              
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-10">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-neutral-500">
                    Page {page} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === pagination.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container-wide py-8"><ProductGridSkeleton count={12} /></div>}>
      <ProductsContent />
    </Suspense>
  );
}
