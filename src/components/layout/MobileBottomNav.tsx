"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiHomeLine,
  RiHomeFill,
  RiSearchLine,
  RiSearchFill,
  RiShoppingCartLine,
  RiShoppingCartFill,
  RiHeartLine,
  RiHeartFill,
  RiUserLine,
  RiUserFill,
} from "react-icons/ri";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { useAuthStore } from "@/store/auth.store";

const NAV_ITEMS = [
  {
    label: "Home",
    href: "/",
    icon: RiHomeLine,
    activeIcon: RiHomeFill,
  },
  {
    label: "Search",
    href: "/search",
    icon: RiSearchLine,
    activeIcon: RiSearchFill,
  },
  {
    label: "Cart",
    href: "/cart",
    icon: RiShoppingCartLine,
    activeIcon: RiShoppingCartFill,
    badgeKey: "cart" as const,
  },
  {
    label: "Wishlist",
    href: "/wishlist",
    icon: RiHeartLine,
    activeIcon: RiHeartFill,
    badgeKey: "wishlist" as const,
  },
  {
    label: "Profile",
    href: "/account",
    icon: RiUserLine,
    activeIcon: RiUserFill,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.getItemCount());
  const wishlistCount = useWishlistStore((s) => s.items.length);
  const user = useAuthStore((s) => s.user);

  const getBadge = (key?: "cart" | "wishlist") => {
    if (key === "cart") return cartCount;
    if (key === "wishlist") return wishlistCount;
    return 0;
  };

  return (
    <nav
      className="fixed right-0 bottom-0 left-0 z-40 border-t lg:hidden"
      style={{
        backgroundColor: "rgba(255,253,247,0.97)",
        borderColor: "#EBE8D8",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="mx-auto flex max-w-md items-center justify-around px-2 py-1.5">
        {NAV_ITEMS.map((item) => {
          const isProfile = item.label === "Profile";
          const href = isProfile && !user ? "/login" : item.href;
          const isActive =
            pathname === item.href ||
            (item.href !== "/" && pathname?.startsWith(item.href));
          const Icon = isActive ? item.activeIcon : item.icon;
          const badge = getBadge(item.badgeKey);

          return (
            <Link key={item.label} href={href} className="relative flex flex-col items-center">
              <motion.div
                whileTap={{ scale: 0.85 }}
                className="relative flex h-8 w-10 items-center justify-center"
              >
                <Icon
                  size={22}
                  style={{ color: isActive ? "#E84672" : "#78716c" }}
                />
                <AnimatePresence>
                  {badge > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 18 }}
                      className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 font-bold text-white"
                      style={{ fontSize: "0.58rem", backgroundColor: "#E84672" }}
                    >
                      {badge > 9 ? "9+" : badge}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
              <span
                className="text-[0.6rem] font-semibold leading-tight"
                style={{ color: isActive ? "#E84672" : "#a8a29e" }}
              >
                {item.label}
              </span>
              {isActive && (
                <motion.span
                  layoutId="bottomNavIndicator"
                  className="absolute -top-1.5 h-0.5 w-6 rounded-full"
                  style={{ backgroundColor: "#E84672" }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
