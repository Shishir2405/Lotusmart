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
  RiArrowRightLine,
  RiMapPinLine,
  RiLogoutBoxLine,
  RiDashboardLine,
  RiShieldUserLine,
  RiSparklingLine,
  RiHeartPulseLine,
  RiQuestionLine,
  RiPhoneLine,
  RiTruckLine,
  RiRefundLine,
  RiSettings3Line,
  RiNotification3Line,
  RiStarLine,
  RiCoupon3Line,
  RiLeafLine,
  RiGiftLine,
} from "react-icons/ri";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { useAuthStore } from "@/store/auth.store";
import { useAuth } from "@/hooks/useAuth";
import { useDebounce } from "@/hooks/useDebounce";
import axios from "axios";
import { CATEGORIES } from "@/config/constants";
import { LanguageToggler } from "@/components/shared/LanguageToggler";
import { normalizeImageUrl } from "@/utils/helpers";


interface SearchResult {
  _id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
}


interface NavCategory {
  name: string;
  slug: string;
  icon: typeof RiLeafLine;
  desc: string;
  color: string;
  colorLight: string;
  image?: string;
  sub: { label: string; slug: string; badge: string | null }[];
  featured: {
    label: string;
    desc: string;
    href: string;
    image: string;
  };
}

const COLOR_ROTATION = [
  { color: "#E84672", colorLight: "#FFF1F3" },
  { color: "#7A6E42", colorLight: "#F7F6F0" },
  { color: "#D97706", colorLight: "#FFFBEB" },
  { color: "#16A34A", colorLight: "#F0FDF4" },
  { color: "#7C3AED", colorLight: "#F5F3FF" },
  { color: "#0891B2", colorLight: "#ECFEFF" },
];

const ICON_ROTATION = [RiLeafLine, RiGiftLine, RiLeafLine, RiGiftLine, RiLeafLine, RiGiftLine];

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=260&h=160&fit=crop&q=80",
  "https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=260&h=160&fit=crop&q=80",
  "https://images.unsplash.com/photo-1508061253366-f7da158b6d46?w=260&h=160&fit=crop&q=80",
  "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?w=260&h=160&fit=crop&q=80",
  "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=260&h=160&fit=crop&q=80",
];

interface APICategory {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parent?: string | { _id: string } | null;
  isActive: boolean;
  sortOrder: number;
}

function fallbackAPICategories(): APICategory[] {
  const result: APICategory[] = [];
  CATEGORIES.forEach((cat, i) => {
    const parentId = `fallback-${cat.slug}`;
    result.push({
      _id: parentId,
      name: cat.name,
      slug: cat.slug,
      isActive: true,
      sortOrder: i,
      parent: null,
    });
    cat.subcategories.forEach((sub, j) => {
      result.push({
        _id: `fallback-${sub.slug}`,
        name: sub.name,
        slug: sub.slug,
        isActive: true,
        sortOrder: j,
        parent: parentId,
      });
    });
  });
  return result;
}

// Used when API returns top-level cats with populated `children` array
function buildNavCategoriesFromPopulated(apiCats: (APICategory & { children?: APICategory[] })[]): NavCategory[] {
  const topLevel = apiCats
    .filter((c) => c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return topLevel.map((cat, i) => {
    const children = (cat.children ?? [])
      .filter((c) => c.isActive)
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const colors = COLOR_ROTATION[i % COLOR_ROTATION.length];
    const Icon = ICON_ROTATION[i % ICON_ROTATION.length];
    const fallbackImg = FALLBACK_IMAGES[i % FALLBACK_IMAGES.length];

    return {
      name: cat.name,
      slug: cat.slug,
      icon: Icon,
      desc: cat.description || `Explore ${cat.name}`,
      color: colors.color,
      colorLight: colors.colorLight,
      image: cat.image,
      sub: children.map((child) => ({
        label: child.name,
        slug: child.slug,
        badge: null,
      })),
      featured: {
        label: `${cat.name} Collection`,
        desc: `Explore our premium ${cat.name.toLowerCase()}`,
        href: `/categories/${cat.slug}`,
        image: cat.image || fallbackImg,
      },
    };
  });
}

// Used for flat list fallback (all cats in one array with parent references)
function buildNavCategories(apiCats: APICategory[]): NavCategory[] {
  const topLevel = apiCats
    .filter((c) => !c.parent && c.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  return topLevel.map((cat, i) => {
    const children = apiCats
      .filter((c) => {
        const parentId = typeof c.parent === "object" && c.parent ? c.parent._id : c.parent;
        return parentId === cat._id && c.isActive;
      })
      .sort((a, b) => a.sortOrder - b.sortOrder);

    const colors = COLOR_ROTATION[i % COLOR_ROTATION.length];
    const Icon = ICON_ROTATION[i % ICON_ROTATION.length];
    const fallbackImg = FALLBACK_IMAGES[i % FALLBACK_IMAGES.length];

    return {
      name: cat.name,
      slug: cat.slug,
      icon: Icon,
      desc: cat.description || `Explore ${cat.name}`,
      color: colors.color,
      colorLight: colors.colorLight,
      image: cat.image,
      sub: children.map((child) => ({
        label: child.name,
        slug: child.slug,
        badge: null,
      })),
      featured: {
        label: `${cat.name} Collection`,
        desc: `Explore our premium ${cat.name.toLowerCase()}`,
        href: `/categories/${cat.slug}`,
        image: cat.image || fallbackImg,
      },
    };
  });
}


const PROFILE_SECTIONS = [
  {
    title: "My Activity",
    items: [
      {
        icon: RiHeartPulseLine,
        label: "My Orders",
        href: "/orders",
        badge: null,
        color: "#7A6E42",
      },
      {
        icon: RiHeartLine,
        label: "Wishlist",
        href: "/wishlist",
        badge: "wishlist",
        color: "#E84672",
      },
      {
        icon: RiStarLine,
        label: "Reviews & Ratings",
        href: "/account/reviews",
        badge: null,
        color: "#D97706",
      },
      {
        icon: RiCoupon3Line,
        label: "Coupons & Offers",
        href: "/account/coupons",
        badge: "2 new",
        color: "#16A34A",
      },
    ],
  },
  {
    title: "Account",
    items: [
      { icon: RiUserLine, label: "My Profile", href: "/account", badge: null, color: "#2563EB" },
      {
        icon: RiMapPinLine,
        label: "Saved Addresses",
        href: "/account/addresses",
        badge: null,
        color: "#7C3AED",
      },
      {
        icon: RiNotification3Line,
        label: "Notifications",
        href: "/account/notifications",
        badge: "3",
        color: "#E84672",
      },
      {
        icon: RiSettings3Line,
        label: "Settings",
        href: "/account/settings",
        badge: null,
        color: "#57534e",
      },
    ],
  },
  {
    title: "Help & Support",
    items: [
      {
        icon: RiTruckLine,
        label: "Track My Order",
        href: "/orders/track",
        badge: null,
        color: "#D97706",
      },
      {
        icon: RiRefundLine,
        label: "Returns & Refunds",
        href: "/returns",
        badge: null,
        color: "#16A34A",
      },
      { icon: RiQuestionLine, label: "FAQs", href: "/faqs", badge: null, color: "#7C3AED" },
      {
        icon: RiPhoneLine,
        label: "Contact Support",
        href: "/contact",
        badge: null,
        color: "#E84672",
      },
    ],
  },
];


function IconBtn({
  children,
  label,
  badge,
  onClick,
  href,
}: {
  children: React.ReactNode;
  label: string;
  badge?: number;
  onClick?: () => void;
  href?: string;
}) {
  const inner = (
    <motion.span
      whileHover={{ backgroundColor: "#FFF1F3", color: "#E84672" }}
      whileTap={{ scale: 0.91 }}
      transition={{ duration: 0.15 }}
      className="relative flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl"
      style={{ color: "#57534e" }}
      aria-label={label}
    >
      {children}
      <AnimatePresence>
        {badge !== undefined && badge > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 18 }}
            className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full font-bold text-white"
            style={{ fontSize: "0.58rem", backgroundColor: "#E84672" }}
          >
            {badge > 9 ? "9+" : badge}
          </motion.span>
        )}
      </AnimatePresence>
    </motion.span>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return (
    <button onClick={onClick} style={{ background: "none", border: "none", padding: 0 }}>
      {inner}
    </button>
  );
}


function CategoryMegaMenu({
  cat,
  onClose,
}: {
  cat: NavCategory;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="absolute top-full z-50 mt-2 overflow-hidden rounded-3xl border"
      style={{
        left: "50%",
        transform: "translateX(-50%)",
        width: "640px",
        backgroundColor: "#FFFDF7",
        borderColor: "#EBE8D8",
        boxShadow: "0 28px 80px rgba(0,0,0,0.14)",
      }}
    >
      <div className="grid grid-cols-[1fr_220px]">
        
        <div className="p-5">
          
          <div
            className="mb-4 flex items-center gap-2.5 border-b pb-3.5"
            style={{ borderColor: "#EBE8D8" }}
          >
            <span
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: cat.colorLight }}
            >
              <cat.icon size={16} style={{ color: cat.color }} />
            </span>
            <div className="flex-1">
              <p className="text-sm leading-tight font-bold" style={{ color: "#1c1917" }}>
                {cat.name}
              </p>
              <p className="mt-0.5 text-xs leading-tight" style={{ color: "#a8a29e" }}>
                {cat.desc}
              </p>
            </div>
            <Link href={`/categories/${cat.slug}`} onClick={onClose}>
              <motion.span
                whileHover={{ x: 2 }}
                className="inline-flex cursor-pointer items-center gap-1 text-xs font-semibold"
                style={{ color: cat.color }}
              >
                All {cat.name} <RiArrowRightLine size={12} />
              </motion.span>
            </Link>
          </div>

          
          <div className="grid grid-cols-2 gap-0.5">
            {cat.sub.map((sub, i) => (
              <motion.div
                key={sub.slug}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.035, duration: 0.2 }}
              >
                <Link href={`/categories/${sub.slug}`} onClick={onClose}>
                  <motion.span
                    whileHover={{ backgroundColor: cat.colorLight, x: 3 }}
                    transition={{ duration: 0.13 }}
                    className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2"
                  >
                    <span className="text-[0.82rem] font-medium" style={{ color: "#44403c" }}>
                      {sub.label}
                    </span>
                    {sub.badge && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[0.57rem] leading-none font-bold"
                        style={{ backgroundColor: cat.colorLight, color: cat.color }}
                      >
                        {sub.badge}
                      </span>
                    )}
                  </motion.span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        
        <div
          className="border-l p-4"
          style={{ borderColor: "#EBE8D8", backgroundColor: "#FAFAF8" }}
        >
          <p
            className="mb-3 text-[0.62rem] font-bold tracking-widest uppercase"
            style={{ color: "#B8AE86" }}
          >
            Featured
          </p>
          <Link href={cat.featured.href} onClick={onClose}>
            <motion.div
              whileHover={{ y: -4, boxShadow: "0 16px 40px rgba(0,0,0,0.11)" }}
              transition={{ duration: 0.2 }}
              className="cursor-pointer overflow-hidden rounded-2xl border"
              style={{ borderColor: "#EBE8D8" }}
            >
              <div className="relative h-28 overflow-hidden">
                <img
                  src={normalizeImageUrl(cat.featured.image)}
                  alt={cat.featured.label}
                  className="h-full w-full object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent" />
              </div>
              <div className="bg-white p-3">
                <p className="text-[0.82rem] leading-tight font-bold" style={{ color: "#1c1917" }}>
                  {cat.featured.label}
                </p>
                <p className="mt-0.5 text-[0.72rem]" style={{ color: "#a8a29e" }}>
                  {cat.featured.desc}
                </p>
                <motion.span
                  className="mt-2 inline-flex items-center gap-1 text-[0.72rem] font-semibold"
                  style={{ color: cat.color }}
                  whileHover={{ gap: "0.4rem" }}
                >
                  Shop now <RiArrowRightLine size={11} />
                </motion.span>
              </div>
            </motion.div>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}


function ProfileDropdown({
  user,
  wishlistCount,
  onClose,
  onLogout,
}: {
  user: { name: string; email: string; role?: string };
  wishlistCount: number;
  onClose: () => void;
  onLogout: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.96 }}
      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
      className="absolute top-14 right-0 z-50 w-72 overflow-hidden rounded-3xl border"
      style={{
        backgroundColor: "#FFFDF7",
        borderColor: "#EBE8D8",
        boxShadow: "0 28px 80px rgba(0,0,0,0.14)",
      }}
    >
      
      <div
        className="relative overflow-hidden px-5 py-4"
        style={{ background: "linear-gradient(135deg, #1c1914 0%, #4D4529 100%)" }}
      >
        
        <div
          className="pointer-events-none absolute -top-8 -right-8 h-28 w-28 rounded-full"
          style={{ border: "1.5px solid rgba(255,224,138,0.2)" }}
        />
        <div
          className="pointer-events-none absolute -top-2 -right-2 h-16 w-16 rounded-full"
          style={{ border: "1.5px solid rgba(255,224,138,0.12)" }}
        />

        <div className="relative z-10 flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.06 }}
            className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl text-base font-black text-white shadow-lg"
            style={{ background: "linear-gradient(135deg, #E84672, #C9305A)" }}
          >
            {user.name?.charAt(0).toUpperCase()}
          </motion.div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm leading-tight font-bold text-white">{user.name}</p>
            <p className="mt-0.5 truncate text-xs" style={{ color: "#9C8F62" }}>
              {user.email}
            </p>
          </div>
          {user.role === "admin" && (
            <Link href="/admin/dashboard" onClick={onClose}>
              <motion.span
                whileHover={{ scale: 1.05 }}
                className="inline-flex cursor-pointer items-center gap-1 rounded-lg px-2 py-1 text-[0.6rem] font-bold"
                style={{
                  backgroundColor: "rgba(232,70,114,0.2)",
                  color: "#E84672",
                  border: "1px solid rgba(232,70,114,0.3)",
                }}
              >
                <RiShieldUserLine size={9} /> Admin
              </motion.span>
            </Link>
          )}
        </div>

        {/* Quick links */}
        <div className="relative z-10 mt-4 grid grid-cols-3 gap-1.5">
          {[
            { label: "Orders", href: "/account", icon: RiHeartPulseLine },
            { label: "Wishlist", href: "/wishlist", icon: RiHeartLine, count: wishlistCount },
            { label: "Reviews", href: "/account", icon: RiStarLine },
          ].map(({ label, href, icon: Icon, count }) => (
            <Link key={label} href={href} onClick={onClose}>
              <motion.div
                whileHover={{ backgroundColor: "rgba(255,255,255,0.13)" }}
                transition={{ duration: 0.13 }}
                className="flex cursor-pointer flex-col items-center rounded-xl py-2"
                style={{ backgroundColor: "rgba(255,255,255,0.07)" }}
              >
                <Icon size={12} style={{ color: "#FFE08A", marginBottom: 2 }} />
                <span className="text-[0.68rem] font-semibold text-white">{label}</span>
                {count != null && count > 0 && (
                  <span className="mt-0.5 text-[0.58rem]" style={{ color: "#FFE08A" }}>
                    {count}
                  </span>
                )}
              </motion.div>
            </Link>
          ))}
        </div>
      </div>

      
      <div className="max-h-[320px] overflow-y-auto py-1.5" style={{ scrollbarWidth: "none" }}>
        {PROFILE_SECTIONS.map((section, si) => (
          <div key={section.title}>
            {si > 0 && <div className="mx-3 my-1 border-t" style={{ borderColor: "#EBE8D8" }} />}
            <p
              className="px-4 pt-2.5 pb-1 text-[0.6rem] font-black tracking-widest uppercase"
              style={{ color: "#C8BF9A" }}
            >
              {section.title}
            </p>
            {section.items.map((item, i) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: si * 0.04 + i * 0.025, duration: 0.18 }}
              >
                <Link href={item.href} onClick={onClose}>
                  <motion.span
                    whileHover={{ backgroundColor: "#F7F6F0", x: 2 }}
                    transition={{ duration: 0.12 }}
                    className="mx-1 flex cursor-pointer items-center justify-between rounded-xl px-3 py-1.5"
                  >
                    <span className="flex items-center gap-2.5">
                      <span
                        className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${item.color}15` }}
                      >
                        <item.icon size={13} style={{ color: item.color }} />
                      </span>
                      <span className="text-[0.82rem] font-medium" style={{ color: "#44403c" }}>
                        {item.label}
                      </span>
                    </span>
                    {item.badge && (
                      <span
                        className="rounded-full px-1.5 py-0.5 text-[0.58rem] leading-none font-bold"
                        style={{
                          backgroundColor:
                            item.badge === "wishlist"
                              ? wishlistCount > 0
                                ? "#FFF1F3"
                                : "#F7F6F0"
                              : "#FFF1F3",
                          color:
                            item.badge === "wishlist"
                              ? wishlistCount > 0
                                ? "#E84672"
                                : "#a8a29e"
                              : "#E84672",
                        }}
                      >
                        {item.badge === "wishlist" ? wishlistCount : item.badge}
                      </span>
                    )}
                  </motion.span>
                </Link>
              </motion.div>
            ))}
          </div>
        ))}
      </div>

      
      <div className="border-t px-3 pt-1 pb-3" style={{ borderColor: "#EBE8D8" }}>
        <motion.button
          whileHover={{ backgroundColor: "#FEF2F2" }}
          whileTap={{ scale: 0.97 }}
          onClick={onLogout}
          className="flex w-full cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5"
          style={{ background: "none", border: "none" }}
        >
          <span
            className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: "#FEE2E2" }}
          >
            <RiLogoutBoxLine size={13} style={{ color: "#ef4444" }} />
          </span>
          <span className="text-[0.82rem] font-semibold" style={{ color: "#ef4444" }}>
            Log out
          </span>
        </motion.button>
      </div>
    </motion.div>
  );
}


export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();
  const user = useAuthStore((s) => s.user);
  const rawCartCount = useCartStore((s) => s.getItemCount());
  const rawWishlistCount = useWishlistStore((s) => s.items.length);

  // Prevent hydration mismatch — show 0 until client mounts
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const cartCount = mounted ? rawCartCount : 0;
  const wishlistCount = mounted ? rawWishlistCount : 0;

  const [navCategories, setNavCategories] = useState<NavCategory[]>([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpandedCat, setMobileExpandedCat] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const debouncedSearch = useDebounce(searchQuery, 350);

  
  useEffect(() => {
    axios
      .get<{ data: APICategory[] }>("/api/categories?includeSubcategories=true")
      .then((r) => {
        const cats = buildNavCategoriesFromPopulated(r.data.data ?? []);
        if (cats.length > 0) {
          setNavCategories(cats);
        } else {
          setNavCategories(buildNavCategories(fallbackAPICategories()));
        }
      })
      .catch(() => {
        setNavCategories(buildNavCategories(fallbackAPICategories()));
      });
  }, []);

  
  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
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
    const h = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
        setSearchQuery("");
        setSearchResults([]);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
        setUserMenuOpen(false);
      if (navRef.current && !navRef.current.contains(e.target as Node)) setHoveredCat(null);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setHoveredCat(null);
  }, [pathname]);

  const handleCatHover = (slug: string | null) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    if (slug) {
      setHoveredCat(slug);
    } else {
      hoverTimeoutRef.current = setTimeout(() => setHoveredCat(null), 130);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim().length >= 2) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
      setSearchResults([]);
    }
  };

  const activeCatData = navCategories.find((c) => c.slug === hoveredCat) ?? null;

  return (
    <header
      className="sticky top-0 z-40 w-full transition-all duration-300"
      style={{
        backgroundColor: scrolled ? "rgba(255,253,247,0.96)" : "#FFFDF7",
        boxShadow: scrolled ? "0 1px 24px rgba(0,0,0,0.07)" : "none",
        backdropFilter: scrolled ? "blur(14px)" : "none",
      }}
    >
      
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: "auto", opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="hidden overflow-hidden sm:block"
        style={{ backgroundColor: "#2A2518" }}
      >
        <div className="flex items-center justify-center gap-6 px-4 py-2">
          <span className="text-[0.7rem] font-semibold tracking-wide" style={{ color: "#D4CFB3" }}>
            Free shipping on orders above ₹500
          </span>
          <span className="h-3 w-px opacity-30" style={{ backgroundColor: "#D4CFB3" }} />
          <span className="text-[0.7rem] font-semibold tracking-wide" style={{ color: "#FFE08A" }}>
            Fresh stock added every week
          </span>
          <span className="h-3 w-px opacity-30" style={{ backgroundColor: "#D4CFB3" }} />
          <Link href="/products">
            <motion.span
              whileHover={{ color: "#FFE08A" }}
              className="inline-flex cursor-pointer items-center gap-1 text-[0.7rem] font-semibold tracking-wide"
              style={{ color: "#D4CFB3" }}
            >
              <RiSparklingLine size={11} /> Browse all products
            </motion.span>
          </Link>
        </div>
      </motion.div>

      
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-8 lg:px-12">
        <div className="flex h-16 items-center justify-between gap-4">
          
          <Link href="/" className="flex-shrink-0">
            <motion.span
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex cursor-pointer items-center gap-0.5"
            >
              <span
                className="text-[1.45rem] leading-none font-black tracking-tight"
                style={{ color: "#2A2518" }}
              >
                Lotus
              </span>
              <span
                className="text-[1.45rem] leading-none font-black tracking-tight"
                style={{ color: "#E84672" }}
              >
                Mart
              </span>
            </motion.span>
          </Link>

          
          <nav
            ref={navRef}
            className="relative hidden items-center gap-0.5 lg:flex"
            onMouseLeave={() => handleCatHover(null)}
          >
            {navCategories.map((cat) => {
              const isActive = !!pathname?.includes(cat.slug);
              const isHovered = hoveredCat === cat.slug;
              return (
                <div
                  key={cat.slug}
                  className="relative"
                  onMouseEnter={() => handleCatHover(cat.slug)}
                >
                  <Link href={`/categories/${cat.slug}`}>
                    <motion.span
                      animate={{
                        color: isHovered || isActive ? cat.color : "#57534e",
                        backgroundColor: isHovered || isActive ? cat.colorLight : "transparent",
                      }}
                      transition={{ duration: 0.15 }}
                      className="inline-flex cursor-pointer items-center gap-1 rounded-xl px-3.5 py-2 text-[0.84rem] font-medium select-none"
                    >
                      {cat.name}
                      <motion.span
                        animate={{ rotate: isHovered ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <RiArrowDownSLine size={14} />
                      </motion.span>
                    </motion.span>
                  </Link>
                </div>
              );
            })}

            <Link href="/products">
              <motion.span
                whileHover={{ color: "#E84672", backgroundColor: "#FFF1F3" }}
                transition={{ duration: 0.15 }}
                className="inline-flex cursor-pointer items-center rounded-xl px-3.5 py-2 text-[0.84rem] font-medium select-none"
                style={{
                  color: pathname === "/products" ? "#E84672" : "#57534e",
                  backgroundColor: pathname === "/products" ? "#FFF1F3" : "transparent",
                }}
              >
                All Products
              </motion.span>
            </Link>

            <Link href="/blog">
              <motion.span
                whileHover={{ color: "#E84672", backgroundColor: "#FFF1F3" }}
                transition={{ duration: 0.15 }}
                className="inline-flex cursor-pointer items-center rounded-xl px-3.5 py-2 text-[0.84rem] font-medium select-none"
                style={{
                  color: pathname?.startsWith("/blog") ? "#E84672" : "#57534e",
                  backgroundColor: pathname?.startsWith("/blog") ? "#FFF1F3" : "transparent",
                }}
              >
                Blog
              </motion.span>
            </Link>

            
            <AnimatePresence>
              {activeCatData && (
                <div
                  className="absolute top-full left-0 z-50 pt-2"
                  style={{ width: "1px" }} 
                  onMouseEnter={() => handleCatHover(activeCatData.slug)}
                  onMouseLeave={() => handleCatHover(null)}
                >
                  <CategoryMegaMenu cat={activeCatData} onClose={() => setHoveredCat(null)} />
                </div>
              )}
            </AnimatePresence>
          </nav>

          
          <div className="flex items-center gap-0.5">
            
            <div ref={searchRef} className="relative hidden lg:block">
              <IconBtn label="Search" onClick={() => setSearchOpen((v) => !v)}>
                <RiSearchLine size={19} />
              </IconBtn>

              <AnimatePresence>
                {searchOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.97 }}
                    transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                    className="absolute top-12 right-0 z-50 w-80 overflow-hidden rounded-2xl border"
                    style={{
                      backgroundColor: "#FFFDF7",
                      borderColor: "#EBE8D8",
                      boxShadow: "0 20px 60px rgba(0,0,0,0.13)",
                    }}
                  >
                    <form onSubmit={handleSearchSubmit} className="p-3">
                      <div
                        className="flex items-center gap-2 rounded-xl px-3 py-2.5"
                        style={{ backgroundColor: "#F7F6F0", border: "1px solid #EBE8D8" }}
                      >
                        <RiSearchLine size={14} style={{ color: "#a8a29e", flexShrink: 0 }} />
                        <input
                          autoFocus
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search products..."
                          className="min-w-0 flex-1 border-none bg-transparent text-sm outline-none"
                          style={{ color: "#292524" }}
                        />
                        <AnimatePresence>
                          {searchQuery && (
                            <motion.button
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              exit={{ scale: 0 }}
                              type="button"
                              onClick={() => setSearchQuery("")}
                              className="flex h-4 w-4 flex-shrink-0 cursor-pointer items-center justify-center rounded-full"
                              style={{ backgroundColor: "#a8a29e", border: "none" }}
                            >
                              <RiCloseLine size={10} color="#fff" />
                            </motion.button>
                          )}
                        </AnimatePresence>
                      </div>
                    </form>

                    {searchLoading && (
                      <div
                        className="flex items-center justify-center gap-2 py-6 text-sm"
                        style={{ color: "#a8a29e" }}
                      >
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                          className="h-4 w-4 flex-shrink-0 rounded-full border-2"
                          style={{ borderColor: "#E84672", borderTopColor: "transparent" }}
                        />
                        Searching...
                      </div>
                    )}

                    {!searchLoading && searchResults.length > 0 && (
                      <ul
                        className="pb-2"
                        style={{ listStyle: "none", margin: 0, padding: "0 0 0.5rem" }}
                      >
                        {searchResults.map((r, i) => (
                          <motion.li
                            key={r._id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.04 }}
                          >
                            <Link
                              href={`/products/${r.slug}`}
                              onClick={() => {
                                setSearchOpen(false);
                                setSearchQuery("");
                              }}
                            >
                              <motion.span
                                whileHover={{ backgroundColor: "#F7F6F0" }}
                                className="flex cursor-pointer items-center gap-3 px-4 py-2.5"
                              >
                                <div
                                  className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl"
                                  style={{ backgroundColor: "#EBE8D8" }}
                                >
                                  {r.images?.[0] && (
                                    <img
                                      src={normalizeImageUrl(r.images[0])}
                                      alt={r.name}
                                      className="h-full w-full object-cover"
                                    />
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p
                                    className="truncate text-sm font-medium"
                                    style={{ color: "#292524" }}
                                  >
                                    {r.name}
                                  </p>
                                  <p className="text-xs font-semibold" style={{ color: "#E84672" }}>
                                    ₹{r.price}
                                  </p>
                                </div>
                                <RiArrowRightLine
                                  size={13}
                                  style={{ color: "#a8a29e", flexShrink: 0 }}
                                />
                              </motion.span>
                            </Link>
                          </motion.li>
                        ))}
                      </ul>
                    )}

                    {!searchLoading && searchQuery.length >= 2 && searchResults.length === 0 && (
                      <div className="py-6 text-center text-sm" style={{ color: "#a8a29e" }}>
                        No results for &quot;{searchQuery}&quot;
                      </div>
                    )}

                    {!searchQuery && (
                      <div className="px-4 pb-4">
                        <p
                          className="mb-2 text-[0.68rem] font-bold tracking-wider uppercase"
                          style={{ color: "#B8AE86" }}
                        >
                          Popular
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {["Cardamom", "Almonds", "Saffron", "Gift Box"].map((tag) => (
                            <button
                              key={tag}
                              onClick={() => setSearchQuery(tag)}
                              className="cursor-pointer rounded-lg border px-2.5 py-1 text-[0.75rem] font-medium"
                              style={{
                                backgroundColor: "#F7F6F0",
                                color: "#57534e",
                                borderColor: "#EBE8D8",
                              }}
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            
            <span className="hidden lg:block">
              <LanguageToggler />
            </span>

            
            <span className="hidden lg:block">
              <IconBtn label="Wishlist" badge={wishlistCount} href="/wishlist">
                <RiHeartLine size={19} />
              </IconBtn>
            </span>

            
            <span className="hidden lg:block">
              <IconBtn label="Cart" badge={cartCount} href="/cart">
                <RiShoppingCartLine size={19} />
              </IconBtn>
            </span>

            
            {user ? (
              <div ref={userMenuRef} className="relative">
                <motion.button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  whileHover={{ backgroundColor: "#F7F6F0" }}
                  whileTap={{ scale: 0.96 }}
                  className="flex cursor-pointer items-center gap-1.5 rounded-xl py-1 pr-2 pl-1"
                  style={{ background: "none", border: "none" }}
                >
                  <motion.div
                    whileHover={{ scale: 1.06 }}
                    className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: "linear-gradient(135deg, #E84672, #C9305A)" }}
                  >
                    {user.name?.charAt(0).toUpperCase()}
                  </motion.div>
                  <motion.span
                    animate={{ rotate: userMenuOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <RiArrowDownSLine size={15} style={{ color: "#a8a29e" }} />
                  </motion.span>
                </motion.button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <ProfileDropdown
                      user={user}
                      wishlistCount={wishlistCount}
                      onClose={() => setUserMenuOpen(false)}
                      onLogout={() => {
                        setUserMenuOpen(false);
                        logout();
                      }}
                    />
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link href="/login" className="ml-1 hidden lg:block">
                <motion.span
                  whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(232,70,114,0.22)" }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold text-white"
                  style={{ backgroundColor: "#E84672" }}
                >
                  <RiUserLine size={15} /> Login
                </motion.span>
              </Link>
            )}

            
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setMobileOpen((v) => !v)}
              className="ml-1 flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl lg:hidden"
              style={{ background: "none", border: "none", color: "#57534e" }}
            >
              <AnimatePresence mode="wait">
                {mobileOpen ? (
                  <motion.span
                    key="x"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.14 }}
                  >
                    <RiCloseLine size={22} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="m"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.14 }}
                  >
                    <RiMenuLine size={22} />
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </div>

      
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-50 lg:hidden"
            style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
            onClick={() => setMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="fixed top-0 right-0 z-50 flex h-full w-[280px] flex-col lg:hidden"
            style={{ backgroundColor: "#FFFDF7", boxShadow: "-8px 0 30px rgba(0,0,0,0.12)" }}
          >
            
            <div
              className="flex items-center justify-between px-5 py-4"
              style={{ borderBottom: "1px solid #EBE8D8" }}
            >
              <span className="text-sm font-bold tracking-wider uppercase" style={{ color: "#7A6E42" }}>
                Categories
              </span>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-xl"
                style={{ background: "none", border: "none", color: "#57534e" }}
              >
                <RiCloseLine size={20} />
              </motion.button>
            </div>

            
            <nav className="flex-1 overflow-y-auto px-3 py-3" style={{ scrollbarWidth: "none" }}>
              {navCategories.map((cat, i) => {
                const expanded = mobileExpandedCat === cat.slug;
                return (
                  <motion.div
                    key={cat.slug}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.25 }}
                  >
                    <button
                      onClick={() => setMobileExpandedCat(expanded ? null : cat.slug)}
                      className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2.5"
                      style={{
                        background: expanded ? cat.colorLight : "none",
                        border: "none",
                        color: expanded ? cat.color : "#44403c",
                      }}
                    >
                      <span className="flex items-center gap-2.5 text-sm font-medium">
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-lg"
                          style={{ backgroundColor: cat.colorLight }}
                        >
                          <cat.icon size={13} style={{ color: cat.color }} />
                        </span>
                        {cat.name}
                      </span>
                      <motion.span
                        animate={{ rotate: expanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <RiArrowDownSLine size={16} style={{ color: "#a8a29e" }} />
                      </motion.span>
                    </button>

                    <AnimatePresence>
                      {expanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          
                          <Link
                            href={`/categories/${cat.slug}`}
                            onClick={() => setMobileOpen(false)}
                          >
                            <span
                              className="flex items-center gap-2 rounded-xl px-4 py-2 pl-12 text-[0.78rem] font-semibold"
                              style={{ color: cat.color }}
                            >
                              All {cat.name} <RiArrowRightLine size={12} />
                            </span>
                          </Link>
                          {cat.sub.map((sub, j) => (
                            <motion.div
                              key={sub.slug}
                              initial={{ opacity: 0, x: 10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: j * 0.03, duration: 0.18 }}
                            >
                              <Link
                                href={`/categories/${sub.slug}`}
                                onClick={() => setMobileOpen(false)}
                              >
                                <motion.span
                                  whileHover={{ backgroundColor: cat.colorLight }}
                                  className="flex cursor-pointer items-center justify-between rounded-xl px-4 py-2 pl-12"
                                >
                                  <span
                                    className="text-[0.79rem] font-medium"
                                    style={{ color: "#57534e" }}
                                  >
                                    {sub.label}
                                  </span>
                                  {sub.badge && (
                                    <span
                                      className="rounded-full px-1.5 py-0.5 text-[0.55rem] font-bold"
                                      style={{
                                        backgroundColor: cat.colorLight,
                                        color: cat.color,
                                      }}
                                    >
                                      {sub.badge}
                                    </span>
                                  )}
                                </motion.span>
                              </Link>
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}

              
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: navCategories.length * 0.05, duration: 0.25 }}
                className="mt-1"
                style={{ borderTop: "1px solid #EBE8D8", paddingTop: "0.5rem" }}
              >
                <Link href="/products" onClick={() => setMobileOpen(false)}>
                  <motion.span
                    whileHover={{ backgroundColor: "#FFF1F3", color: "#E84672" }}
                    className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium"
                    style={{ color: "#44403c" }}
                  >
                    All Products <RiArrowRightLine size={14} style={{ color: "#D4CFB3" }} />
                  </motion.span>
                </Link>
                <Link href="/blog" onClick={() => setMobileOpen(false)}>
                  <motion.span
                    whileHover={{ backgroundColor: "#FFF1F3", color: "#E84672" }}
                    className="flex cursor-pointer items-center justify-between rounded-xl px-3 py-2.5 text-sm font-medium"
                    style={{ color: "#44403c" }}
                  >
                    Blog <RiArrowRightLine size={14} style={{ color: "#D4CFB3" }} />
                  </motion.span>
                </Link>
              </motion.div>
            </nav>

            
            <div className="px-4 pb-5 pt-2" style={{ borderTop: "1px solid #EBE8D8" }}>
              <LanguageToggler />
              {!user && (
                <div className="mt-3 flex gap-2">
                  <Link href="/login" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <span
                      className="flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold text-white"
                      style={{ backgroundColor: "#E84672" }}
                    >
                      Login
                    </span>
                  </Link>
                  <Link href="/register" className="flex-1" onClick={() => setMobileOpen(false)}>
                    <span
                      className="flex w-full items-center justify-center rounded-xl border-2 py-2.5 text-sm font-semibold"
                      style={{ color: "#E84672", borderColor: "#E84672" }}
                    >
                      Register
                    </span>
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
