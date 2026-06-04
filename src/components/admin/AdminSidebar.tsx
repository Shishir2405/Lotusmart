"use client";

import { useEffect, useState } from "react";
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
  RiPagesLine,
  RiStackLine,
  RiShieldUserLine,
  RiArticleLine,
  RiBuilding2Line,
  RiTruckLine,
  RiBarcodeLine,
  RiPrinterLine,
  RiMapPin2Line,
  RiArrowDownSLine,
  RiInboxArchiveLine,
  RiArrowGoBackLine,
  RiUploadCloud2Line,
} from "react-icons/ri";
import type { IconType } from "react-icons";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/utils/helpers";

interface NavLeaf {
  href: string;
  label: string;
  icon: IconType;
  permission: string;
}

interface NavParent {
  label: string;
  icon: IconType;
  permission: string;
  basePath: string;
  children: { href: string; label: string; icon: IconType; permission: string }[];
}

type NavItem = NavLeaf | NavParent;

const navGroups: { label: string; items: NavItem[] }[] = [
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
      { href: "/admin/products/import", label: "Bulk Import", icon: RiUploadCloud2Line, permission: "products" },
      { href: "/admin/categories", label: "Categories", icon: RiAppsLine, permission: "categories" },
      { href: "/admin/coupons", label: "Coupons", icon: RiCoupon3Line, permission: "coupons" },
      { href: "/admin/price-editor", label: "Price Editor", icon: RiPriceTag3Line, permission: "price_editor" },
      { href: "/admin/inventory", label: "Inventory", icon: RiStackLine, permission: "inventory" },
    ],
  },
  {
    label: "Sales",
    items: [
      {
        label: "Orders Management",
        icon: RiListUnordered,
        permission: "orders",
        basePath: "/admin/orders",
        children: [
          { href: "/admin/orders", label: "All Orders", icon: RiInboxArchiveLine, permission: "orders" },
          { href: "/admin/orders/shipments", label: "Shipments", icon: RiTruckLine, permission: "orders" },
          { href: "/admin/orders/labels", label: "Labels", icon: RiPrinterLine, permission: "orders" },
          { href: "/admin/orders/tracking", label: "Tracking", icon: RiMapPin2Line, permission: "orders" },
          { href: "/admin/orders/returns", label: "Returns", icon: RiArrowGoBackLine, permission: "orders" },
        ],
      },
      { href: "/admin/warehouses", label: "Warehouses", icon: RiBuilding2Line, permission: "orders" },
      { href: "/admin/users", label: "Customers", icon: RiUserLine, permission: "customers" },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/banners", label: "Banners", icon: RiImageLine, permission: "banners" },
      { href: "/admin/blog", label: "Blog", icon: RiArticleLine, permission: "blog" },
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

function isParent(item: NavItem): item is NavParent {
  return (item as NavParent).children !== undefined;
}

// Every leaf href in the nav, used so a parent route (e.g. /admin/products)
// doesn't stay highlighted when a more specific sibling (/admin/products/import)
// owns the current path.
const leafHrefs: string[] = navGroups.flatMap((g) =>
  g.items.flatMap((it) => (isParent(it) ? it.children.map((c) => c.href) : [it.href])),
);

// Treat /admin/orders/<mongoId> as belonging to the parent group, not "All
// Orders" — IDs are 24 hex chars and shouldn't collide with static segments.
function isAllOrdersActive(pathname: string | null): boolean {
  if (!pathname) return false;
  if (pathname === "/admin/orders") return true;
  const m = pathname.match(/^\/admin\/orders\/([^/]+)$/);
  return !!m && /^[a-f0-9]{24}$/i.test(m[1]);
}

export function AdminSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { user } = useAuthStore();

  function hasPermission(permission: string): boolean {
    if (!user) return false;
    if ((user as { isSuperAdmin?: boolean }).isSuperAdmin) return true;
    if (!user.permissions) return false; // default-deny: admins need a role
    return user.permissions.includes(permission);
  }

  // Active when it's an exact match, or a prefix match that no more specific
  // sibling link claims (keeps /admin/products inactive on /admin/products/import).
  function isLeafActive(href: string): boolean {
    if (!pathname) return false;
    if (pathname === href) return true;
    if (!pathname.startsWith(`${href}/`)) return false;
    const moreSpecific = leafHrefs.some(
      (h) =>
        h !== href &&
        h.startsWith(href) &&
        (pathname === h || pathname.startsWith(`${h}/`)),
    );
    return !moreSpecific;
  }

  const initialOpenParents: Record<string, boolean> = {};
  for (const group of navGroups) {
    for (const item of group.items) {
      if (isParent(item)) {
        initialOpenParents[item.basePath] =
          !!pathname && pathname.startsWith(item.basePath);
      }
    }
  }
  const [openParents, setOpenParents] = useState<Record<string, boolean>>(initialOpenParents);

  // Auto-open the parent that matches the current route on navigation.
  useEffect(() => {
    setOpenParents((prev) => {
      const next = { ...prev };
      for (const group of navGroups) {
        for (const item of group.items) {
          if (isParent(item) && pathname?.startsWith(item.basePath)) {
            next[item.basePath] = true;
          }
        }
      }
      return next;
    });
  }, [pathname]);

  function toggleParent(basePath: string) {
    setOpenParents((prev) => ({ ...prev, [basePath]: !prev[basePath] }));
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
          .filter((group) =>
            group.items.some((item) =>
              isParent(item)
                ? item.children.some((c) => hasPermission(c.permission))
                : hasPermission(item.permission),
            ),
          )
          .map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1.5 text-[0.6rem] font-bold uppercase tracking-[0.15em] text-[#7A6E42]">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items
                  .filter((item) =>
                    isParent(item)
                      ? item.children.some((c) => hasPermission(c.permission))
                      : hasPermission(item.permission),
                  )
                  .map((item) => {
                    if (!isParent(item)) {
                      const Icon = item.icon;
                      const isActive = isLeafActive(item.href);
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                            isActive
                              ? "bg-[#E84672] text-white"
                              : "text-[#B8AE86] hover:bg-[#4D4529] hover:text-[#FFF9E8]",
                          )}
                        >
                          <Icon size={17} />
                          {item.label}
                        </Link>
                      );
                    }

                    const Icon = item.icon;
                    const isOpen = !!openParents[item.basePath];
                    const groupActive = pathname?.startsWith(item.basePath) ?? false;
                    return (
                      <div key={item.basePath}>
                        <button
                          type="button"
                          onClick={() => toggleParent(item.basePath)}
                          className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all",
                            groupActive
                              ? "text-[#FFF9E8] bg-[#4D4529]/60"
                              : "text-[#B8AE86] hover:bg-[#4D4529] hover:text-[#FFF9E8]",
                          )}
                        >
                          <Icon size={17} />
                          <span className="flex-1 text-left">{item.label}</span>
                          <RiArrowDownSLine
                            size={16}
                            className={cn(
                              "transition-transform",
                              isOpen ? "rotate-0" : "-rotate-90",
                            )}
                          />
                        </button>

                        {isOpen && (
                          <div className="mt-0.5 ml-4 pl-3 border-l border-[#4D4529] space-y-0.5">
                            {item.children
                              .filter((c) => hasPermission(c.permission))
                              .map((child) => {
                                const ChildIcon = child.icon;
                                const isChildActive =
                                  child.href === "/admin/orders"
                                    ? isAllOrdersActive(pathname ?? null)
                                    : pathname === child.href ||
                                      pathname?.startsWith(`${child.href}/`);
                                return (
                                  <Link
                                    key={child.href}
                                    href={child.href}
                                    className={cn(
                                      "flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[0.82rem] font-medium transition-all",
                                      isChildActive
                                        ? "bg-[#E84672] text-white"
                                        : "text-[#9C8F62] hover:bg-[#4D4529] hover:text-[#FFF9E8]",
                                    )}
                                  >
                                    <ChildIcon size={14} />
                                    {child.label}
                                  </Link>
                                );
                              })}
                          </div>
                        )}
                      </div>
                    );
                  })}
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
