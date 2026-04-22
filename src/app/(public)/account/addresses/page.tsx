"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RiAddLine, RiEditLine, RiDeleteBinLine, RiHomeSmileLine, RiBriefcaseLine, RiMapPinLine } from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { LocationSelector } from "@/components/ui/LocationSelector";
import LocationPicker, { type LocationPickerValue } from "@/components/shared/LocationPicker";
import axios from "axios";
import toast from "@/components/ui/toast";

interface Address {
  _id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  label: "home" | "work" | "other";
  isDefault: boolean;
  coordinates?: { lat: number; lng: number };
  formattedAddress?: string;
}

const LABEL_ICONS = { home: <RiHomeSmileLine size={14} />, work: <RiBriefcaseLine size={14} />, other: <RiMapPinLine size={14} /> };

type AddressLabel = "home" | "work" | "other";
interface FormState {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  label: AddressLabel;
  isDefault: boolean;
  coordinates?: { lat: number; lng: number };
  formattedAddress?: string;
}
const EMPTY_FORM: FormState = { fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "", label: "home", isDefault: false };

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchAddresses = () => {
    setLoading(true);
    axios
      .get<{ data: Address[] }>("/api/auth/addresses")
      .then((r) => setAddresses(r.data.data))
      .catch(() => toast.error("Failed to load addresses"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAddresses(); }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(true); };

  const openEdit = (addr: Address) => {
    setForm({
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 ?? "",
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      label: addr.label,
      isDefault: addr.isDefault,
      coordinates: addr.coordinates,
      formattedAddress: addr.formattedAddress,
    });
    setEditId(addr._id);
    setShowForm(true);
  };

  const onLocation = (value: LocationPickerValue) => {
    setForm((f) => ({
      ...f,
      addressLine1: value.addressLine1 || f.addressLine1,
      addressLine2: value.addressLine2 ?? f.addressLine2,
      city: value.city || f.city,
      state: value.state || f.state,
      pincode: value.pincode || f.pincode,
      coordinates: value.coordinates ?? f.coordinates,
      formattedAddress: value.formattedAddress ?? f.formattedAddress,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await axios.patch(`/api/auth/addresses/${editId}`, form);
        toast.success("Address updated");
      } else {
        await axios.post("/api/auth/addresses", form);
        toast.success("Address added");
      }
      setShowForm(false);
      fetchAddresses();
    } catch {
      toast.error("Failed to save address");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this address?")) return;
    setDeletingId(id);
    try {
      await axios.delete(`/api/auth/addresses/${id}`);
      setAddresses((prev) => prev.filter((a) => a._id !== id));
      toast.success("Address removed");
    } catch {
      toast.error("Failed to remove address");
    } finally {
      setDeletingId(null);
    }
  };

  const setDefault = async (id: string) => {
    try {
      await axios.patch(`/api/auth/addresses/${id}`, { isDefault: true });
      setAddresses((prev) => prev.map((a) => ({ ...a, isDefault: a._id === id })));
    } catch {
      toast.error("Failed to update");
    }
  };

  return (
    <div className="container-narrow py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">Saved Addresses</h1>
        {!showForm && (
          <Button leftIcon={<RiAddLine />} onClick={openAdd}>Add Address</Button>
        )}
      </div>

      
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="bg-white rounded-2xl p-6 border border-neutral-100 mb-6"
          >
            <h2 className="font-semibold text-neutral-900 mb-5">{editId ? "Edit Address" : "Add New Address"}</h2>
            <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <LocationPicker
                  initialValue={{
                    addressLine1: form.addressLine1,
                    city: form.city,
                    state: form.state,
                    pincode: form.pincode,
                    coordinates: form.coordinates,
                    formattedAddress: form.formattedAddress,
                  }}
                  onChange={onLocation}
                />
              </div>
              <Input label="Full Name" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} required />
              <Input label="Phone" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} required />
              <div className="sm:col-span-2">
                <Input label="Address Line 1" value={form.addressLine1} onChange={(e) => setForm((f) => ({ ...f, addressLine1: e.target.value }))} required />
              </div>
              <div className="sm:col-span-2">
                <Input label="Address Line 2 (optional)" value={form.addressLine2} onChange={(e) => setForm((f) => ({ ...f, addressLine2: e.target.value }))} />
              </div>
              <div className="sm:col-span-2">
                <LocationSelector
                  state={form.state}
                  city={form.city}
                  onStateChange={(v) => setForm((f) => ({ ...f, state: v }))}
                  onCityChange={(v) => setForm((f) => ({ ...f, city: v }))}
                />
              </div>
              <Input label="Pincode" value={form.pincode} onChange={(e) => setForm((f) => ({ ...f, pincode: e.target.value }))} required maxLength={6} />
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-1.5">Label</label>
                <select
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value as AddressLabel }))}
                  className="w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672] bg-white"
                >
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="sm:col-span-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={form.isDefault}
                  onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))}
                  className="rounded accent-[#E84672]"
                />
                <label htmlFor="isDefault" className="text-sm text-neutral-700">Set as default address</label>
              </div>
              <div className="sm:col-span-2 flex gap-3 pt-1">
                <Button type="submit" isLoading={saving}>{editId ? "Update" : "Save Address"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      
      {loading ? (
        <div className="grid sm:grid-cols-2 gap-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-44 border border-neutral-100 animate-pulse" />
          ))}
        </div>
      ) : addresses.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">📍</div>
          <p className="text-neutral-500">No saved addresses. Add one to speed up checkout.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <motion.div
              key={addr._id}
              layout
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`bg-white rounded-2xl p-5 border transition-colors ${addr.isDefault ? "border-[#E84672]" : "border-neutral-100"}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${addr.label === "home" ? "bg-blue-50 text-blue-700" : addr.label === "work" ? "bg-purple-50 text-purple-700" : "bg-neutral-100 text-neutral-600"}`}>
                    {LABEL_ICONS[addr.label]}
                    {addr.label}
                  </span>
                  {addr.isDefault && (
                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-[#FFF1F3] text-[#E84672]">Default</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => openEdit(addr)} className="p-1.5 rounded-lg hover:bg-blue-50 text-neutral-400 hover:text-blue-600 transition-colors">
                    <RiEditLine size={14} />
                  </button>
                  <button onClick={() => handleDelete(addr._id)} disabled={deletingId === addr._id} className="p-1.5 rounded-lg hover:bg-red-50 text-neutral-400 hover:text-red-500 transition-colors disabled:opacity-40">
                    <RiDeleteBinLine size={14} />
                  </button>
                </div>
              </div>
              <p className="text-sm font-semibold text-neutral-800">{addr.fullName}</p>
              <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
                {addr.addressLine1}
                {addr.addressLine2 && `, ${addr.addressLine2}`}<br />
                {addr.city}, {addr.state} — {addr.pincode}
              </p>
              <p className="text-xs text-neutral-400 mt-1">{addr.phone}</p>
              {!addr.isDefault && (
                <button onClick={() => setDefault(addr._id)} className="mt-3 text-xs text-[#E84672] font-medium hover:underline">
                  Set as default
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
