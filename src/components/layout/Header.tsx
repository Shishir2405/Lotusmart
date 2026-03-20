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

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

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
      style={{
        position: "sticky",
        top: 0,
        zIndex: 40,
        width: "100%",
        backgroundColor: scrolled ? "rgba(255,253,247,0.95)" : "#FFFDF7",
        boxShadow: scrolled ? "0 1px 20px rgba(0,0,0,0.06)" : "none",
        backdropFilter: scrolled ? "blur(12px)" : "none",
        transition: "all 0.3s ease",
      }}
    >
      {/* Top announcement bar */}
      <div
        style={{
          backgroundColor: "#4D4529",
          padding: "0.5rem 1rem",
          textAlign: "center",
          fontSize: "0.75rem",
          fontWeight: 500,
          color: "#FFF9E8",
        }}
        className="header-topbar"
      >
        🌸 Free shipping on orders above ₹500 &nbsp;|&nbsp; Fresh stock added weekly
      </div>

      {/* Main header row */}
      <div className="container-wide">
        <div
          style={{
            display: "flex",
            height: "4rem",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "1rem",
          }}
        >
          {/* Logo */}
          <Link
            href="/"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flexShrink: 0,
              textDecoration: "none",
            }}
          >
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "#4D4529",
              }}
            >
              Lotus<span style={{ color: "#E84672" }}>Mart</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav
            className="header-nav"
            style={{ display: "none", alignItems: "center", gap: "1.5rem" }}
          >
            {topCategories.map((cat) => (
              <Link
                key={cat.slug}
                href={`/categories/${cat.slug}`}
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: pathname?.includes(cat.slug) ? "#E84672" : "#57534e",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E84672")}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.color = pathname?.includes(cat.slug)
                    ? "#E84672"
                    : "#57534e")
                }
              >
                {cat.name}
              </Link>
            ))}
            <Link
              href="/products"
              style={{
                fontSize: "0.875rem",
                fontWeight: 500,
                color: pathname === "/products" ? "#E84672" : "#57534e",
                textDecoration: "none",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#E84672")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = pathname === "/products" ? "#E84672" : "#57534e")
              }
            >
              All Products
            </Link>
          </nav>

          {/* Right icons */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
            {/* Search */}
            <div ref={searchRef} style={{ position: "relative" }}>
              <button
                onClick={() => setSearchOpen((v) => !v)}
                aria-label="Search"
                style={{
                  borderRadius: "0.75rem",
                  padding: "0.5rem",
                  color: "#57534e",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "background 0.2s, color 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#FFF1F3";
                  e.currentTarget.style.color = "#E84672";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#57534e";
                }}
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
                    style={{
                      position: "absolute",
                      top: "3rem",
                      right: 0,
                      width: "20rem",
                      overflow: "hidden",
                      borderRadius: "1rem",
                      border: "1px solid #EBE8D8",
                      backgroundColor: "#FFFDF7",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
                      zIndex: 50,
                    }}
                  >
                    <form onSubmit={handleSearchSubmit} style={{ padding: "0.75rem" }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          borderRadius: "0.75rem",
                          backgroundColor: "#F7F6F0",
                          padding: "0.5rem 0.75rem",
                        }}
                      >
                        <RiSearchLine size={15} style={{ color: "#a8a29e", flexShrink: 0 }} />
                        <input
                          autoFocus
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search products..."
                          style={{
                            flex: 1,
                            background: "transparent",
                            fontSize: "0.875rem",
                            color: "#292524",
                            outline: "none",
                            border: "none",
                            minWidth: 0,
                          }}
                        />
                        {searchQuery && (
                          <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            style={{
                              background: "none",
                              border: "none",
                              cursor: "pointer",
                              padding: 0,
                              color: "#a8a29e",
                              display: "flex",
                            }}
                          >
                            <RiCloseLine size={15} />
                          </button>
                        )}
                      </div>
                    </form>

                    {searchLoading && (
                      <div
                        style={{
                          padding: "1.5rem 1rem",
                          textAlign: "center",
                          fontSize: "0.875rem",
                          color: "#a8a29e",
                        }}
                      >
                        Searching...
                      </div>
                    )}

                    {!searchLoading && searchResults.length > 0 && (
                      <ul style={{ listStyle: "none", padding: "0 0 0.5rem", margin: 0 }}>
                        {searchResults.map((r) => (
                          <li key={r._id}>
                            <Link
                              href={`/products/${r.slug}`}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "0.75rem",
                                padding: "0.625rem 1rem",
                                textDecoration: "none",
                                transition: "background 0.15s",
                              }}
                              onClick={() => {
                                setSearchOpen(false);
                                setSearchQuery("");
                              }}
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.backgroundColor = "#F7F6F0")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.backgroundColor = "transparent")
                              }
                            >
                              <div
                                style={{
                                  width: "2.5rem",
                                  height: "2.5rem",
                                  flexShrink: 0,
                                  overflow: "hidden",
                                  borderRadius: "0.5rem",
                                  backgroundColor: "#EBE8D8",
                                }}
                              >
                                {r.images?.[0] && (
                                  <img
                                    src={r.images[0]}
                                    alt={r.name}
                                    style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                  />
                                )}
                              </div>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <p
                                  style={{
                                    fontSize: "0.875rem",
                                    fontWeight: 500,
                                    color: "#292524",
                                    margin: 0,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {r.name}
                                </p>
                                <p
                                  style={{
                                    fontSize: "0.75rem",
                                    fontWeight: 600,
                                    color: "#E84672",
                                    margin: 0,
                                  }}
                                >
                                  ₹{r.price}
                                </p>
                              </div>
                            </Link>
                          </li>
                        ))}
                      </ul>
                    )}

                    {!searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
                      <div
                        style={{
                          padding: "1.5rem 1rem",
                          textAlign: "center",
                          fontSize: "0.875rem",
                          color: "#a8a29e",
                        }}
                      >
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
              aria-label="Wishlist"
              style={{
                position: "relative",
                borderRadius: "0.75rem",
                padding: "0.5rem",
                color: "#57534e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FFF1F3";
                e.currentTarget.style.color = "#E84672";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#57534e";
              }}
            >
              <RiHeartLine size={20} />
              {wishlistCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-2px",
                    right: "-2px",
                    width: "1rem",
                    height: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "9999px",
                    backgroundColor: "#E84672",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    color: "#ffffff",
                  }}
                >
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link
              href="/cart"
              aria-label="Cart"
              style={{
                position: "relative",
                borderRadius: "0.75rem",
                padding: "0.5rem",
                color: "#57534e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s, color 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#FFF1F3";
                e.currentTarget.style.color = "#E84672";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#57534e";
              }}
            >
              <RiShoppingCartLine size={20} />
              {cartCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-2px",
                    right: "-2px",
                    width: "1rem",
                    height: "1rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "9999px",
                    backgroundColor: "#E84672",
                    fontSize: "0.625rem",
                    fontWeight: 700,
                    color: "#ffffff",
                  }}
                >
                  {cartCount > 9 ? "9+" : cartCount}
                </span>
              )}
            </Link>

            {/* User menu */}
            {user ? (
              <div ref={userMenuRef} style={{ position: "relative" }}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.375rem",
                    borderRadius: "0.75rem",
                    padding: "0.25rem 0.5rem 0.25rem 0.25rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    transition: "background 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F7F6F0")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <div
                    style={{
                      width: "2rem",
                      height: "2rem",
                      borderRadius: "9999px",
                      background: "linear-gradient(135deg, #E84672, #C9305A)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.875rem",
                      fontWeight: 600,
                      color: "#ffffff",
                      flexShrink: 0,
                    }}
                  >
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                  <RiArrowDownSLine
                    size={16}
                    style={{
                      color: "#a8a29e",
                      transition: "transform 0.2s",
                      transform: userMenuOpen ? "rotate(180deg)" : "rotate(0deg)",
                    }}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ duration: 0.15 }}
                      style={{
                        position: "absolute",
                        top: "3rem",
                        right: 0,
                        width: "13rem",
                        overflow: "hidden",
                        borderRadius: "1rem",
                        border: "1px solid #EBE8D8",
                        backgroundColor: "#FFFDF7",
                        paddingTop: "0.5rem",
                        paddingBottom: "0.5rem",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.12)",
                        zIndex: 50,
                      }}
                    >
                      <div
                        style={{
                          padding: "0.5rem 1rem 0.75rem",
                          borderBottom: "1px solid #EBE8D8",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <p
                          style={{
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "#292524",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {user.name}
                        </p>
                        <p
                          style={{
                            fontSize: "0.75rem",
                            color: "#a8a29e",
                            margin: 0,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {user.email}
                        </p>
                      </div>

                      {user.role === "admin" && (
                        <MenuLink
                          href="/admin/dashboard"
                          icon={<RiShieldUserLine size={15} />}
                          onClick={() => setUserMenuOpen(false)}
                        >
                          Admin Panel
                        </MenuLink>
                      )}
                      <MenuLink
                        href="/account"
                        icon={<RiUserLine size={15} />}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        My Account
                      </MenuLink>
                      <MenuLink
                        href="/orders"
                        icon={<RiDashboardLine size={15} />}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        My Orders
                      </MenuLink>
                      <MenuLink
                        href="/account/addresses"
                        icon={<RiMapPinLine size={15} />}
                        onClick={() => setUserMenuOpen(false)}
                      >
                        Addresses
                      </MenuLink>

                      <div
                        style={{
                          marginTop: "0.25rem",
                          borderTop: "1px solid #EBE8D8",
                          paddingTop: "0.25rem",
                        }}
                      >
                        <button
                          onClick={() => {
                            setUserMenuOpen(false);
                            logout();
                          }}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.5rem",
                            width: "100%",
                            padding: "0.5rem 1rem",
                            fontSize: "0.8125rem",
                            fontWeight: 500,
                            color: "#ef4444",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            textAlign: "left",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#FEF2F2")}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "transparent")
                          }
                        >
                          <RiLogoutBoxLine size={15} /> Log out
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link
                href="/login"
                className="header-login-btn"
                style={{
                  display: "none",
                  alignItems: "center",
                  gap: "0.375rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "#E84672",
                  padding: "0.5rem 1rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#ffffff",
                  textDecoration: "none",
                  transition: "background-color 0.2s",
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#C9305A")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#E84672")}
              >
                <RiUserLine size={16} /> Login
              </Link>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((v) => !v)}
              className="header-hamburger"
              style={{
                borderRadius: "0.75rem",
                padding: "0.5rem",
                color: "#57534e",
                background: "none",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#F7F6F0")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
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
            style={{
              overflow: "hidden",
              borderTop: "1px solid #EBE8D8",
              backgroundColor: "#FFFDF7",
            }}
            className="header-mobile-menu"
          >
            <nav
              className="container-wide"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "0.25rem",
                paddingTop: "1rem",
                paddingBottom: "1rem",
              }}
            >
              {topCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                    borderRadius: "0.75rem",
                    padding: "0.625rem 0.75rem",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "#44403c",
                    textDecoration: "none",
                    transition: "background 0.15s, color 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#F7F6F0";
                    e.currentTarget.style.color = "#E84672";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.color = "#44403c";
                  }}
                >
                  {cat.name}
                </Link>
              ))}
              <Link
                href="/products"
                style={{
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "0.75rem",
                  padding: "0.625rem 0.75rem",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "#44403c",
                  textDecoration: "none",
                  transition: "background 0.15s, color 0.15s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = "#F7F6F0";
                  e.currentTarget.style.color = "#E84672";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#44403c";
                }}
              >
                All Products
              </Link>

              {!user && (
                <div
                  style={{
                    display: "flex",
                    gap: "0.5rem",
                    borderTop: "1px solid #EBE8D8",
                    paddingTop: "0.75rem",
                    marginTop: "0.25rem",
                  }}
                >
                  <Link
                    href="/login"
                    style={{
                      flex: 1,
                      borderRadius: "0.75rem",
                      backgroundColor: "#E84672",
                      padding: "0.625rem",
                      textAlign: "center",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "#ffffff",
                      textDecoration: "none",
                    }}
                  >
                    Login
                  </Link>
                  <Link
                    href="/register"
                    style={{
                      flex: 1,
                      borderRadius: "0.75rem",
                      border: "2px solid #E84672",
                      padding: "0.625rem",
                      textAlign: "center",
                      fontSize: "0.875rem",
                      fontWeight: 500,
                      color: "#E84672",
                      textDecoration: "none",
                    }}
                  >
                    Register
                  </Link>
                </div>
              )}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// Small helper component for dropdown menu items
function MenuLink({
  href,
  icon,
  children,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        padding: "0.5rem 1rem",
        fontSize: "0.8125rem",
        fontWeight: 500,
        color: "#44403c",
        textDecoration: "none",
        transition: "background 0.15s, color 0.15s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = "#F7F6F0";
        e.currentTarget.style.color = "#1c1917";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = "transparent";
        e.currentTarget.style.color = "#44403c";
      }}
    >
      {icon}
      {children}
    </Link>
  );
}
