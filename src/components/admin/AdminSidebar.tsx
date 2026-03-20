"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  RiDashboardLine,
  RiShoppingBag3Line,
  RiListUnordered,
  RiUserLine,
  RiImageLine,
  RiBarChartLine,
  RiSettingsLine,
  RiLogoutBoxLine,
  RiPriceTag3Line,
  RiAppsLine,
} from "react-icons/ri";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/utils/helpers";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: RiDashboardLine },
  { href: "/admin/products", label: "Products", icon: RiShoppingBag3Line },
  { href: "/admin/categories", label: "Categories", icon: RiAppsLine },
  { href: "/admin/orders", label: "Orders", icon: RiListUnordered },
  { href: "/admin/users", label: "Users", icon: RiUserLine },
  { href: "/admin/banners", label: "Banners", icon: RiImageLine },
  { href: "/admin/analytics", label: "Analytics", icon: RiBarChartLine },
  { href: "/admin/settings", label: "Settings", icon: RiSettingsLine },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  return (
    <aside className="w-60 shrink-0 min-h-screen bg-[#2A2518] flex flex-col sticky top-0 h-screen">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-[#4D4529]">
        <Link href="/" className="text-2xl font-bold text-[#FFF9E8]">
          Lotus<span className="text-[#E84672]">Mart</span>
        </Link>
        <p className="text-xs text-[#9C8F62] mt-0.5">Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              pathname === href || pathname?.startsWith(`${href}/`)
                ? "bg-[#E84672] text-white"
                : "text-[#B8AE86] hover:bg-[#4D4529] hover:text-[#FFF9E8]",
            )}
          >
            <Icon size={18} />
            {label}
          </Link>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-[#4D4529]">
        <button
          onClick={logout}
          className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium text-[#9C8F62] hover:bg-[#4D4529] hover:text-red-400 transition-all"
        >
          <RiLogoutBoxLine size={18} />
          Log out
        </button>
      </div>
    </aside>
  );
}
