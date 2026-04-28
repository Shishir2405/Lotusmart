"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { motion } from "framer-motion";
import {
  RiPrinterLine,
  RiDownloadLine,
  RiRefreshLine,
  RiSearchLine,
  RiBarcodeLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { OrderStatusBadge } from "@/components/ui/Badge";
import { formatDate } from "@/utils/helpers";
import toast from "@/components/ui/toast";

interface AdminOrder {
  _id: string;
  orderNumber: string;
  user?: { name: string };
  orderStatus: string;
  awbNumber?: string;
  trackingNumber?: string;
  courierCompany?: string;
  shippingAddress?: { city?: string; state?: string };
  createdAt: string;
}

interface LabelEntry {
  awb: string;
  orderNumber: string;
  label: string; // base64 / data URL
}

export default function AdminLabelsPage() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [rowBusy, setRowBusy] = useState<Record<string, boolean>>({});

  const fetchOrders = () => {
    setLoading(true);
    axios
      .get<{ data: AdminOrder[] }>(`/api/admin/orders?limit=200&paymentStatus=paid`)
      .then((r) => {
        const withAwb = (r.data.data ?? []).filter((o) => !!(o.awbNumber || o.trackingNumber));
        setOrders(withAwb);
      })
      .catch(() => toast.error("Failed to load orders"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return orders;
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        (o.awbNumber ?? o.trackingNumber ?? "").toLowerCase().includes(q) ||
        (o.user?.name ?? "").toLowerCase().includes(q),
    );
  }, [orders, search]);

  const allSelected = visible.length > 0 && visible.every((o) => selected.has(o._id));

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(visible.map((o) => o._id)));
  }
  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function fetchLabel(awb: string): Promise<string | null> {
    try {
      const res = await axios.get(`/api/shipping/label?awb=${awb}`);
      const labels = res.data?.data;
      return labels?.[0]?.label ?? null;
    } catch {
      return null;
    }
  }

  async function gatherLabels(orderIds: string[]): Promise<LabelEntry[]> {
    const entries: LabelEntry[] = [];
    for (const id of orderIds) {
      const o = orders.find((x) => x._id === id);
      const awb = o?.awbNumber ?? o?.trackingNumber;
      if (!o || !awb) continue;
      const label = await fetchLabel(awb);
      if (label) entries.push({ awb, orderNumber: o.orderNumber, label });
    }
    return entries;
  }

  async function handleBulkPrint() {
    if (selected.size === 0) return;
    setBusy(true);
    const entries = await gatherLabels(Array.from(selected));
    setBusy(false);
    if (entries.length === 0) {
      toast.error("No labels available for selected orders");
      return;
    }
    openPrintWindow(entries);
  }

  async function handleBulkDownload() {
    if (selected.size === 0) return;
    setBusy(true);
    const entries = await gatherLabels(Array.from(selected));
    setBusy(false);
    if (entries.length === 0) {
      toast.error("No labels available for selected orders");
      return;
    }
    for (const e of entries) {
      const link = document.createElement("a");
      link.href = e.label;
      link.download = `label-${e.orderNumber}-${e.awb}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
    toast.success(`Downloaded ${entries.length} label(s)`);
  }

  async function handleRowPrint(o: AdminOrder) {
    const awb = o.awbNumber ?? o.trackingNumber;
    if (!awb) return;
    setRowBusy((p) => ({ ...p, [o._id]: true }));
    const label = await fetchLabel(awb);
    setRowBusy((p) => ({ ...p, [o._id]: false }));
    if (!label) {
      toast.error("No label available");
      return;
    }
    openPrintWindow([{ awb, orderNumber: o.orderNumber, label }]);
  }

  async function handleRowDownload(o: AdminOrder) {
    const awb = o.awbNumber ?? o.trackingNumber;
    if (!awb) return;
    setRowBusy((p) => ({ ...p, [o._id]: true }));
    const label = await fetchLabel(awb);
    setRowBusy((p) => ({ ...p, [o._id]: false }));
    if (!label) {
      toast.error("No label available");
      return;
    }
    const link = document.createElement("a");
    link.href = label;
    link.download = `label-${o.orderNumber}-${awb}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function openPrintWindow(entries: LabelEntry[]) {
    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Popup blocked — allow popups to print");
      return;
    }
    const imgs = entries
      .map(
        (e) =>
          `<div class="page"><img src="${e.label}" alt="${e.orderNumber}"/><p>${e.orderNumber} · AWB ${e.awb}</p></div>`,
      )
      .join("");
    w.document.write(`<!doctype html><html><head><title>Shipping Labels</title>
<style>
  body { margin: 0; font-family: system-ui, sans-serif; }
  .page { page-break-after: always; padding: 16px; text-align: center; }
  .page:last-child { page-break-after: auto; }
  .page img { max-width: 100%; height: auto; }
  .page p { font-size: 12px; color: #555; margin-top: 8px; }
</style>
</head><body>${imgs}
<script>window.onload = function () { window.print(); };</script>
</body></html>`);
    w.document.close();
  }

  return (
    <div className="p-8">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Shipping Labels</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Print and download labels for orders with assigned AWB numbers
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchOrders}>
            <RiRefreshLine size={14} className="mr-1.5" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
        <div className="px-4 py-3 border-b border-neutral-100 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <RiSearchLine
              size={14}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order #, AWB, or customer"
              className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#E84672]"
            />
          </div>
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleAll}
            disabled={visible.length === 0}
            className="w-4 h-4 accent-[#E84672]"
          />
          <span className="text-sm text-neutral-500">
            {selected.size > 0 ? `${selected.size} selected` : `${visible.length} with AWB`}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={handleBulkDownload}
            isLoading={busy}
            disabled={selected.size === 0}
          >
            <RiDownloadLine size={14} className="mr-1.5" />
            Download
          </Button>
          <Button
            size="sm"
            onClick={handleBulkPrint}
            isLoading={busy}
            disabled={selected.size === 0}
          >
            <RiPrinterLine size={14} className="mr-1.5" />
            Print
          </Button>
        </div>

        {loading ? (
          <div className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" rounded="xl" />
            ))}
          </div>
        ) : visible.length === 0 ? (
          <div className="p-12 text-center">
            <RiBarcodeLine size={36} className="mx-auto text-neutral-300 mb-2" />
            <p className="text-sm font-semibold text-neutral-700">No labels to print</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Assign couriers from the Shipments page first.
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-100">
                <th className="w-10 px-4 py-3" />
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Order</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Customer</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">AWB</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Courier</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Status</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-neutral-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-50">
              {visible.map((o) => {
                const awb = o.awbNumber ?? o.trackingNumber ?? "";
                return (
                  <motion.tr
                    key={o._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-[#FAFAF9]"
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.has(o._id)}
                        onChange={() => toggleOne(o._id)}
                        className="w-4 h-4 accent-[#E84672]"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/orders/${o._id}`}
                        className="text-sm font-semibold text-neutral-800 hover:text-[#E84672]"
                      >
                        {o.orderNumber}
                      </Link>
                      <p className="text-xs text-neutral-400">{formatDate(o.createdAt)}</p>
                    </td>
                    <td className="px-4 py-3 text-sm text-neutral-700">
                      {o.user?.name ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-neutral-600">{awb}</td>
                    <td className="px-4 py-3 text-sm text-neutral-600">
                      {o.courierCompany ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <OrderStatusBadge status={o.orderStatus} />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRowDownload(o)}
                          isLoading={!!rowBusy[o._id]}
                        >
                          <RiDownloadLine size={14} />
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleRowPrint(o)}
                          isLoading={!!rowBusy[o._id]}
                        >
                          <RiPrinterLine size={14} />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
