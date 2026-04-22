"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import axios from "axios";
import {
  RiUser3Line,
  RiShoppingCart2Line,
  RiHeart3Line,
  RiShoppingBag3Line,
  RiMapPin2Line,
  RiShieldCheckLine,
  RiShieldLine,
  RiDeleteBin2Line,
  RiSaveLine,
  RiLoader4Line,
} from "react-icons/ri";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, normalizeImageUrl } from "@/utils/helpers";
import toast from "@/components/ui/toast";

interface ProductRef {
  _id: string;
  name: string;
  slug?: string;
  images?: string[];
  price?: number;
  stock?: number;
}

interface CustomerDetail {
  user: {
    _id: string;
    name: string;
    email: string;
    role: "admin" | "customer";
    phone?: string;
    avatar?: string;
    isVerified: boolean;
    profileComplete?: boolean;
    authProvider?: "local" | "google";
    addresses?: Array<{
      _id: string;
      fullName: string;
      phone: string;
      addressLine1: string;
      addressLine2?: string;
      city: string;
      state: string;
      pincode: string;
      isDefault: boolean;
      label: string;
      formattedAddress?: string;
    }>;
    createdAt: string;
    updatedAt: string;
  };
  cart: {
    items: Array<{ product: ProductRef | null; quantity: number; price: number; variant?: string }>;
    couponCode?: string;
    discount?: number;
  };
  wishlist: {
    items: Array<{ product: ProductRef | null; addedAt?: string }>;
  };
  recentOrders: Array<{
    _id: string;
    orderNumber: string;
    total: number;
    paymentStatus: string;
    orderStatus: string;
    createdAt: string;
    items: Array<{ name: string; quantity: number }>;
  }>;
  stats: {
    totalOrders: number;
    totalSpend: number;
    pendingOrders: number;
  };
}

type Tab = "profile" | "cart" | "wishlist" | "orders";

interface Props {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: (id: string) => void;
  onUpdated?: (user: CustomerDetail["user"]) => void;
  currentAdminId?: string;
}

export default function CustomerDetailModal({
  userId,
  isOpen,
  onClose,
  onDeleted,
  onUpdated,
  currentAdminId,
}: Props) {
  const [detail, setDetail] = useState<CustomerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<Tab>("profile");

  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<"admin" | "customer">("customer");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!isOpen || !userId) return;
    setLoading(true);
    setTab("profile");
    axios
      .get<{ data: CustomerDetail }>(`/api/admin/users/${userId}`)
      .then((r) => {
        setDetail(r.data.data);
        setEditName(r.data.data.user.name ?? "");
        setEditPhone(r.data.data.user.phone ?? "");
        setEditRole(r.data.data.user.role);
      })
      .catch((err) => {
        toast.error(
          axios.isAxiosError(err)
            ? err.response?.data?.message ?? "Failed to load customer"
            : "Failed to load customer",
        );
        onClose();
      })
      .finally(() => setLoading(false));
  }, [isOpen, userId, onClose]);

  const patchUser = async (payload: Record<string, unknown>, successMessage: string) => {
    setSaving(true);
    try {
      const res = await axios.patch<{ data: { user: CustomerDetail["user"] } }>(
        `/api/admin/users/${userId}`,
        payload,
      );
      setDetail((d) => (d ? { ...d, user: res.data.data.user } : d));
      onUpdated?.(res.data.data.user);
      toast.success(successMessage);
    } catch (err) {
      toast.error(
        axios.isAxiosError(err)
          ? err.response?.data?.message ?? "Failed to update customer"
          : "Failed to update customer",
      );
    } finally {
      setSaving(false);
    }
  };

  const saveProfile = () =>
    patchUser({ name: editName, phone: editPhone, role: editRole }, "Profile updated");

  const toggleVerified = () => {
    if (!detail) return;
    patchUser(
      { isVerified: !detail.user.isVerified },
      detail.user.isVerified ? "Marked as unverified" : "Marked as verified",
    );
  };

  const deleteUser = async () => {
    if (!detail) return;
    if (!confirm(`Permanently delete ${detail.user.email}? This removes their cart and wishlist.`))
      return;
    setDeleting(true);
    try {
      await axios.delete(`/api/admin/users/${userId}`);
      toast.success("Customer deleted");
      onDeleted?.(userId);
      onClose();
    } catch (err) {
      toast.error(
        axios.isAxiosError(err)
          ? err.response?.data?.message ?? "Failed to delete customer"
          : "Failed to delete customer",
      );
    } finally {
      setDeleting(false);
    }
  };

  const isSelf = currentAdminId && detail?.user?._id === currentAdminId;

  const tabs: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: "profile", label: "Profile", icon: <RiUser3Line size={14} /> },
    { key: "cart", label: "Cart", icon: <RiShoppingCart2Line size={14} />, count: detail?.cart.items.length ?? 0 },
    { key: "wishlist", label: "Wishlist", icon: <RiHeart3Line size={14} />, count: detail?.wishlist.items.length ?? 0 },
    { key: "orders", label: "Orders", icon: <RiShoppingBag3Line size={14} />, count: detail?.stats.totalOrders ?? 0 },
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="full"
      title={detail ? `${detail.user.name} — ${detail.user.email}` : "Customer"}
    >
      {loading || !detail ? (
        <div className="flex items-center justify-center py-24">
          <RiLoader4Line className="animate-spin text-neutral-400" size={28} />
        </div>
      ) : (
        <div className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard label="Total orders" value={detail.stats.totalOrders.toString()} />
            <StatCard
              label="Lifetime spend"
              value={formatCurrency(detail.stats.totalSpend)}
              accent
            />
            <StatCard label="Pending orders" value={detail.stats.pendingOrders.toString()} />
            <StatCard label="Cart items" value={detail.cart.items.length.toString()} />
          </div>

          <div className="flex gap-1 border-b border-neutral-100">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  tab === t.key
                    ? "border-[#E84672] text-[#E84672]"
                    : "border-transparent text-neutral-500 hover:text-neutral-800"
                }`}
              >
                {t.icon}
                {t.label}
                {typeof t.count === "number" && (
                  <span
                    className={`rounded-full px-1.5 text-[0.65rem] font-bold ${
                      tab === t.key ? "bg-[#FFF1F3] text-[#E84672]" : "bg-neutral-100 text-neutral-500"
                    }`}
                  >
                    {t.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {tab === "profile" && (
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-4">
                <div className="rounded-2xl border border-neutral-100 bg-white p-5">
                  <h3 className="mb-3 text-sm font-semibold text-neutral-800">Edit profile</h3>
                  <div className="space-y-3">
                    <Input
                      label="Name"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                    <Input
                      label="Phone"
                      value={editPhone}
                      onChange={(e) => setEditPhone(e.target.value)}
                      placeholder="10-digit mobile"
                    />
                    <div>
                      <label className="mb-1.5 block text-sm font-medium text-neutral-700">Role</label>
                      <select
                        value={editRole}
                        onChange={(e) => setEditRole(e.target.value as "admin" | "customer")}
                        disabled={Boolean(isSelf)}
                        className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#E84672] disabled:opacity-60"
                      >
                        <option value="customer">Customer</option>
                        <option value="admin">Admin</option>
                      </select>
                      {isSelf && (
                        <p className="mt-1 text-xs text-neutral-400">You can't change your own role.</p>
                      )}
                    </div>
                  </div>
                  <Button
                    className="mt-4"
                    leftIcon={<RiSaveLine />}
                    isLoading={saving}
                    onClick={saveProfile}
                  >
                    Save changes
                  </Button>
                </div>

                <div className="rounded-2xl border border-neutral-100 bg-white p-5">
                  <h3 className="mb-2 text-sm font-semibold text-neutral-800">Account status</h3>
                  <div className="space-y-2 text-sm">
                    <StatusRow
                      label="Email"
                      value={detail.user.email}
                    />
                    <StatusRow
                      label="Verified"
                      value={detail.user.isVerified ? "Yes" : "No"}
                      badge={
                        <Badge variant={detail.user.isVerified ? "success" : "warning"} dot>
                          {detail.user.isVerified ? "verified" : "unverified"}
                        </Badge>
                      }
                    />
                    <StatusRow
                      label="Profile complete"
                      value={detail.user.profileComplete ? "Yes" : "No"}
                    />
                    <StatusRow
                      label="Auth provider"
                      value={detail.user.authProvider ?? "local"}
                    />
                    <StatusRow label="Joined" value={formatDate(detail.user.createdAt)} />
                    <StatusRow label="Last updated" value={formatDate(detail.user.updatedAt)} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={detail.user.isVerified ? "outline" : "primary"}
                      leftIcon={detail.user.isVerified ? <RiShieldLine /> : <RiShieldCheckLine />}
                      onClick={toggleVerified}
                      isLoading={saving}
                    >
                      {detail.user.isVerified ? "Mark unverified" : "Mark as verified"}
                    </Button>
                    {!isSelf && (
                      <Button
                        size="sm"
                        variant="outline"
                        leftIcon={<RiDeleteBin2Line />}
                        onClick={deleteUser}
                        isLoading={deleting}
                        className="!text-red-600 !border-red-200 hover:!bg-red-50"
                      >
                        Delete customer
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-neutral-100 bg-white p-5">
                <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-neutral-800">
                  <RiMapPin2Line /> Saved addresses
                  <span className="rounded-full bg-neutral-100 px-1.5 text-[0.65rem] font-bold text-neutral-500">
                    {detail.user.addresses?.length ?? 0}
                  </span>
                </h3>
                {(detail.user.addresses ?? []).length === 0 ? (
                  <p className="text-sm text-neutral-400">No saved addresses.</p>
                ) : (
                  <div className="space-y-3">
                    {(detail.user.addresses ?? []).map((a) => (
                      <div
                        key={a._id}
                        className="rounded-xl border border-neutral-100 bg-[#FAFAF9] p-3 text-sm"
                      >
                        <div className="mb-1 flex items-center gap-2">
                          <span className="font-semibold text-neutral-800">{a.fullName}</span>
                          {a.isDefault && (
                            <span className="rounded-full bg-[#FFF1F3] px-2 py-0.5 text-[10px] font-medium text-[#E84672]">
                              Default
                            </span>
                          )}
                          <span className="rounded-full bg-neutral-100 px-2 py-0.5 text-[10px] capitalize text-neutral-500">
                            {a.label}
                          </span>
                        </div>
                        <p className="text-neutral-600">
                          {a.addressLine1}
                          {a.addressLine2 ? `, ${a.addressLine2}` : ""}
                          <br />
                          {a.city}, {a.state} — {a.pincode}
                        </p>
                        <p className="mt-1 text-xs text-neutral-400">{a.phone}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {tab === "cart" && <CartOrWishlist items={detail.cart.items} emptyMessage="Cart is empty" />}

          {tab === "wishlist" && (
            <CartOrWishlist
              items={detail.wishlist.items.map((i) => ({
                product: i.product,
                quantity: 1,
                price: i.product?.price ?? 0,
              }))}
              emptyMessage="Wishlist is empty"
            />
          )}

          {tab === "orders" && (
            <div className="rounded-2xl border border-neutral-100 bg-white overflow-hidden">
              {detail.recentOrders.length === 0 ? (
                <p className="p-10 text-center text-sm text-neutral-400">No orders yet.</p>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-100 bg-[#FAFAF9] text-xs uppercase tracking-wide text-neutral-500">
                      <th className="px-4 py-2.5 text-left">Order</th>
                      <th className="px-4 py-2.5 text-left">Items</th>
                      <th className="px-4 py-2.5 text-left">Total</th>
                      <th className="px-4 py-2.5 text-left">Status</th>
                      <th className="px-4 py-2.5 text-left">Placed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-50">
                    {detail.recentOrders.map((o) => (
                      <tr key={o._id}>
                        <td className="px-4 py-2.5 font-medium text-neutral-800">{o.orderNumber}</td>
                        <td className="px-4 py-2.5 text-neutral-500">
                          {o.items.slice(0, 2).map((i) => `${i.quantity}× ${i.name}`).join(", ")}
                          {o.items.length > 2 ? ` +${o.items.length - 2} more` : ""}
                        </td>
                        <td className="px-4 py-2.5 font-semibold text-neutral-800">
                          {formatCurrency(o.total)}
                        </td>
                        <td className="px-4 py-2.5">
                          <div className="flex flex-wrap gap-1">
                            <Badge variant={statusVariant(o.orderStatus)} dot>
                              {o.orderStatus}
                            </Badge>
                            <Badge variant={o.paymentStatus === "paid" ? "success" : "warning"} dot>
                              {o.paymentStatus}
                            </Badge>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-neutral-500">{formatDate(o.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

function StatCard({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div
      className={`rounded-xl border p-3.5 ${accent ? "border-[#E84672]/20 bg-[#FFF1F3]" : "border-neutral-100 bg-white"}`}
    >
      <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-neutral-400">
        {label}
      </p>
      <p className={`mt-1 text-xl font-bold ${accent ? "text-[#E84672]" : "text-neutral-800"}`}>
        {value}
      </p>
    </div>
  );
}

function StatusRow({
  label,
  value,
  badge,
}: {
  label: string;
  value: string;
  badge?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-xs uppercase tracking-wider text-neutral-400">{label}</span>
      <span className="flex items-center gap-2 text-neutral-700">
        {badge}
        <span>{value}</span>
      </span>
    </div>
  );
}

function CartOrWishlist({
  items,
  emptyMessage,
}: {
  items: Array<{ product: ProductRef | null; quantity: number; price: number; variant?: string }>;
  emptyMessage: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-neutral-100 bg-white p-10 text-center text-sm text-neutral-400">
        {emptyMessage}
      </div>
    );
  }
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  return (
    <div className="rounded-2xl border border-neutral-100 bg-white overflow-hidden">
      <div className="divide-y divide-neutral-50">
        {items.map((item, i) => {
          const p = item.product;
          const img = p?.images?.[0];
          return (
            <div key={`${p?._id ?? "missing"}-${i}`} className="flex items-center gap-4 p-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-[#F7F6F0]">
                {img ? (
                  <Image
                    src={normalizeImageUrl(img)}
                    alt={p?.name ?? "Product"}
                    width={56}
                    height={56}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-xl text-neutral-300">
                    🌿
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-medium text-neutral-800">
                  {p?.name ?? "(deleted product)"}
                </p>
                <p className="text-xs text-neutral-400">
                  {item.variant ? `Variant: ${item.variant} · ` : ""}
                  {p ? `Stock: ${p.stock ?? 0}` : ""}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-neutral-800">
                  {formatCurrency(item.price * item.quantity)}
                </p>
                <p className="text-xs text-neutral-400">
                  {item.quantity} × {formatCurrency(item.price)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
      <div className="flex items-center justify-end gap-3 border-t border-neutral-100 bg-[#FAFAF9] px-4 py-3 text-sm">
        <span className="text-neutral-500">Subtotal</span>
        <span className="font-bold text-neutral-800">{formatCurrency(subtotal)}</span>
      </div>
    </div>
  );
}

function statusVariant(
  status: string,
): "success" | "warning" | "error" | "info" | "neutral" {
  if (["delivered"].includes(status)) return "success";
  if (["cancelled", "returned"].includes(status)) return "error";
  if (["placed", "confirmed", "processing", "shipped"].includes(status)) return "info";
  return "neutral";
}
