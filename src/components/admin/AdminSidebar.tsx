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
  RiCoupon3Line,
  RiLayoutLine,
  RiPagesLine,
  RiStackLine,
  RiShieldUserLine,
} from "react-icons/ri";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/utils/helpers";

const navGroups = [
  {
    label: "Overview",
    items: [
      { href: "/admin/dashboard", label: "Dashboard", icon: RiDashboardLine, permission: "dashboard" },
      { href: "/admin/analytics", label: "Analytics", icon: RiBarChartLine, permission: "analytics" },
    ],
  },
  {
    label: "Catalog",
    items: [
      { href: "/admin/products", label: "Products", icon: RiShoppingBag3Line, permission: "products" },
      { href: "/admin/categories", label: "Categories", icon: RiAppsLine, permission: "categories" },
      { href: "/admin/coupons", label: "Coupons", icon: RiCoupon3Line, permission: "coupons" },
      { href: "/admin/price-editor", label: "Price Editor", icon: RiPriceTag3Line, permission: "price_editor" },
      { href: "/admin/inventory", label: "Inventory", icon: RiStackLine, permission: "inventory" },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/admin/orders", label: "Orders", icon: RiListUnordered, permission: "orders" },
      { href: "/admin/users", label: "Customers", icon: RiUserLine, permission: "customers" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/landing", label: "Landing Page", icon: RiLayoutLine, permission: "landing_page" },
      { href: "/admin/banners", label: "Banners", icon: RiImageLine, permission: "banners" },
      { href: "/admin/site-settings", label: "Site Content", icon: RiPagesLine, permission: "site_settings" },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/settings", label: "Settings", icon: RiSettingsLine, permission: "settings" },
      { href: "/admin/roles", label: "Roles", icon: RiShieldUserLine, permission: "roles" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { user } = useAuthStore();

  function hasPermission(permission: string): boolean {
    if (!user) return false;
    if (!user.permissions) return true; 
    return user.permissions.includes(permission);
  }

  return (
    <aside className="w-60 shrink-0 min-h-screen bg-[#2A2518] flex flex-col sticky top-0 h-screen">
      
      <div className="px-6 py-5 border-b border-[#4D4529]">
        <Link href="/" className="text-2xl font-bold text-[#FFF9E8]">
          Lotus<span className="text-[#E84672]">Mart</span>
        </Link>
        <p className="text-xs text-[#9C8F62] mt-0.5">Admin Panel</p>
      </div>

      
      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto">
        {navGroups
          .filter((group) => group.items.some((item) => hasPermission(item.permission)))
          .map((group) => (
          <div key={group.label}>
            <p className="px-3 mb-1.5 text-[0.6rem] font-bold uppercase tracking-[0.15em] text-[#7A6E42]">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items
                .filter((item) => hasPermission(item.permission))
                .map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                    pathname === href || pathname?.startsWith(`${href}/`)
                      ? "bg-[#E84672] text-white"
                      : "text-[#B8AE86] hover:bg-[#4D4529] hover:text-[#FFF9E8]",
                  )}
                >
                  <Icon size={17} />
                  {label}
                </Link>
              ))}
            </div>
          </div>
        ))}
      </nav>

      
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
