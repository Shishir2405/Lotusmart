"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiSearchLine,
  RiShoppingCartLine,
  RiHeartLine,
  RiUserLine,
  RiMenuLine,
  RiCloseLine,
  RiArrowDownSLine,
  RiMapPinLine,
  RiLogoutBoxLine,
  RiDashboardLine,
  RiShieldUserLine,
} from "react-icons/ri";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { useAuthStore } from "@/store/auth.store";
import { useAuth } from "@/hooks/useAuth";
import { CATEGORIES } from "@/config/constants";
import { cn } from "@/utils/helpers";
import { useDebounce } from "@/hooks/useDebounce";
import axios from "axios";

interface SearchResult {
  _id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
}

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const user = useAuthStore((s) => s.user);
  const cartCount = useCartStore((s) => s.getItemCount());
  const wishlistCount = useWishlistStore((s) => s.items.length);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 350);

  // Scroll effect
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Search
  useEffect(() => {
    if (!debouncedSearch || debouncedSearch.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    axios
      .get<{ data: SearchResult[] }>(
        `/api/products/search?q=${encodeURIComponent(debouncedSearch)}`,
      )
      .then((r) => setSearchResults(r.data.data ?? []))
      .catch(() => setSearchResults([]))
      .finally(() => setSearchLoading(false));
  }, [debouncedSearch]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close mobile menu on route change
  useEffect(() => setMobileOpen(false), [pathname]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  const topCategories = CATEGORIES.slice(0, 5);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full transition-all duration-300",
        scrolled
          ? "bg-[#FFFDF7]/95 shadow-[0_1px_20px_rgba(0,0,0,0.06)] backdrop-blur-md"
          : "bg-[#FFFDF7]",
      )}
    >
      {/* Top bar */}
      <div className="hidden bg-[#4D4529] px-4 py-2 text-center text-xs font-medium text-[#FFF9E8] sm:block">
        🌸 Free shipping on orders above ₹500 &nbsp;|&nbsp; Fresh stock added weekly
      </div>

      {/* Main header */}
      <div className="container-wide">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="text-2xl font-bold tracking-tight text-[#4D4529]">
              Lotus<span className="text-[#E84672]">Mart</span>
            </span>
          </Link>

          {/* Nav links — desktop */}
          <nav className="hidden items-center gap-6 lg:flex">
            {topCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-[#E84672]",
                  pathname?.includes(cat.slug) ? "text-[#E84672]" : "text-neutral-600",
                )}
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/products"
              className={cn(
                "text-sm font-medium transition-colors hover:text-[#E84672]",
                pathname === "/products" ? "text-[#E84672]" : "text-neutral-600",
              )}
            >
              All Products
            </Link>
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-1">
            {/* Search */}
            <div ref={searchRef} className="relative">
              <button
                onClick={() => setSearchOpen((v) => !v)}
                className="rounded-xl p-2 text-neutral-600 transition-all hover:bg-[#FFF1F3] hover:text-[#E84672]"
                aria-label="Search"
              >
                <RiSearchLine size={20} />
              </button>
              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.98 }}
                    transition={{ duration: 0.18 }}
                    className="absolute top-12 right-0 w-80 overflow-hidden rounded-2xl border border-[#EBE8D8] bg-[#FFFDF7] shadow-xl"
                  >
                    <form onSubmit={handleSearchSubmit} className="p-3">
                      <div className="flex items-center gap-2 rounded-xl bg-[#F7F6F0] px-3 py-2">
                        <RiSearchLine className="shrink-0 text-neutral-400" size={16} />
                        <input
                          autoFocus
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search products..."
                          className="w-full bg-transparent text-sm text-neutral-800 outline-none placeholder:text-neutral-400"
                        />
                        {searchQuery && (
                          <button type="button" onClick={() => setSearchQuery("")}>
                            <RiCloseLine className="text-neutral-400" size={16} />
                          </button>
                        )}
                      </div>
                    </form>

                    {searchLoading && (
                      <div className="px-4 py-6 text-center text-sm text-neutral-400">
                        Searching...
                      </div>
                    )}

                    {!searchLoading && searchResults.length > 0 && (
                      <ul className="pb-2">
                        {searchResults.map((r) => (
                          <li key={r._id}>
                            <Link
                              href={`/products/${r.slug}`}
                              className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-[#F7F6F0]"
                              onClick={() => {
                                setSearchOpen(false);
                                setSearchQuery("");
                              }}
                            >
                              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-[#EBE8D8]">
                                {r.images?.[0] && (
                                  <img
                                    src={r.images[0]}
                                    alt={r.name}
                                    className="h-full w-full object-cover"
                                  />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-medium text-neutral-800">
                                  {r.name}
                                </p>
                                <p className="text-xs font-semibold text-[#E84672]">₹{r.price}</p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}

                    {!searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
                      <div className="px-4 py-6 text-center text-sm text-neutral-400">
                        No results for &quot;{searchQuery}&quot;
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Wishlist */}
            <Link
              href="/wishlist"
              className="relative rounded-xl p-2 text-neutral-600 transition-all hover:bg-[#FFF1F3] hover:text-[#E84672]"
              aria-label="Wishlist"
            >
              <RiHeartLine size={20} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#E84672] text-[10px] font-bold text-white">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative rounded-xl p-2 text-neutral-600 transition-all hover:bg-[#FFF1F3] hover:text-[#E84672]"
              aria-label="Cart"
            >
              <RiShoppingCartLine size={20} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#E84672] text-[10px] font-bold text-white">
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            {user ? (
              <div ref={userMenuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-1.5 rounded-xl py-1 pr-2 pl-1 transition-colors hover:bg-[#F7F6F0]"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#E84672] to-[#C9305A] text-sm font-semibold text-white">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <RiArrowDownSLine
                    size={16}
                    className={cn(
                      "text-neutral-400 transition-transform duration-200",
                      userMenuOpen && "rotate-180",
                    )}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      className="absolute top-12 right-0 w-52 overflow-hidden rounded-2xl border border-[#EBE8D8] bg-[#FFFDF7] py-2 shadow-xl"
                    >
                      <div className="mb-1 border-b border-[#EBE8D8] px-4 py-2">
                        <p className="truncate text-sm font-semibold text-neutral-800">
                          {user.name}
                        </p>
                        <p className="truncate text-xs text-neutral-400">{user.email}</p>
                      </div>
                      {user.role === "admin" && (
                        <Link
                          href="/admin/dashboard"
                          className="menu-item"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <RiShieldUserLine size={16} /> Admin Panel
                        </Link>
                      )}
                      <Link
                        href="/account"
                        className="menu-item"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <RiUserLine size={16} /> My Account
                      </Link>
                      <Link
                        href="/orders"
                        className="menu-item"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <RiDashboardLine size={16} /> My Orders
                      </Link>
                      <Link
                        href="/account/addresses"
                        className="menu-item"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        <RiMapPinLine size={16} /> Addresses
                      </Link>
                      <div className="mt-1 border-t border-[#EBE8D8] pt-1">
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          className="menu-item w-full text-red-500 hover:bg-red-50"
                        >
                          <RiLogoutBoxLine size={16} /> Log out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                className="hidden items-center gap-1.5 rounded-xl bg-[#E84672] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#C9305A] sm:flex"
              >
                <RiUserLine size={16} /> Login
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="rounded-xl p-2 text-neutral-600 transition-colors hover:bg-[#F7F6F0] lg:hidden"
            >
              {mobileOpen ? <RiCloseLine size={22} /> : <RiMenuLine size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border-t border-[#EBE8D8] bg-[#FFFDF7] lg:hidden"
          >
            <nav className="container-wide flex flex-col gap-1 py-4">
              {topCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-[#F7F6F0] hover:text-[#E84672]"
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                href="/products"
                className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-neutral-700 transition-colors hover:bg-[#F7F6F0] hover:text-[#E84672]"
              >
                All Products
              </Link>
              {!user && (
                <div className="flex gap-2 border-t border-[#EBE8D8] pt-3">
                  <Link
                    href="/login"
                    className="flex-1 rounded-xl bg-[#E84672] py-2.5 text-center text-sm font-medium text-white"
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    className="flex-1 rounded-xl border-2 border-[#E84672] py-2.5 text-center text-sm font-medium text-[#E84672]"
                  >
                    Register
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .menu-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          color: #44403c;
          transition:
            background 0.15s,
            color 0.15s;
          cursor: pointer;
          text-decoration: none;
        }
        .menu-item:hover {
          background: #f7f6f0;
          color: #1c1917;
        }
      `}</style>
    </header>
  );
}
