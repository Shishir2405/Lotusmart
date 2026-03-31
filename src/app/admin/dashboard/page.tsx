"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  RiMoneyDollarCircleLine,
  RiShoppingCartLine,
  RiUserLine,
  RiShoppingBag3Line,
  RiArrowUpLine,
  RiArrowDownLine,
  RiArrowRightSLine,
  RiCalendar2Line,
  RiRefreshLine,
  RiTrophyLine,
  RiBarChartBoxLine,
  RiFlashlightLine,
  RiExternalLinkLine,
} from "react-icons/ri";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/utils/helpers";
import { Skeleton } from "@/components/ui/Skeleton";
import axios from "axios";

interface AnalyticsData {
  summary: { revenue: number; orders: number; users: number; products: number };
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    total: number;
    orderStatus: string;
    createdAt: string;
    user?: { name?: string };
  }>;
  revenueByDay: Array<{ _id: string; revenue: number; orders: number }>;
  ordersByStatus: Array<{ _id: string; count: number }>;
  topProducts: Array<{ _id: string; name: string; revenue: number; units: number }>;
}

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

function MiniBarChart({ data, maxValue }: { data: number[]; maxValue: number }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-end",
        gap: "3px",
        height: "40px",
      }}
    >
      {data.map((val, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${Math.max((val / maxValue) * 100, 5)}%` }}
          transition={{ delay: i * 0.03, duration: 0.5, ease }}
          style={{
            flex: 1,
            borderRadius: "3px",
            background: `linear-gradient(to top, rgba(232,70,114,0.3), rgba(232,70,114,${0.4 + (val / maxValue) * 0.6}))`,
            minHeight: "2px",
          }}
        />
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState(30);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = (days: number) => {
    setLoading(true);
    axios
      .get<{ data: AnalyticsData }>(`/api/admin/analytics?range=${days}`)
      .then((r) => setData(r.data.data))
      .catch(() => null)
      .finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
  };

  useEffect(() => {
    fetchData(range);
  }, [range]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData(range);
  };

  const stats = [
    {
      label: "Total Revenue",
      value: formatCurrency(data?.summary.revenue ?? 0),
      icon: RiMoneyDollarCircleLine,
      iconBg: "#ECFDF5",
      iconColor: "#059669",
      borderColor: "#A7F3D0",
      trend: "+12.5%",
      trendUp: true,
    },
    {
      label: `Orders (${range}d)`,
      value: String(data?.summary.orders ?? 0),
      icon: RiShoppingCartLine,
      iconBg: "#EFF6FF",
      iconColor: "#2563EB",
      borderColor: "#BFDBFE",
      trend: "+8.2%",
      trendUp: true,
    },
    {
      label: "Customers",
      value: String(data?.summary.users ?? 0),
      icon: RiUserLine,
      iconBg: "#FFF1F3",
      iconColor: "#E84672",
      borderColor: "#FECDD3",
      trend: "+5.1%",
      trendUp: true,
    },
    {
      label: "Active Products",
      value: String(data?.summary.products ?? 0),
      icon: RiShoppingBag3Line,
      iconBg: "#F7F6F0",
      iconColor: "#7A6E42",
      borderColor: "#D4CFB3",
      trend: "Stable",
      trendUp: null,
    },
  ];

  const statusColorMap: Record<string, string> = {
    placed: "#3B82F6",
    confirmed: "#6366F1",
    processing: "#F59E0B",
    shipped: "#8B5CF6",
    delivered: "#10B981",
    cancelled: "#EF4444",
    returned: "#6B7280",
  };

  const totalStatusOrders =
    data?.ordersByStatus.reduce((a, b) => a + b.count, 0) ?? 1;

  return (
    <div style={{ padding: "2rem" }}>
      
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "2rem",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 800,
              color: "#1C1917",
              letterSpacing: "-0.02em",
            }}
          >
            Dashboard
          </h1>
          <p style={{ fontSize: "0.8rem", color: "#9CA3AF", marginTop: "0.125rem" }}>
            Performance overview &middot; Last updated just now
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "2px",
              padding: "3px",
              borderRadius: "0.75rem",
              backgroundColor: "#fff",
              border: "1px solid #E5E7EB",
            }}
          >
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setRange(d)}
                style={{
                  padding: "0.375rem 0.75rem",
                  borderRadius: "0.625rem",
                  border: "none",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  backgroundColor: range === d ? "#E84672" : "transparent",
                  color: range === d ? "#fff" : "#6B7280",
                  transition: "all 0.2s",
                }}
              >
                {d}d
              </button>
            ))}
          </div>

          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleRefresh}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "0.625rem",
              border: "1px solid #E5E7EB",
              backgroundColor: "#fff",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#6B7280",
            }}
          >
            <motion.div
              animate={refreshing ? { rotate: 360 } : {}}
              transition={refreshing ? { repeat: Infinity, duration: 1, ease: "linear" } : {}}
            >
              <RiRefreshLine size={16} />
            </motion.div>
          </motion.button>
        </div>
      </div>

      
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "1.25rem",
          marginBottom: "2rem",
        }}
      >
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.5, ease }}
            style={{
              backgroundColor: "#fff",
              borderRadius: "1.25rem",
              padding: "1.5rem",
              border: `1px solid ${stat.borderColor}40`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: "3px",
                background: `linear-gradient(90deg, ${stat.iconColor}, ${stat.iconColor}60)`,
                borderRadius: "1.25rem 1.25rem 0 0",
              }}
            />
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <Skeleton className="h-10 w-10" rounded="xl" />
                <Skeleton className="h-8 w-28" />
                <Skeleton className="h-4 w-24" />
              </div>
            ) : (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "1rem",
                  }}
                >
                  <div
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "0.75rem",
                      backgroundColor: stat.iconBg,
                      border: `1px solid ${stat.borderColor}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <stat.icon size={20} style={{ color: stat.iconColor }} />
                  </div>
                  {stat.trendUp !== null && (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "2px",
                        fontSize: "0.7rem",
                        fontWeight: 700,
                        color: stat.trendUp ? "#059669" : "#EF4444",
                        backgroundColor: stat.trendUp ? "#ECFDF5" : "#FEF2F2",
                        padding: "0.25rem 0.5rem",
                        borderRadius: "9999px",
                      }}
                    >
                      {stat.trendUp ? <RiArrowUpLine size={10} /> : <RiArrowDownLine size={10} />}
                      {stat.trend}
                    </span>
                  )}
                </div>
                <p
                  style={{
                    fontSize: "1.75rem",
                    fontWeight: 800,
                    color: "#1C1917",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {stat.value}
                </p>
                <p style={{ fontSize: "0.78rem", color: "#9CA3AF", marginTop: "0.25rem" }}>
                  {stat.label}
                </p>
              </>
            )}
          </motion.div>
        ))}
      </div>

      
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "1.25rem",
          marginBottom: "1.25rem",
        }}
        className="lg:grid-cols-3"
      >
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5, ease }}
          style={{
            backgroundColor: "#fff",
            borderRadius: "1.25rem",
            border: "1px solid #F3F4F6",
            overflow: "hidden",
          }}
          className="lg:col-span-2"
        >
          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid #F3F4F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <RiBarChartBoxLine size={16} style={{ color: "#E84672" }} />
              <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1C1917" }}>
                Revenue Trend
              </h2>
            </div>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                fontSize: "0.68rem",
                fontWeight: 600,
                color: "#9CA3AF",
              }}
            >
              <RiCalendar2Line size={11} />
              Last {range} days
            </span>
          </div>
          <div style={{ padding: "1.5rem" }}>
            {loading ? (
              <Skeleton className="h-40 w-full" rounded="xl" />
            ) : data?.revenueByDay && data.revenueByDay.length > 0 ? (
              <MiniBarChart
                data={data.revenueByDay.map((d) => d.revenue)}
                maxValue={Math.max(...data.revenueByDay.map((d) => d.revenue), 1)}
              />
            ) : (
              <div
                style={{
                  height: "100px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#9CA3AF",
                  fontSize: "0.85rem",
                }}
              >
                No revenue data for this period
              </div>
            )}
            {!loading && data?.revenueByDay && data.revenueByDay.length > 0 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: "0.75rem",
                  fontSize: "0.68rem",
                  color: "#9CA3AF",
                }}
              >
                <span>{data.revenueByDay[0]?._id}</span>
                <span>{data.revenueByDay[data.revenueByDay.length - 1]?._id}</span>
              </div>
            )}
          </div>
        </motion.div>

        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5, ease }}
          style={{
            backgroundColor: "#fff",
            borderRadius: "1.25rem",
            border: "1px solid #F3F4F6",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid #F3F4F6",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <RiFlashlightLine size={16} style={{ color: "#F59E0B" }} />
            <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1C1917" }}>
              Order Status
            </h2>
          </div>
          <div style={{ padding: "1.25rem 1.5rem" }}>
            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            ) : data?.ordersByStatus && data.ordersByStatus.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                {data.ordersByStatus
                  .sort((a, b) => b.count - a.count)
                  .map((s) => (
                    <div key={s._id}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.78rem",
                          marginBottom: "0.25rem",
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 600,
                            color: "#374151",
                            textTransform: "capitalize",
                          }}
                        >
                          {s._id}
                        </span>
                        <span style={{ fontWeight: 700, color: "#1C1917" }}>{s.count}</span>
                      </div>
                      <div
                        style={{
                          height: "6px",
                          borderRadius: "9999px",
                          backgroundColor: "#F3F4F6",
                          overflow: "hidden",
                        }}
                      >
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(s.count / totalStatusOrders) * 100}%`,
                          }}
                          transition={{ duration: 0.8, ease }}
                          style={{
                            height: "100%",
                            borderRadius: "9999px",
                            backgroundColor: statusColorMap[s._id] ?? "#9CA3AF",
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <p style={{ color: "#9CA3AF", fontSize: "0.85rem", textAlign: "center" }}>
                No orders yet
              </p>
            )}
          </div>
        </motion.div>
      </div>

      
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr",
          gap: "1.25rem",
        }}
        className="lg:grid-cols-3"
      >
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5, ease }}
          style={{
            backgroundColor: "#fff",
            borderRadius: "1.25rem",
            border: "1px solid #F3F4F6",
            overflow: "hidden",
          }}
          className="lg:col-span-2"
        >
          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid #F3F4F6",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <RiShoppingCartLine size={16} style={{ color: "#2563EB" }} />
              <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1C1917" }}>
                Recent Orders
              </h2>
            </div>
            <Link
              href="/admin/orders"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.25rem",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "#E84672",
                textDecoration: "none",
              }}
            >
              View all <RiArrowRightSLine size={14} />
            </Link>
          </div>

          {loading ? (
            <div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    padding: "1rem 1.5rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    borderBottom: i < 4 ? "1px solid #F9FAFB" : "none",
                  }}
                >
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-20" rounded="full" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : data?.recentOrders && data.recentOrders.length > 0 ? (
            <div>
              {data.recentOrders.slice(0, 7).map((order, i) => (
                <Link
                  key={order._id}
                  href={`/admin/orders/${order._id}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "1rem",
                    padding: "0.875rem 1.5rem",
                    textDecoration: "none",
                    borderBottom:
                      i < (data.recentOrders.length > 7 ? 6 : data.recentOrders.length - 1)
                        ? "1px solid #F9FAFB"
                        : "none",
                    transition: "background-color 0.15s",
                  }}
                  className="hover:bg-[#FAFAF9]"
                >
                  <div style={{ minWidth: 0 }}>
                    <p
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color: "#1C1917",
                      }}
                    >
                      {order.orderNumber}
                    </p>
                    <p style={{ fontSize: "0.7rem", color: "#9CA3AF" }}>
                      {formatDate(order.createdAt)}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.orderStatus} />
                  <span
                    style={{
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      color: "#1C1917",
                      flexShrink: 0,
                    }}
                  >
                    {formatCurrency(order.total)}
                  </span>
                  <RiExternalLinkLine
                    size={13}
                    style={{ color: "#D1D5DB", flexShrink: 0 }}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <div
              style={{
                padding: "3rem",
                textAlign: "center",
                color: "#9CA3AF",
                fontSize: "0.85rem",
              }}
            >
              No orders found
            </div>
          )}
        </motion.div>

        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5, ease }}
          style={{
            backgroundColor: "#fff",
            borderRadius: "1.25rem",
            border: "1px solid #F3F4F6",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "1.25rem 1.5rem",
              borderBottom: "1px solid #F3F4F6",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
            }}
          >
            <RiTrophyLine size={16} style={{ color: "#F59E0B" }} />
            <h2 style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1C1917" }}>
              Top Products
            </h2>
          </div>

          {loading ? (
            <div>
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    padding: "0.875rem 1.5rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.75rem",
                  }}
                >
                  <Skeleton className="h-8 w-8" rounded="xl" />
                  <div style={{ flex: 1 }}>
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-20 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.topProducts && data.topProducts.length > 0 ? (
            <div>
              {data.topProducts.map((p, i) => {
                const medals = ["#FFD700", "#C0C0C0", "#CD7F32"];
                return (
                  <div
                    key={p._id}
                    style={{
                      padding: "0.875rem 1.5rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.75rem",
                      borderBottom:
                        i < data.topProducts.length - 1 ? "1px solid #F9FAFB" : "none",
                    }}
                  >
                    <div
                      style={{
                        width: "30px",
                        height: "30px",
                        borderRadius: "0.5rem",
                        backgroundColor: i < 3 ? `${medals[i]}18` : "#F7F6F0",
                        border: i < 3 ? `1px solid ${medals[i]}40` : "1px solid #EBE8D8",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.78rem",
                        fontWeight: 800,
                        color: i < 3 ? medals[i] : "#7A6E42",
                        flexShrink: 0,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 600,
                          color: "#1C1917",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {p.name}
                      </p>
                      <p style={{ fontSize: "0.68rem", color: "#9CA3AF" }}>{p.units} units sold</p>
                    </div>
                    <span
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: "#1C1917",
                        flexShrink: 0,
                      }}
                    >
                      {formatCurrency(p.revenue)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                padding: "3rem",
                textAlign: "center",
                color: "#9CA3AF",
                fontSize: "0.85rem",
              }}
            >
              No product data yet
            </div>
          )}
        </motion.div>
      </div>

      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.5, ease }}
        style={{
          marginTop: "1.25rem",
          padding: "1.5rem",
          borderRadius: "1.25rem",
          background: "linear-gradient(135deg, #2A2518 0%, #4D4529 50%, #7A6E42 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "0.65rem",
              fontWeight: 800,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "#FFE08A",
              marginBottom: "0.25rem",
            }}
          >
            Quick Actions
          </p>
          <p
            style={{
              fontSize: "1rem",
              fontWeight: 700,
              color: "#fff",
            }}
          >
            Manage your store efficiently
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {[
            { label: "Add Product", href: "/admin/products/new" },
            { label: "Manage Orders", href: "/admin/orders" },
            { label: "View Analytics", href: "/admin/analytics" },
          ].map((action) => (
            <Link key={action.label} href={action.href} style={{ textDecoration: "none" }}>
              <motion.span
                whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(0,0,0,0.2)" }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.375rem",
                  padding: "0.5rem 1rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  backdropFilter: "blur(8px)",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  color: "#FFE08A",
                  cursor: "pointer",
                }}
              >
                {action.label}
                <RiArrowRightSLine size={13} />
              </motion.span>
            </Link>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
