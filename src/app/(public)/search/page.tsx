"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { RiSearchLine, RiCloseLine, RiArrowRightLine } from "react-icons/ri";
import { ProductCard, type ProductCardData } from "@/components/products/ProductCard";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { useDebounce } from "@/hooks/useDebounce";
import { formatCurrency } from "@/utils/helpers";
import axios from "axios";

interface AutocompleteResult {
  id: string;
  name: string;
  slug: string;
  price: number;
  image: string | null;
}

interface ProductsResponse {
  data: ProductCardData[];
  pagination: { total: number; totalPages: number; page: number };
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialQ = searchParams.get("q") ?? "";

  const [query, setQuery] = useState(initialQ);
  const [products, setProducts] = useState<ProductCardData[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [suggestions, setSuggestions] = useState<AutocompleteResult[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const debouncedQuery = useDebounce(query, 350);

  // Autocomplete suggestions
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) { setSuggestions([]); return; }
    setSuggestLoading(true);
    axios
      .get<{ data: AutocompleteResult[] }>(`/api/products/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then((r) => setSuggestions(r.data.data))
      .catch(() => setSuggestions([]))
      .finally(() => setSuggestLoading(false));
  }, [debouncedQuery]);

  // Full search results
  const fetchResults = useCallback(async (q: string, p: number) => {
    if (!q.trim()) { setProducts([]); setTotal(0); return; }
    setLoading(true);
    try {
      const params = new URLSearchParams({ search: q, page: String(p), limit: "20" });
      const res = await axios.get<ProductsResponse>(`/api/products?${params}`);
      setProducts(res.data.data);
      setTotal(res.data.pagination.total);
      setTotalPages(res.data.pagination.totalPages);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialQ) fetchResults(initialQ, 1);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSearch = (q: string) => {
    setShowSuggestions(false);
    setSuggestions([]);
    setPage(1);
    router.push(`/search?q=${encodeURIComponent(q)}`, { scroll: false });
    fetchResults(q, 1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) handleSearch(query.trim());
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchResults(searchParams.get("q") ?? query, p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submittedQ = searchParams.get("q") ?? "";

  return (
    <div className="container-wide py-8">
      {/* Search bar */}
      <div className="max-w-2xl mx-auto mb-10 relative">
        <form onSubmit={handleSubmit}>
          <div className="relative flex items-center">
            <RiSearchLine className="absolute left-4 text-neutral-400 shrink-0" size={20} />
            <input
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); }}
              onFocus={() => { if (suggestions.length) setShowSuggestions(true); }}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              placeholder="Search for spices, dry fruits, nuts..."
              className="w-full pl-12 pr-12 py-3.5 rounded-2xl border border-neutral-200 text-sm focus:outline-none focus:border-[#E84672] shadow-sm bg-white"
              autoFocus
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); setSuggestions([]); setProducts([]); }}
                className="absolute right-4 text-neutral-400 hover:text-neutral-600"
              >
                <RiCloseLine size={18} />
              </button>
            )}
          </div>
        </form>

        {/* Autocomplete dropdown */}
        {showSuggestions && (query.length >= 2) && (
          <div className="absolute z-50 top-full mt-1.5 w-full bg-white rounded-2xl border border-neutral-100 shadow-xl overflow-hidden">
            {suggestLoading ? (
              <div className="px-4 py-3 text-sm text-neutral-400">Searching…</div>
            ) : suggestions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-neutral-400">No results for &quot;{query}&quot;</div>
            ) : (
              <>
                {suggestions.map((item) => (
                  <button
                    key={item.id}
                    onMouseDown={() => { setQuery(item.name); handleSearch(item.name); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#FAFAF9] transition-colors text-left"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#F7F6F0] overflow-hidden shrink-0 flex items-center justify-center">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} width={36} height={36} className="object-cover w-full h-full" />
                      ) : <span className="text-base">🌿</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-800 truncate">{item.name}</p>
                      <p className="text-xs text-neutral-400">{formatCurrency(item.price)}</p>
                    </div>
                    <RiArrowRightLine className="text-neutral-300 shrink-0" size={14} />
                  </button>
                ))}
                <div className="border-t border-neutral-50 px-4 py-2.5">
                  <button
                    onMouseDown={() => handleSearch(query)}
                    className="text-sm text-[#E84672] font-medium hover:underline"
                  >
                    See all results for &quot;{query}&quot;
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {!submittedQ ? (
        <div className="text-center py-16">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-xl font-semibold text-neutral-700 mb-2">What are you looking for?</h2>
          <p className="text-neutral-400 text-sm">Try searching for spices, dry fruits, gift boxes…</p>
        </div>
      ) : loading ? (
        <div>
          <p className="text-sm text-neutral-400 mb-6">Searching for &quot;{submittedQ}&quot;…</p>
          <ProductGridSkeleton count={8} />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">😕</div>
          <h3 className="text-xl font-semibold text-neutral-700 mb-2">
            No results for &quot;{submittedQ}&quot;
          </h3>
          <p className="text-neutral-400 mb-6 text-sm">
            Try different keywords or browse our categories.
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl border border-neutral-200 text-sm font-medium text-neutral-700 hover:border-neutral-300 transition-colors"
          >
            Browse all products
          </Link>
        </div>
      ) : (
        <>
          <p className="text-sm text-neutral-400 mb-6">
            {total} result{total !== 1 ? "s" : ""} for &quot;<strong className="text-neutral-700">{submittedQ}</strong>&quot;
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
            {products.map((product, i) => (
              <motion.div
                key={product._id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-10">
              <button
                disabled={page === 1}
                onClick={() => handlePageChange(page - 1)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-sm disabled:opacity-40 hover:border-neutral-300 transition-colors"
              >
                Previous
              </button>
              <span className="text-sm text-neutral-500">Page {page} of {totalPages}</span>
              <button
                disabled={page === totalPages}
                onClick={() => handlePageChange(page + 1)}
                className="px-4 py-2 rounded-xl border border-neutral-200 text-sm disabled:opacity-40 hover:border-neutral-300 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="container-wide py-8"><ProductGridSkeleton count={8} /></div>}>
      <SearchContent />
    </Suspense>
  );
}
