"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiAddLine,
  RiEditLine,
  RiDeleteBinLine,
  RiCloseLine,
  RiCheckLine,
  RiFileCopyLine,
  RiRefreshLine,
  RiCoupon3Line,
  RiPercentLine,
  RiMoneyDollarCircleLine,
  RiSearchLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Modal } from "@/components/ui/Modal";
import axios from "axios";
import toast from "react-hot-toast";

interface Coupon {
  _id: string;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
  applicableCategories: string[];
  applicableProducts: string[];
  createdAt: string;
  updatedAt: string;
}

interface CouponForm {
  code: string;
  description: string;
  discountType: "percentage" | "fixed";
  discountValue: string;
  minOrderValue: string;
  maxDiscountAmount: string;
  usageLimit: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

const EMPTY_FORM: CouponForm = {
  code: "",
  description: "",
  discountType: "percentage",
  discountValue: "",
  minOrderValue: "0",
  maxDiscountAmount: "",
  usageLimit: "",
  validFrom: "",
  validUntil: "",
  isActive: true,
};

function generatePromoCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segments = 2;
  const segmentLen = 4;
  const parts: string[] = [];
  for (let s = 0; s < segments; s++) {
    let seg = "";
    for (let i = 0; i < segmentLen; i++) {
      seg += chars[Math.floor(Math.random() * chars.length)];
    }
    parts.push(seg);
  }
  return parts.join("-");
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function toInputDate(dateStr: string): string {
  if (!dateStr) return "";
  return new Date(dateStr).toISOString().split("T")[0];
}

function getCouponStatus(coupon: Coupon): {
  label: string;
  variant: "success" | "error" | "warning" | "neutral";
} {
  const now = new Date();
  const from = new Date(coupon.validFrom);
  const until = new Date(coupon.validUntil);

  if (!coupon.isActive) {
    return { label: "Inactive", variant: "neutral" };
  }
  if (now < from) {
    return { label: "Upcoming", variant: "warning" };
  }
  if (now > until) {
    return { label: "Expired", variant: "error" };
  }
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
    return { label: "Exhausted", variant: "error" };
  }
  return { label: "Active", variant: "success" };
}

function formatDiscount(coupon: Coupon): string {
  if (coupon.discountType === "percentage") {
    return `${coupon.discountValue}%`;
  }
  return `$${coupon.discountValue.toFixed(2)}`;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  
  const [showForm, setShowForm] = useState(false);
  const [editTarget, setEditTarget] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  
  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCoupons = useCallback(() => {
    setLoading(true);
    axios
      .get<{ data: Coupon[] }>("/api/coupons")
      .then((r) => setCoupons(r.data.data))
      .catch(() => toast.error("Failed to load coupons"))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const filteredCoupons = coupons.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  const openCreate = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditTarget(coupon);
    setForm({
      code: coupon.code,
      description: coupon.description ?? "",
      discountType: coupon.discountType,
      discountValue: String(coupon.discountValue),
      minOrderValue: String(coupon.minOrderValue),
      maxDiscountAmount: coupon.maxDiscountAmount
        ? String(coupon.maxDiscountAmount)
        : "",
      usageLimit: coupon.usageLimit ? String(coupon.usageLimit) : "",
      validFrom: toInputDate(coupon.validFrom),
      validUntil: toInputDate(coupon.validUntil),
      isActive: coupon.isActive,
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditTarget(null);
    setForm(EMPTY_FORM);
  };

  const handleGenerateCode = () => {
    setForm((f) => ({ ...f, code: generatePromoCode() }));
  };

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast.success(`Copied "${code}" to clipboard`);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.code.trim()) {
      toast.error("Coupon code is required");
      return;
    }
    if (!form.discountValue || Number(form.discountValue) <= 0) {
      toast.error("Discount value must be greater than 0");
      return;
    }
    if (
      form.discountType === "percentage" &&
      Number(form.discountValue) > 100
    ) {
      toast.error("Percentage discount cannot exceed 100");
      return;
    }
    if (!form.validFrom || !form.validUntil) {
      toast.error("Valid from and valid until dates are required");
      return;
    }
    if (new Date(form.validFrom) >= new Date(form.validUntil)) {
      toast.error("Valid until must be after valid from");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        description: form.description || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        minOrderValue: Number(form.minOrderValue) || 0,
        maxDiscountAmount: form.maxDiscountAmount
          ? Number(form.maxDiscountAmount)
          : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        validFrom: form.validFrom,
        validUntil: form.validUntil,
        isActive: form.isActive,
      };

      if (editTarget) {
        await axios.patch(`/api/coupons/${editTarget._id}`, payload);
        toast.success("Coupon updated");
      } else {
        await axios.post("/api/coupons", payload);
        toast.success("Coupon created");
      }

      closeForm();
      fetchCoupons();
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : "Failed to save coupon";
      toast.error(msg ?? "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      await axios.patch(`/api/coupons/${coupon._id}`, {
        isActive: !coupon.isActive,
      });
      setCoupons((prev) =>
        prev.map((c) =>
          c._id === coupon._id ? { ...c, isActive: !coupon.isActive } : c
        )
      );
      toast.success(
        coupon.isActive ? "Coupon deactivated" : "Coupon activated"
      );
    } catch {
      toast.error("Failed to update coupon status");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axios.delete(`/api/coupons/${deleteTarget._id}`);
      setCoupons((prev) => prev.filter((c) => c._id !== deleteTarget._id));
      toast.success("Coupon deleted");
      setDeleteTarget(null);
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : "Failed to delete coupon";
      toast.error(msg ?? "Failed to delete coupon");
    } finally {
      setDeleting(false);
    }
  };

  const activeCoupons = coupons.filter((c) => {
    const status = getCouponStatus(c);
    return status.label === "Active";
  });

  return (
    <div className="p-8">
      
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Coupons</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            {coupons.length} total &middot; {activeCoupons.length} active
          </p>
        </div>
        <Button leftIcon={<RiAddLine />} onClick={openCreate}>
          Create Coupon
        </Button>
      </div>

      
      <div className="mb-6">
        <Input
          placeholder="Search coupons by code or description..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<RiSearchLine />}
          className="max-w-sm"
        />
      </div>

      
      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editTarget ? `Edit Coupon: ${editTarget.code}` : "Create New Coupon"}
        size="xl"
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                label="Coupon Code"
                value={form.code}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    code: e.target.value.toUpperCase(),
                  }))
                }
                placeholder="e.g. SUMMER25"
                required
                disabled={!!editTarget}
                className="font-mono tracking-wider"
              />
            </div>
            {!editTarget && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleGenerateCode}
                leftIcon={<RiRefreshLine />}
              >
                Generate
              </Button>
            )}
          </div>

          
          <Input
            label="Description"
            value={form.description}
            onChange={(e) =>
              setForm((f) => ({ ...f, description: e.target.value }))
            }
            placeholder="e.g. Summer sale - 25% off all orders"
          />

          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1.5">
                Discount Type <span className="text-[#E84672] ml-0.5">*</span>
              </label>
              <select
                value={form.discountType}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    discountType: e.target.value as "percentage" | "fixed",
                  }))
                }
                className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672] focus:ring-2 focus:ring-[#E84672]/30 bg-white transition-all duration-200"
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount ($)</option>
              </select>
            </div>
            <Input
              label="Discount Value"
              type="number"
              min="0"
              max={form.discountType === "percentage" ? "100" : undefined}
              step="0.01"
              value={form.discountValue}
              onChange={(e) =>
                setForm((f) => ({ ...f, discountValue: e.target.value }))
              }
              placeholder={
                form.discountType === "percentage" ? "e.g. 25" : "e.g. 10.00"
              }
              required
              leftIcon={
                form.discountType === "percentage" ? (
                  <RiPercentLine />
                ) : (
                  <RiMoneyDollarCircleLine />
                )
              }
            />
          </div>

          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Minimum Order Value"
              type="number"
              min="0"
              step="0.01"
              value={form.minOrderValue}
              onChange={(e) =>
                setForm((f) => ({ ...f, minOrderValue: e.target.value }))
              }
              placeholder="0"
              hint="Minimum cart amount to use this coupon"
              leftIcon={<RiMoneyDollarCircleLine />}
            />
            <Input
              label="Max Discount Amount"
              type="number"
              min="0"
              step="0.01"
              value={form.maxDiscountAmount}
              onChange={(e) =>
                setForm((f) => ({ ...f, maxDiscountAmount: e.target.value }))
              }
              placeholder="No limit"
              hint="Cap the discount (for percentage type)"
              leftIcon={<RiMoneyDollarCircleLine />}
            />
          </div>

          
          <Input
            label="Usage Limit"
            type="number"
            min="0"
            step="1"
            value={form.usageLimit}
            onChange={(e) =>
              setForm((f) => ({ ...f, usageLimit: e.target.value }))
            }
            placeholder="Unlimited"
            hint="Leave blank for unlimited uses"
          />

          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valid From"
              type="date"
              value={form.validFrom}
              onChange={(e) =>
                setForm((f) => ({ ...f, validFrom: e.target.value }))
              }
              required
            />
            <Input
              label="Valid Until"
              type="date"
              value={form.validUntil}
              onChange={(e) =>
                setForm((f) => ({ ...f, validUntil: e.target.value }))
              }
              required
            />
          </div>

          
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isActive: e.target.checked }))
                }
                className="rounded accent-[#E84672]"
              />
              <span className="text-sm text-neutral-700">Active</span>
            </label>
          </div>

          
          <div className="flex gap-3 pt-2 border-t border-neutral-100">
            <Button
              type="submit"
              isLoading={saving}
              leftIcon={<RiCheckLine />}
            >
              {editTarget ? "Save Changes" : "Create Coupon"}
            </Button>
            <Button type="button" variant="outline" onClick={closeForm}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Coupon"
        size="sm"
      >
        <div className="p-6">
          <p className="text-sm text-neutral-600 mb-2">
            Are you sure you want to delete the coupon{" "}
            <span className="font-mono font-semibold text-neutral-800">
              {deleteTarget?.code}
            </span>
            ? This action cannot be undone.
          </p>
          {deleteTarget && deleteTarget.usedCount > 0 && (
            <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-4">
              This coupon has been used {deleteTarget.usedCount} time
              {deleteTarget.usedCount !== 1 ? "s" : ""}. Deleting it will not
              affect past orders.
            </p>
          )}
          <div className="flex gap-3 mt-5">
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deleting}
              leftIcon={<RiDeleteBinLine />}
            >
              Delete
            </Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      
      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Code
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Discount
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Min Order
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Usage
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Valid Period
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Status
                </th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-4 w-4" rounded="sm" />
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-14" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-12" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-4 w-36" />
                      </td>
                      <td className="px-4 py-4">
                        <Skeleton className="h-5 w-16" rounded="full" />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Skeleton
                          className="h-8 w-20 ml-auto"
                          rounded="lg"
                        />
                      </td>
                    </tr>
                  ))
                : filteredCoupons.length === 0
                  ? (
                      <tr>
                        <td colSpan={7} className="px-6 py-16 text-center">
                          <div className="flex flex-col items-center">
                            <RiCoupon3Line
                              size={40}
                              className="text-neutral-200 mb-3"
                            />
                            <p className="text-neutral-400 text-sm">
                              {searchQuery.trim()
                                ? "No coupons match your search."
                                : "No coupons yet. Create one to get started."}
                            </p>
                            {!searchQuery.trim() && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="mt-4"
                                leftIcon={<RiAddLine />}
                                onClick={openCreate}
                              >
                                Create Coupon
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  : filteredCoupons.map((coupon) => {
                      const status = getCouponStatus(coupon);
                      return (
                        <motion.tr
                          key={coupon._id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="hover:bg-[#FAFAF9] transition-colors group"
                        >
                          
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold font-mono text-neutral-800 tracking-wide">
                                {coupon.code}
                              </span>
                              <button
                                onClick={() => copyToClipboard(coupon.code)}
                                className="p-1 rounded-md opacity-0 group-hover:opacity-100 hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-all"
                                title="Copy code"
                              >
                                <RiFileCopyLine size={14} />
                              </button>
                            </div>
                            {coupon.description && (
                              <p className="text-xs text-neutral-400 mt-0.5 truncate max-w-[200px]">
                                {coupon.description}
                              </p>
                            )}
                          </td>

                          
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-1.5">
                              <span className="text-sm font-semibold text-[#E84672]">
                                {formatDiscount(coupon)}
                              </span>
                              <span className="text-xs text-neutral-400">
                                {coupon.discountType === "percentage"
                                  ? "off"
                                  : "flat"}
                              </span>
                            </div>
                            {coupon.maxDiscountAmount != null &&
                              coupon.discountType === "percentage" && (
                                <p className="text-xs text-neutral-400 mt-0.5">
                                  max ${coupon.maxDiscountAmount}
                                </p>
                              )}
                          </td>

                          
                          <td className="px-4 py-4 text-sm text-neutral-600">
                            {coupon.minOrderValue > 0 ? (
                              `$${coupon.minOrderValue.toFixed(2)}`
                            ) : (
                              <span className="text-neutral-300">--</span>
                            )}
                          </td>

                          
                          <td className="px-4 py-4">
                            <span className="text-sm text-neutral-600">
                              {coupon.usedCount}
                              {coupon.usageLimit != null && (
                                <span className="text-neutral-400">
                                  {" "}
                                  / {coupon.usageLimit}
                                </span>
                              )}
                            </span>
                            {coupon.usageLimit == null && (
                              <span className="text-xs text-neutral-300 ml-1">
                                (no limit)
                              </span>
                            )}
                          </td>

                          
                          <td className="px-4 py-4">
                            <p className="text-sm text-neutral-600">
                              {formatDate(coupon.validFrom)}
                            </p>
                            <p className="text-xs text-neutral-400">
                              to {formatDate(coupon.validUntil)}
                            </p>
                          </td>

                          
                          <td className="px-4 py-4">
                            <button onClick={() => toggleActive(coupon)}>
                              <Badge variant={status.variant} dot>
                                {status.label}
                              </Badge>
                            </button>
                          </td>

                          
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => openEdit(coupon)}
                                className="p-1.5 rounded-lg hover:bg-blue-50 text-neutral-400 hover:text-blue-600 transition-colors"
                                title="Edit coupon"
                              >
                                <RiEditLine size={16} />
                              </button>
                              <button
                                onClick={() => setDeleteTarget(coupon)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors"
                                title="Delete coupon"
                              >
                                <RiDeleteBinLine size={16} />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
