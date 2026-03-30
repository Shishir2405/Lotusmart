"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { RiArrowLeftLine, RiUploadLine, RiDeleteBinLine, RiAddLine, RiArrowDownSLine } from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import axios from "axios";
import toast from "react-hot-toast";

interface Category {
  _id: string;
  name: string;
}

interface BulkPriceRow {
  minQty: string;
  maxQty: string;
  price: string;
  unit: string;
}

const PRODUCT_TYPES = [
  { value: "spice", label: "Spice" },
  { value: "dry_fruit", label: "Dry Fruit" },
  { value: "gifting", label: "Gifting" },
  { value: "herb", label: "Herb" },
  { value: "honey", label: "Honey" },
  { value: "superfood", label: "Superfood" },
];
const GST_RATES = ["0", "5", "12", "18", "28"];
const UNITS = ["g", "kg", "ml", "L", "pcs", "pack", "box"];
const DIMENSION_UNITS = ["cm", "in"];
const CERTIFICATIONS = ["FSSAI", "Organic India", "ISO 22000", "HACCP", "GMP", "Halal", "Kosher", "USDA Organic", "India Organic", "Non-GMO"];

const EMPTY_FORM = {
  // Basic Information
  name: "",
  description: "",
  shortDescription: "",
  category: "",
  subcategory: "",
  sku: "",
  barcode: "",
  productType: "",
  brand: "",
  manufacturer: "",
  tags: "",
  // Pricing
  price: "",
  compareAtPrice: "",
  costPrice: "",
  pricePerKg: "",
  pricePerGram: "",
  pricePerUnit: "",
  gstRate: "0",
  hsnCode: "",
  // Inventory
  stock: "",
  lowStockThreshold: "",
  unit: "g",
  weight: "",
  shippingWeight: "",
  minOrderQuantity: "",
  maxOrderQuantity: "",
  // Product Details
  countryOfOrigin: "India",
  ingredients: "",
  shelfLife: "",
  bestBefore: "",
  allergens: "",
  certifications: [] as string[],
  fssaiLicenseNumber: "",
  isOrganic: false,
  isVegan: false,
  isGlutenFree: false,
  // Nutrition Information
  servingSize: "",
  calories: "",
  totalFat: "",
  saturatedFat: "",
  transFat: "",
  cholesterol: "",
  sodium: "",
  totalCarbs: "",
  dietaryFiber: "",
  sugars: "",
  protein: "",
  // Dimensions & Shipping
  length: "",
  width: "",
  height: "",
  dimensionUnit: "cm",
  returnPolicy: "",
  warranty: "",
  // SEO & Media
  metaTitle: "",
  metaDescription: "",
  videoUrl: "",
  // Visibility
  isActive: true,
  isFeatured: false,
};

export default function NewProductPage() {
  const router = useRouter();
  const [form, setForm] = useState(EMPTY_FORM);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulkPricing, setBulkPricing] = useState<BulkPriceRow[]>([]);
  const [nutritionOpen, setNutritionOpen] = useState(false);

  useEffect(() => {
    axios.get<{ data: Category[] }>("/api/categories").then((r) => setCategories(r.data.data)).catch(() => null);
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("target", "product");
        const res = await axios.post<{ data: { url: string } }>("/api/upload", fd);
        setImages((prev) => [...prev, res.data.data.url]);
      }
    } catch {
      toast.error("Image upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handlePricePerKgChange = (value: string) => {
    const kg = parseFloat(value);
    setForm((f) => ({
      ...f,
      pricePerKg: value,
      pricePerGram: !isNaN(kg) && kg > 0 ? (kg / 1000).toFixed(2) : "",
    }));
  };

  const handlePricePerGramChange = (value: string) => {
    const g = parseFloat(value);
    setForm((f) => ({
      ...f,
      pricePerGram: value,
      pricePerKg: !isNaN(g) && g > 0 ? (g * 1000).toFixed(2) : "",
    }));
  };

  const addBulkPriceRow = () => {
    setBulkPricing((prev) => [...prev, { minQty: "", maxQty: "", price: "", unit: "g" }]);
  };

  const removeBulkPriceRow = (index: number) => {
    setBulkPricing((prev) => prev.filter((_, i) => i !== index));
  };

  const updateBulkPriceRow = (index: number, field: keyof BulkPriceRow, value: string) => {
    setBulkPricing((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const toggleCertification = (cert: string) => {
    setForm((f) => ({
      ...f,
      certifications: f.certifications.includes(cert)
        ? f.certifications.filter((c) => c !== cert)
        : [...f.certifications, cert],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || !form.stock) {
      toast.error("Name, price and stock are required");
      return;
    }
    setSaving(true);
    try {
      await axios.post("/api/products", {
        ...form,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        costPrice: form.costPrice ? Number(form.costPrice) : undefined,
        pricePerKg: form.pricePerKg ? Number(form.pricePerKg) : undefined,
        pricePerGram: form.pricePerGram ? Number(form.pricePerGram) : undefined,
        pricePerUnit: form.pricePerUnit ? Number(form.pricePerUnit) : undefined,
        gstRate: Number(form.gstRate),
        stock: Number(form.stock),
        lowStockThreshold: form.lowStockThreshold ? Number(form.lowStockThreshold) : undefined,
        weight: form.weight ? Number(form.weight) : undefined,
        shippingWeight: form.shippingWeight ? Number(form.shippingWeight) : undefined,
        minOrderQuantity: form.minOrderQuantity ? Number(form.minOrderQuantity) : undefined,
        maxOrderQuantity: form.maxOrderQuantity ? Number(form.maxOrderQuantity) : undefined,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        allergens: form.allergens ? form.allergens.split(",").map((t) => t.trim()).filter(Boolean) : [],
        category: form.category || undefined,
        images,
        bulkPricing: bulkPricing
          .filter((r) => r.minQty && r.price)
          .map((r) => ({
            minQty: Number(r.minQty),
            maxQty: r.maxQty ? Number(r.maxQty) : undefined,
            price: Number(r.price),
            unit: r.unit,
          })),
        nutritionInfo: {
          servingSize: form.servingSize || undefined,
          calories: form.calories ? Number(form.calories) : undefined,
          totalFat: form.totalFat ? Number(form.totalFat) : undefined,
          saturatedFat: form.saturatedFat ? Number(form.saturatedFat) : undefined,
          transFat: form.transFat ? Number(form.transFat) : undefined,
          cholesterol: form.cholesterol ? Number(form.cholesterol) : undefined,
          sodium: form.sodium ? Number(form.sodium) : undefined,
          totalCarbs: form.totalCarbs ? Number(form.totalCarbs) : undefined,
          dietaryFiber: form.dietaryFiber ? Number(form.dietaryFiber) : undefined,
          sugars: form.sugars ? Number(form.sugars) : undefined,
          protein: form.protein ? Number(form.protein) : undefined,
        },
        dimensions: {
          length: form.length ? Number(form.length) : undefined,
          width: form.width ? Number(form.width) : undefined,
          height: form.height ? Number(form.height) : undefined,
          unit: form.dimensionUnit,
        },
        returnPolicy: form.returnPolicy || undefined,
        warranty: form.warranty || undefined,
        seo: {
          metaTitle: form.metaTitle || undefined,
          metaDescription: form.metaDescription || undefined,
        },
        videoUrl: form.videoUrl || undefined,
      });
      toast.success("Product created");
      router.push("/admin/products");
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : "Failed to create product";
      toast.error(msg ?? "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  const selectClass = "w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672] bg-white";
  const textareaClass = "w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672] resize-none";
  const sectionClass = "bg-white rounded-2xl p-5 border border-neutral-100 space-y-4";
  const labelClass = "block text-sm font-medium text-neutral-700 mb-1.5";

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors mb-6">
        <RiArrowLeftLine size={15} />
        Back to Products
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Add New Product</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* ── Product Images ── */}
        <div className={sectionClass}>
          <h2 className="font-semibold text-neutral-800 mb-4">Product Images</h2>
          <div className="flex flex-wrap gap-3 mb-3">
            {images.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-neutral-200 group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => setImages((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <RiDeleteBinLine className="text-white" size={16} />
                </button>
                {i === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">Main</span>}
              </div>
            ))}
            <label className={`w-20 h-20 rounded-xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#E84672] transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
              <RiUploadLine size={18} className="text-neutral-400" />
              <span className="text-[10px] text-neutral-400 mt-1">{uploading ? "Uploading..." : "Add photo"}</span>
              <input type="file" accept="image/*" multiple className="sr-only" onChange={handleUpload} />
            </label>
          </div>
          <p className="text-xs text-neutral-400">First image is used as the main product image.</p>
        </div>

        {/* ── Basic Information ── */}
        <div className={sectionClass}>
          <h2 className="font-semibold text-neutral-800">Basic Information</h2>
          <Input label="Product Name *" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
          <div>
            <label className={labelClass}>Description</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              rows={4}
              className={textareaClass}
              placeholder="Describe the product..."
            />
          </div>
          <div>
            <label className={labelClass}>Short Description</label>
            <textarea
              value={form.shortDescription}
              onChange={(e) => setForm((f) => ({ ...f, shortDescription: e.target.value.slice(0, 500) }))}
              rows={2}
              maxLength={500}
              className={textareaClass}
              placeholder="Brief summary (max 500 characters)"
            />
            <p className="text-xs text-neutral-400 mt-1">{form.shortDescription.length}/500</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Category</label>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className={selectClass}>
                <option value="">No category</option>
                {categories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <Input label="Subcategory" value={form.subcategory} onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))} placeholder="e.g. Whole Spices" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="SKU" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} placeholder="Auto-generated if empty" />
            <Input label="Barcode" value={form.barcode} onChange={(e) => setForm((f) => ({ ...f, barcode: e.target.value }))} placeholder="EAN / UPC" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Product Type</label>
              <select value={form.productType} onChange={(e) => setForm((f) => ({ ...f, productType: e.target.value }))} className={selectClass}>
                <option value="">Select type</option>
                {PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <Input label="Brand" value={form.brand} onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))} />
          </div>
          <Input label="Manufacturer" value={form.manufacturer} onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))} />
          <Input label="Tags (comma-separated)" value={form.tags} onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))} placeholder="spice, organic, premium" />
        </div>

        {/* ── Pricing ── */}
        <div className={sectionClass}>
          <h2 className="font-semibold text-neutral-800">Pricing</h2>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Price (₹) *" type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} required />
            <Input label="Compare At Price (₹)" type="number" min="0" step="0.01" value={form.compareAtPrice} onChange={(e) => setForm((f) => ({ ...f, compareAtPrice: e.target.value }))} placeholder="MRP" />
            <Input label="Cost Price (₹)" type="number" min="0" step="0.01" value={form.costPrice} onChange={(e) => setForm((f) => ({ ...f, costPrice: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Price Per KG (₹)" type="number" min="0" step="0.01" value={form.pricePerKg} onChange={(e) => handlePricePerKgChange(e.target.value)} />
            <Input label="Price Per Gram (₹)" type="number" min="0" step="0.0001" value={form.pricePerGram} onChange={(e) => handlePricePerGramChange(e.target.value)} />
            <Input label="Price Per Unit (₹)" type="number" min="0" step="0.01" value={form.pricePerUnit} onChange={(e) => setForm((f) => ({ ...f, pricePerUnit: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>GST Rate</label>
              <select value={form.gstRate} onChange={(e) => setForm((f) => ({ ...f, gstRate: e.target.value }))} className={selectClass}>
                {GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}
              </select>
            </div>
            <Input label="HSN Code" value={form.hsnCode} onChange={(e) => setForm((f) => ({ ...f, hsnCode: e.target.value }))} placeholder="e.g. 0910" />
          </div>

        </div>

        {/* ── Inventory ── */}
        <div className={sectionClass}>
          <h2 className="font-semibold text-neutral-800">Inventory</h2>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Stock *" type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} required />
            <Input label="Low Stock Threshold" type="number" min="0" value={form.lowStockThreshold} onChange={(e) => setForm((f) => ({ ...f, lowStockThreshold: e.target.value }))} placeholder="Alert when below" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Unit</label>
              <select value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} className={selectClass}>
                {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
            <Input label="Weight (grams)" type="number" min="0" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Shipping Weight (g)" type="number" min="0" value={form.shippingWeight} onChange={(e) => setForm((f) => ({ ...f, shippingWeight: e.target.value }))} />
            <Input label="Min Order Qty" type="number" min="1" value={form.minOrderQuantity} onChange={(e) => setForm((f) => ({ ...f, minOrderQuantity: e.target.value }))} />
            <Input label="Max Order Qty" type="number" min="1" value={form.maxOrderQuantity} onChange={(e) => setForm((f) => ({ ...f, maxOrderQuantity: e.target.value }))} />
          </div>
        </div>

        {/* ── Bulk Pricing ── */}
        <div className={sectionClass}>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-neutral-800">Bulk Pricing</h2>
            <button type="button" onClick={addBulkPriceRow} className="inline-flex items-center gap-1 text-sm text-[#E84672] hover:text-[#d13a64] font-medium transition-colors">
              <RiAddLine size={16} /> Add Tier
            </button>
          </div>
          {bulkPricing.length === 0 && (
            <p className="text-sm text-neutral-400">No bulk pricing tiers. Click &quot;Add Tier&quot; to create one.</p>
          )}
          {bulkPricing.map((row, i) => (
            <div key={i} className="grid grid-cols-[1fr_1fr_1fr_80px_32px] gap-2 items-end">
              <Input label={i === 0 ? "Min Qty" : undefined} type="number" min="1" value={row.minQty} onChange={(e) => updateBulkPriceRow(i, "minQty", e.target.value)} placeholder="Min" />
              <Input label={i === 0 ? "Max Qty" : undefined} type="number" min="1" value={row.maxQty} onChange={(e) => updateBulkPriceRow(i, "maxQty", e.target.value)} placeholder="Max" />
              <Input label={i === 0 ? "Price (₹)" : undefined} type="number" min="0" step="0.01" value={row.price} onChange={(e) => updateBulkPriceRow(i, "price", e.target.value)} placeholder="Price" />
              <div>
                {i === 0 && <label className={labelClass}>Unit</label>}
                <select value={row.unit} onChange={(e) => updateBulkPriceRow(i, "unit", e.target.value)} className={selectClass}>
                  {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
              <button type="button" onClick={() => removeBulkPriceRow(i)} className="h-10.5 flex items-center justify-center text-neutral-400 hover:text-red-500">
                <RiDeleteBinLine size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* ── Product Details ── */}
        <div className={sectionClass}>
          <h2 className="font-semibold text-neutral-800">Product Details</h2>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Country of Origin" value={form.countryOfOrigin} onChange={(e) => setForm((f) => ({ ...f, countryOfOrigin: e.target.value }))} />
            <Input label="Shelf Life" value={form.shelfLife} onChange={(e) => setForm((f) => ({ ...f, shelfLife: e.target.value }))} placeholder="e.g. 12 months" />
            <Input label="Best Before" type="date" value={form.bestBefore} onChange={(e) => setForm((f) => ({ ...f, bestBefore: e.target.value }))} />
          </div>
          <div>
            <label className={labelClass}>Ingredients</label>
            <textarea
              value={form.ingredients}
              onChange={(e) => setForm((f) => ({ ...f, ingredients: e.target.value }))}
              rows={3}
              className={textareaClass}
              placeholder="List all ingredients..."
            />
          </div>
          <Input label="Allergens (comma-separated)" value={form.allergens} onChange={(e) => setForm((f) => ({ ...f, allergens: e.target.value }))} placeholder="e.g. Nuts, Gluten, Dairy" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Weight (grams)" type="number" min="0" value={form.weight} onChange={(e) => setForm((f) => ({ ...f, weight: e.target.value }))} placeholder="Net weight" />
            <Input label="Shipping Weight (grams)" type="number" min="0" value={form.shippingWeight} onChange={(e) => setForm((f) => ({ ...f, shippingWeight: e.target.value }))} placeholder="With packaging" />
          </div>
        </div>

        {/* ── Nutrition Info (collapsible) ── */}
        <div className="bg-white rounded-2xl border border-neutral-100">
          <button
            type="button"
            onClick={() => setNutritionOpen((o) => !o)}
            className="w-full flex items-center justify-between p-5"
          >
            <h2 className="font-semibold text-neutral-800">Nutrition Info</h2>
            <RiArrowDownSLine size={20} className={`text-neutral-400 transition-transform ${nutritionOpen ? "rotate-180" : ""}`} />
          </button>
          {nutritionOpen && (
            <div className="px-5 pb-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Serving Size" value={form.servingSize} onChange={(e) => setForm((f) => ({ ...f, servingSize: e.target.value }))} placeholder="e.g. 100g" />
                <Input label="Calories" type="number" min="0" value={form.calories} onChange={(e) => setForm((f) => ({ ...f, calories: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Total Fat (g)" type="number" min="0" step="0.1" value={form.totalFat} onChange={(e) => setForm((f) => ({ ...f, totalFat: e.target.value }))} />
                <Input label="Saturated Fat (g)" type="number" min="0" step="0.1" value={form.saturatedFat} onChange={(e) => setForm((f) => ({ ...f, saturatedFat: e.target.value }))} />
                <Input label="Trans Fat (g)" type="number" min="0" step="0.1" value={form.transFat} onChange={(e) => setForm((f) => ({ ...f, transFat: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Cholesterol (mg)" type="number" min="0" value={form.cholesterol} onChange={(e) => setForm((f) => ({ ...f, cholesterol: e.target.value }))} />
                <Input label="Sodium (mg)" type="number" min="0" value={form.sodium} onChange={(e) => setForm((f) => ({ ...f, sodium: e.target.value }))} />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input label="Total Carbs (g)" type="number" min="0" step="0.1" value={form.totalCarbs} onChange={(e) => setForm((f) => ({ ...f, totalCarbs: e.target.value }))} />
                <Input label="Dietary Fiber (g)" type="number" min="0" step="0.1" value={form.dietaryFiber} onChange={(e) => setForm((f) => ({ ...f, dietaryFiber: e.target.value }))} />
                <Input label="Sugars (g)" type="number" min="0" step="0.1" value={form.sugars} onChange={(e) => setForm((f) => ({ ...f, sugars: e.target.value }))} />
              </div>
              <Input label="Protein (g)" type="number" min="0" step="0.1" value={form.protein} onChange={(e) => setForm((f) => ({ ...f, protein: e.target.value }))} />
            </div>
          )}
        </div>

        {/* ── Certifications & Dietary ── */}
        <div className={sectionClass}>
          <h2 className="font-semibold text-neutral-800">Certifications & Dietary</h2>
          <div>
            <label className={labelClass}>Certifications</label>
            <div className="flex flex-wrap gap-2 mt-1">
              {CERTIFICATIONS.map((cert) => (
                <label key={cert} className="flex items-center gap-1.5 text-sm cursor-pointer bg-neutral-50 rounded-lg px-3 py-1.5 border border-neutral-200 hover:border-[#E84672] transition-colors">
                  <input
                    type="checkbox"
                    checked={form.certifications.includes(cert)}
                    onChange={() => toggleCertification(cert)}
                    className="rounded accent-[#E84672]"
                  />
                  {cert}
                </label>
              ))}
            </div>
          </div>
          <Input label="FSSAI License Number" value={form.fssaiLicenseNumber} onChange={(e) => setForm((f) => ({ ...f, fssaiLicenseNumber: e.target.value }))} placeholder="e.g. 10012345678901" />
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.isOrganic} onChange={(e) => setForm((f) => ({ ...f, isOrganic: e.target.checked }))} className="rounded accent-[#E84672]" />
              <span className="text-sm text-neutral-700">Is Organic</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.isVegan} onChange={(e) => setForm((f) => ({ ...f, isVegan: e.target.checked }))} className="rounded accent-[#E84672]" />
              <span className="text-sm text-neutral-700">Is Vegan</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" checked={form.isGlutenFree} onChange={(e) => setForm((f) => ({ ...f, isGlutenFree: e.target.checked }))} className="rounded accent-[#E84672]" />
              <span className="text-sm text-neutral-700">Is Gluten Free</span>
            </label>
          </div>
        </div>

        {/* ── Dimensions & Shipping ── */}
        <div className={sectionClass}>
          <h2 className="font-semibold text-neutral-800">Dimensions & Shipping</h2>
          <div className="grid grid-cols-4 gap-4">
            <Input label="Length" type="number" min="0" step="0.1" value={form.length} onChange={(e) => setForm((f) => ({ ...f, length: e.target.value }))} />
            <Input label="Width" type="number" min="0" step="0.1" value={form.width} onChange={(e) => setForm((f) => ({ ...f, width: e.target.value }))} />
            <Input label="Height" type="number" min="0" step="0.1" value={form.height} onChange={(e) => setForm((f) => ({ ...f, height: e.target.value }))} />
            <div>
              <label className={labelClass}>Unit</label>
              <select value={form.dimensionUnit} onChange={(e) => setForm((f) => ({ ...f, dimensionUnit: e.target.value }))} className={selectClass}>
                {DIMENSION_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          <Input label="Shipping Weight (grams)" type="number" min="0" value={form.shippingWeight} onChange={(e) => setForm((f) => ({ ...f, shippingWeight: e.target.value }))} placeholder="With packaging" />
        </div>

        {/* ── Media ── */}
        <div className={sectionClass}>
          <h2 className="font-semibold text-neutral-800">Media</h2>
          <Input label="Video URL" value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} placeholder="https://youtube.com/..." />
          <p className="text-xs text-neutral-400">Images are managed in the Product Images section above.</p>
        </div>

        {/* ── SEO ── */}
        <div className={sectionClass}>
          <h2 className="font-semibold text-neutral-800">SEO</h2>
          <div>
            <Input label="Meta Title" value={form.metaTitle} onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value.slice(0, 70) }))} placeholder="Page title for search engines" />
            <p className="text-xs text-neutral-400 mt-1">{form.metaTitle.length}/70 characters</p>
          </div>
          <div>
            <label className={labelClass}>Meta Description</label>
            <textarea
              value={form.metaDescription}
              onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value.slice(0, 160) }))}
              rows={2}
              className={textareaClass}
              placeholder="Brief description for search results..."
            />
            <p className="text-xs text-neutral-400 mt-1">{form.metaDescription.length}/160 characters</p>
          </div>
        </div>

        {/* ── Policies ── */}
        <div className={sectionClass}>
          <h2 className="font-semibold text-neutral-800">Policies</h2>
          <div>
            <label className={labelClass}>Return Policy</label>
            <textarea
              value={form.returnPolicy}
              onChange={(e) => setForm((f) => ({ ...f, returnPolicy: e.target.value }))}
              rows={3}
              className={textareaClass}
              placeholder="Describe return policy for this product..."
            />
          </div>
          <Input label="Warranty" value={form.warranty} onChange={(e) => setForm((f) => ({ ...f, warranty: e.target.value }))} placeholder="e.g. No warranty / 6 months" />
        </div>

        {/* ── Visibility ── */}
        <div className="bg-white rounded-2xl p-5 border border-neutral-100 space-y-3">
          <h2 className="font-semibold text-neutral-800">Visibility</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="rounded accent-[#E84672]" />
            <span className="text-sm text-neutral-700">Active (visible to customers)</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => setForm((f) => ({ ...f, isFeatured: e.target.checked }))} className="rounded accent-[#E84672]" />
            <span className="text-sm text-neutral-700">Featured (shown on homepage)</span>
          </label>
        </div>

        <div className="flex gap-3">
          <Button type="submit" isLoading={saving}>Create Product</Button>
          <Link href="/admin/products"><Button variant="outline">Cancel</Button></Link>
        </div>
      </form>
    </div>
  );
}
