"use client";

import { useEffect, useState } from "react";
import { RiBuilding2Line, RiAddLine, RiDeleteBinLine } from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import axios from "axios";
import toast from "@/components/ui/toast";

interface Warehouse {
  id: number;
  default: string;
  address_title: string;
  name: string;
  email: string;
  phone: string;
  address_line_one: string;
  address_line_two: string;
  pincode: string;
  city: string;
  state: string;
  country: string;
  status: string;
}

const emptyForm = {
  address_title: "",
  name: "",
  phone: "",
  email: "",
  address_line_one: "",
  address_line_two: "",
  pin_code: "",
};

export default function AdminWarehousesPage() {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchWarehouses = () => {
    setLoading(true);
    axios
      .get<{ data: Warehouse[] }>("/api/shipping/warehouses")
      .then((r) => setWarehouses(r.data?.data ?? []))
      .catch((err) =>
        toast.error(
          axios.isAxiosError(err)
            ? (err.response?.data?.message ?? "Failed to load warehouses")
            : "Failed to load warehouses",
        ),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  const handleCreate = async () => {
    if (!form.address_title || !form.address_line_one || !form.pin_code) {
      toast.error("Title, address, and pincode are required");
      return;
    }
    setCreating(true);
    try {
      await axios.post("/api/shipping/warehouses", form);
      toast.success("Warehouse created");
      setForm(emptyForm);
      setShowForm(false);
      fetchWarehouses();
    } catch (err) {
      toast.error(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? "Failed to create warehouse")
          : "Failed to create warehouse",
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900">Warehouses</h1>
          <p className="text-sm text-neutral-400 mt-0.5">
            Manage your Shipmozo warehouses for order fulfillment
          </p>
        </div>
        <Button onClick={() => setShowForm((v) => !v)}>
          <RiAddLine size={16} className="mr-1.5" />
          {showForm ? "Cancel" : "Add Warehouse"}
        </Button>
      </div>

      {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-neutral-100 p-5 mb-6">
          <h2 className="font-semibold text-neutral-900 mb-4">New Warehouse</h2>
          <div className="grid md:grid-cols-2 gap-3">
            <input
              placeholder="Warehouse Title *"
              value={form.address_title}
              onChange={(e) => setForm((f) => ({ ...f, address_title: e.target.value }))}
              className="border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672]"
            />
            <input
              placeholder="Contact Name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              className="border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672]"
            />
            <input
              placeholder="Phone"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              className="border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672]"
            />
            <input
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672]"
            />
            <input
              placeholder="Address Line 1 *"
              value={form.address_line_one}
              onChange={(e) => setForm((f) => ({ ...f, address_line_one: e.target.value }))}
              className="md:col-span-2 border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672]"
            />
            <input
              placeholder="Address Line 2"
              value={form.address_line_two}
              onChange={(e) => setForm((f) => ({ ...f, address_line_two: e.target.value }))}
              className="border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672]"
            />
            <input
              placeholder="Pincode *"
              value={form.pin_code}
              onChange={(e) => setForm((f) => ({ ...f, pin_code: e.target.value }))}
              className="border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672]"
            />
          </div>
          <div className="mt-4">
            <Button onClick={handleCreate} isLoading={creating}>
              Create Warehouse
            </Button>
          </div>
        </div>
      )}

      {/* Warehouses List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-24 w-full" rounded="xl" />
          ))}
        </div>
      ) : warehouses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-neutral-100 p-12 text-center">
          <RiBuilding2Line size={40} className="mx-auto text-neutral-300 mb-3" />
          <h3 className="font-semibold text-neutral-700 mb-1">No warehouses yet</h3>
          <p className="text-sm text-neutral-400 mb-4">
            Add your first warehouse to start shipping orders via Shipmozo.
          </p>
          <Button onClick={() => setShowForm(true)}>
            <RiAddLine size={16} className="mr-1.5" />
            Add Warehouse
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {warehouses.map((wh) => (
            <div
              key={wh.id}
              className="bg-white rounded-2xl border border-neutral-100 p-5 flex items-start justify-between"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-neutral-900">{wh.address_title}</h3>
                  {wh.default === "YES" && (
                    <span className="text-[10px] font-bold bg-[#E84672] text-white px-2 py-0.5 rounded-full">
                      DEFAULT
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      wh.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {wh.status}
                  </span>
                </div>
                <p className="text-sm text-neutral-500">
                  {wh.address_line_one}
                  {wh.address_line_two ? `, ${wh.address_line_two}` : ""}
                </p>
                <p className="text-sm text-neutral-500">
                  {wh.city}, {wh.state} — {wh.pincode}
                </p>
                <div className="flex gap-4 mt-1.5 text-xs text-neutral-400">
                  {wh.name && <span>{wh.name}</span>}
                  {wh.phone && <span>{wh.phone}</span>}
                  {wh.email && <span>{wh.email}</span>}
                </div>
                <p className="text-[10px] text-neutral-300 mt-1">ID: {wh.id}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
