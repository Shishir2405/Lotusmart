"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { RiArrowLeftLine, RiUploadLine, RiDeleteBinLine, RiAddLine, RiArrowDownSLine, RiCloseLine } from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import axios from "axios";
import toast from "@/components/ui/toast";
import { normalizeImageUrl } from "@/utils/helpers";
import { useUpload } from "@/hooks/useUpload";

interface Category {
  _id: string;
  name: string;
  parent?: string | { _id: string } | null;
  children?: Category[];
}

// Categories are fetched flat (`?flat=true`); `parent` may be null (top-level),
// an id string, or a populated object. Normalize it to a plain id.
const parentIdOf = (c: Category): string | null => {
  const p = c.parent;
  if (!p) return null;
  return typeof p === "object" ? (p as { _id: string })._id : p;
};

const topLevelCategories = (cats: Category[]): Category[] =>
  cats.filter((c) => !parentIdOf(c));

// Flatten the entire descendant subtree (children, grandchildren, …) of a root
// category, depth-first, tagging each with its depth so deeper levels can be
// indented in the <select>.
const descendantOptions = (
  rootId: string,
  cats: Category[],
): { cat: Category; depth: number }[] => {
  if (!rootId) return [];
  const byParent = new Map<string, Category[]>();
  for (const c of cats) {
    const pid = parentIdOf(c);
    if (!pid) continue;
    const arr = byParent.get(pid);
    if (arr) arr.push(c);
    else byParent.set(pid, [c]);
  }
  const out: { cat: Category; depth: number }[] = [];
  const walk = (pid: string, depth: number) => {
    for (const child of byParent.get(pid) ?? []) {
      out.push({ cat: child, depth });
      walk(child._id, depth + 1);
    }
  };
  walk(rootId, 0);
  return out;
};

interface BulkPriceRow {
  minQty: string;
  maxQty: string;
  price: string;
  unit: string;
}


interface ProductData {
  name: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  pricePerKg?: number;
  pricePerGram?: number;
  pricePerUnit?: number;
  gstRate?: number;
  hsnCode?: string;
  stock: number;
  lowStockThreshold?: number;
  unit: string;
  category?: { _id: string } | string;
  subcategory?: string;
  sku: string;
  barcode?: string;
  productType?: string;
  brand?: string;
  manufacturer?: string;
  isActive: boolean;
  isFeatured: boolean;
  tags: string[];
  images: string[];
  videos?: string[];
  weight?: number;
  shippingWeight?: number;
  minOrderQuantity?: number;
  maxOrderQuantity?: number;
  countryOfOrigin?: string;
  ingredients?: string;
  shelfLife?: string;
  bestBefore?: string;
  allergens?: string[];
  certifications?: string[];
  fssaiLicenseNumber?: string;
  isOrganic?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  nutritionInfo?: any;
  dimensions?: any;
  bulkPricing?: any[];
  returnPolicy?: string;
  warranty?: string;
  seo?: { metaTitle?: string; metaDescription?: string };
  videoUrl?: string;
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
// Must match ProductUnit enum in src/modules/products/product.model.ts
const UNITS = ["g", "kg", "ml", "L", "pieces", "pack", "box"];
const DIMENSION_UNITS = ["cm", "in"];
const CERTIFICATIONS = ["FSSAI", "Organic India", "ISO 22000", "HACCP", "GMP", "Halal", "Kosher", "USDA Organic", "India Organic", "Non-GMO"];

const EMPTY_FORM = {
  
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
  
  price: "",
  compareAtPrice: "",
  costPrice: "",
  pricePerKg: "",
  pricePerGram: "",
  pricePerUnit: "",
  gstRate: "0",
  hsnCode: "",
  
  stock: "",
  lowStockThreshold: "",
  unit: "g",
  weight: "",
  shippingWeight: "",
  minOrderQuantity: "",
  maxOrderQuantity: "",
  
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
  
  length: "",
  width: "",
  height: "",
  dimensionUnit: "cm",
  returnPolicy: "",
  warranty: "",
  
  metaTitle: "",
  metaDescription: "",
  videoUrl: "",
  
  isActive: true,
  isFeatured: false,
};

export default function EditProductPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const { upload, uploading, stage, progress } = useUpload({ target: "products" });
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [bulkPricing, setBulkPricing] = useState<BulkPriceRow[]>([]);
  const [nutritionOpen, setNutritionOpen] = useState(false);
  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [creatingSubcategory, setCreatingSubcategory] = useState(false);

  useEffect(() => {
    Promise.all([
      axios.get<{ data: ProductData }>(`/api/products/${id}`),
      axios.get<{ data: Category[] }>("/api/categories?flat=true"),
    ]).then(([pRes, cRes]: [{ data: { data: ProductData } }, { data: { data: Category[] } }]) => {
      const p = pRes.data.data;
      const catId = typeof p.category === "object" && p.category ? (p.category as { _id: string })._id : p.category ?? "";
      const ni = p.nutritionInfo ?? {};
      const dim = p.dimensions ?? {};
      const seo = p.seo ?? {};

      setForm({
        name: p.name ?? "",
        description: p.description ?? "",
        shortDescription: p.shortDescription ?? "",
        category: catId as string,
        subcategory: p.subcategory ?? "",
        sku: p.sku ?? "",
        barcode: p.barcode ?? "",
        productType: p.productType ?? "",
        brand: p.brand ?? "",
        manufacturer: p.manufacturer ?? "",
        tags: (p.tags ?? []).join(", "),
        price: String(p.price ?? ""),
        compareAtPrice: p.compareAtPrice ? String(p.compareAtPrice) : "",
        costPrice: p.costPrice ? String(p.costPrice) : "",
        pricePerKg: p.pricePerKg ? String(p.pricePerKg) : "",
        pricePerGram: p.pricePerGram ? String(p.pricePerGram) : "",
        pricePerUnit: p.pricePerUnit ? String(p.pricePerUnit) : "",
        gstRate: p.gstRate != null ? String(p.gstRate) : "0",
        hsnCode: p.hsnCode ?? "",
        stock: String(p.stock ?? ""),
        lowStockThreshold: p.lowStockThreshold ? String(p.lowStockThreshold) : "",
        unit: p.unit ?? "g",
        weight: p.weight ? String(p.weight) : "",
        shippingWeight: p.shippingWeight ? String(p.shippingWeight) : "",
        minOrderQuantity: p.minOrderQuantity ? String(p.minOrderQuantity) : "",
        maxOrderQuantity: p.maxOrderQuantity ? String(p.maxOrderQuantity) : "",
        countryOfOrigin: p.countryOfOrigin ?? "",
        ingredients: p.ingredients ?? "",
        shelfLife: p.shelfLife ?? "",
        bestBefore: p.bestBefore ?? "",
        allergens: (p.allergens ?? []).join(", "),
        certifications: p.certifications ?? [],
        fssaiLicenseNumber: p.fssaiLicenseNumber ?? "",
        isOrganic: p.isOrganic ?? false,
        isVegan: p.isVegan ?? false,
        isGlutenFree: p.isGlutenFree ?? false,
        servingSize: ni.servingSize ?? "",
        calories: ni.calories ? String(ni.calories) : "",
        totalFat: ni.totalFat ? String(ni.totalFat) : "",
        saturatedFat: ni.saturatedFat ? String(ni.saturatedFat) : "",
        transFat: ni.transFat ? String(ni.transFat) : "",
        cholesterol: ni.cholesterol ? String(ni.cholesterol) : "",
        sodium: ni.sodium ? String(ni.sodium) : "",
        totalCarbs: ni.totalCarbs ? String(ni.totalCarbs) : "",
        dietaryFiber: ni.dietaryFiber ? String(ni.dietaryFiber) : "",
        sugars: ni.sugars ? String(ni.sugars) : "",
        protein: ni.protein ? String(ni.protein) : "",
        length: dim.length ? String(dim.length) : "",
        width: dim.width ? String(dim.width) : "",
        height: dim.height ? String(dim.height) : "",
        dimensionUnit: dim.unit ?? "cm",
        returnPolicy: p.returnPolicy ?? "",
        warranty: p.warranty ?? "",
        metaTitle: seo.metaTitle ?? "",
        metaDescription: seo.metaDescription ?? "",
        videoUrl: p.videoUrl ?? "",
        isActive: p.isActive,
        isFeatured: p.isFeatured,
      });

      setImages(p.images ?? []);
      setVideos(p.videos ?? []);
      setCategories(cRes.data.data);

      if (p.bulkPricing && p.bulkPricing.length > 0) {
        setBulkPricing(
          p.bulkPricing.map((bp: { minQty?: number; maxQty?: number; price?: number; unit?: string }) => ({
            minQty: bp.minQty ? String(bp.minQty) : "",
            maxQty: bp.maxQty ? String(bp.maxQty) : "",
            price: bp.price ? String(bp.price) : "",
            unit: bp.unit ?? "g",
          }))
        );
      }
    }).catch(() => toast.error("Failed to load product")).finally(() => setLoading(false));
  }, [id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Snapshot the files into a real array BEFORE clearing the input — reading
    // a live FileList after resetting value yields an empty list in some
    // browsers, which would drop the upload before it ever starts.
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!files.length) return;
    for (const file of files) {
      const result = await upload(file);
      if (!result) continue;
      if (result.kind === "video") setVideos((p) => [...p, result.url]);
      else setImages((p) => [...p, result.url]);
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

  const handleCreateSubcategory = async () => {
    if (!form.category) { toast.error("Please select a Category first"); return; }
    const trimmed = newSubcategoryName.trim();
    if (trimmed.length < 2) { toast.error("Subcategory name must be at least 2 characters"); return; }
    setCreatingSubcategory(true);
    try {
      const res = await axios.post<{ data: Category }>("/api/admin/categories", {
        name: trimmed,
        parent: form.category,
        isActive: true,
      });
      const created = res.data.data;
      setCategories((prev) => [...prev, created]);
      setForm((f) => ({ ...f, subcategory: created._id }));
      setNewSubcategoryName("");
      setSubcategoryModalOpen(false);
      toast.success("Subcategory created");
    } catch (err: unknown) {
      toast.error(axios.isAxiosError(err) ? (err.response?.data?.message ?? "Failed to create subcategory") : "Failed to create subcategory");
    } finally {
      setCreatingSubcategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.price || form.stock === "") {
      toast.error("Name, price and stock are required");
      return;
    }
    setSaving(true);
    try {
      // Build an explicit payload so only fields that exist on the Product
      // schema are sent. Empty strings get normalized to undefined so casts
      // don't fail (notably `bestBefore` — an empty string breaks Date validation
      // and would silently block every update, including stock changes).
      const payload = {
        name: form.name,
        description: form.description || undefined,
        shortDescription: form.shortDescription || undefined,
        price: Number(form.price),
        compareAtPrice: form.compareAtPrice ? Number(form.compareAtPrice) : undefined,
        costPrice: form.costPrice ? Number(form.costPrice) : undefined,
        pricePerKg: form.pricePerKg ? Number(form.pricePerKg) : undefined,
        pricePerGram: form.pricePerGram ? Number(form.pricePerGram) : undefined,
        pricePerUnit: form.pricePerUnit ? Number(form.pricePerUnit) : undefined,
        gstRate: form.gstRate !== "" ? Number(form.gstRate) : undefined,
        hsn: form.hsnCode || undefined,
        sku: form.sku || undefined,
        barcode: form.barcode || undefined,
        productType: form.productType || undefined,
        brand: form.brand || undefined,
        manufacturer: form.manufacturer || undefined,
        stock: Number(form.stock),
        lowStockThreshold:
          form.lowStockThreshold !== "" ? Number(form.lowStockThreshold) : undefined,
        unit: form.unit,
        weight: form.weight ? Number(form.weight) : undefined,
        shippingWeight: form.shippingWeight ? Number(form.shippingWeight) : undefined,
        minOrderQuantity: form.minOrderQuantity ? Number(form.minOrderQuantity) : undefined,
        maxOrderQuantity: form.maxOrderQuantity ? Number(form.maxOrderQuantity) : undefined,
        tags: form.tags ? form.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        allergens: form.allergens
          ? form.allergens.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        certifications: form.certifications,
        fssaiLicense: form.fssaiLicenseNumber || undefined,
        isOrganic: form.isOrganic,
        isVegan: form.isVegan,
        isGlutenFree: form.isGlutenFree,
        countryOfOrigin: form.countryOfOrigin || undefined,
        ingredients: form.ingredients || undefined,
        shelfLife: form.shelfLife || undefined,
        bestBefore: (() => {
          if (!form.bestBefore) return undefined;
          const d = new Date(form.bestBefore);
          return Number.isNaN(d.getTime()) ? undefined : form.bestBefore;
        })(),
        category: form.category || undefined,
        subcategory: form.subcategory || undefined,
        images,
        videos,
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
        dimensions:
          form.length || form.width || form.height
            ? {
                length: form.length ? Number(form.length) : undefined,
                width: form.width ? Number(form.width) : undefined,
                height: form.height ? Number(form.height) : undefined,
                unit: form.dimensionUnit,
              }
            : undefined,
        returnPolicy: form.returnPolicy || undefined,
        warranty: form.warranty || undefined,
        metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined,
        videoUrl: form.videoUrl || undefined,
        isActive: form.isActive,
        isFeatured: form.isFeatured,
      };

      await axios.patch(`/api/products/${id}`, payload);
      toast.success("Product updated");
      router.push("/admin/products");
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err) ? err.response?.data?.message : "Failed to update";
      toast.error(msg ?? "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const selectClass = "w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672] bg-white";
  const textareaClass = "w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672] resize-none";
  const sectionClass = "bg-white rounded-2xl p-5 border border-neutral-100 space-y-4";
  const labelClass = "block text-sm font-medium text-neutral-700 mb-1.5";

  if (loading) {
    return (
      <div className="p-8 max-w-3xl space-y-4">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" rounded="xl" />
        <Skeleton className="h-64 w-full" rounded="xl" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors mb-6">
        <RiArrowLeftLine size={15} />
        Back to Products
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Edit Product</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        <div className={sectionClass}>
          <h2 className="font-semibold text-neutral-800 mb-4">Product Images & Videos</h2>
          <div className="flex flex-wrap gap-3 mb-3">
            {images.map((url, i) => (
              <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-neutral-200 group">

                <img src={normalizeImageUrl(url)} alt="" className="w-full h-full object-cover" />
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
            {videos.map((url, i) => (
              <div key={`v-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-neutral-200 group bg-black">
                <video src={url} className="w-full h-full object-cover" muted />
                <span className="absolute top-1 left-1 text-[9px] bg-black/70 text-white px-1 rounded">VIDEO</span>
                <button
                  type="button"
                  onClick={() => setVideos((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <RiDeleteBinLine className="text-white" size={16} />
                </button>
              </div>
            ))}
            <label className={`w-20 h-20 rounded-xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#E84672] transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
              <RiUploadLine size={18} className="text-neutral-400" />
              <span className="text-[10px] text-neutral-400 mt-1 text-center px-1">
                {uploading
                  ? stage === "compressing"
                    ? progress != null ? `Compressing ${progress}%` : "Compressing..."
                    : stage === "uploading"
                      ? progress != null ? `Uploading ${progress}%` : "Uploading..."
                      : "Working..."
                  : "Add media"}
              </span>
              <input type="file" accept="image/*,video/*" multiple className="sr-only" onChange={handleUpload} />
            </label>
          </div>
          <p className="text-xs text-neutral-400">Images max 10 MB, videos max 75 MB. First image is the main product image.</p>
        </div>

        
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
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value, subcategory: "" }))}
                className={selectClass}
              >
                {(() => {
                  const topCats = topLevelCategories(categories);
                  const storedName = categories.find((c) => c._id === form.category)?.name;
                  return (
                    <>
                      <option value="">No category</option>
                      {topCats.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                      {form.category && !topCats.some((c) => c._id === form.category) && (
                        <option value={form.category}>{storedName ?? form.category}</option>
                      )}
                    </>
                  );
                })()}
              </select>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-neutral-700">Subcategory</label>
                <button
                  type="button"
                  onClick={() => {
                    if (!form.category) { toast.error("Select a Category first"); return; }
                    setSubcategoryModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#E84672] hover:text-[#d13a64] transition-colors"
                >
                  <RiAddLine size={14} /> New
                </button>
              </div>
              <select
                value={form.subcategory}
                onChange={(e) => setForm((f) => ({ ...f, subcategory: e.target.value }))}
                className={selectClass}
                disabled={!form.category}
              >
                {(() => {
                  const options = descendantOptions(form.category, categories);
                  const legacyStored = form.subcategory && !options.some((o) => o.cat._id === form.subcategory);
                  return (
                    <>
                      <option value="">
                        {!form.category
                          ? "Select a category first"
                          : options.length === 0
                            ? "No subcategories — click New to add one"
                            : "No subcategory"}
                      </option>
                      {options.map(({ cat, depth }) => (
                        <option key={cat._id} value={cat._id}>{"— ".repeat(depth)}{cat.name}</option>
                      ))}
                      {legacyStored && (
                        <option value={form.subcategory}>
                          {categories.find((c) => c._id === form.subcategory)?.name ?? form.subcategory} (legacy)
                        </option>
                      )}
                    </>
                  );
                })()}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="SKU" value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
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
          <Input label="FSSAI License Number" value={form.fssaiLicenseNumber} onChange={(e) => setForm((f) => ({ ...f, fssaiLicenseNumber: e.target.value }))} />
          <div className="flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-700">
              <input type="checkbox" checked={form.isOrganic} onChange={(e) => setForm((f) => ({ ...f, isOrganic: e.target.checked }))} className="rounded accent-[#E84672]" />
              Organic
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-700">
              <input type="checkbox" checked={form.isVegan} onChange={(e) => setForm((f) => ({ ...f, isVegan: e.target.checked }))} className="rounded accent-[#E84672]" />
              Vegan
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm text-neutral-700">
              <input type="checkbox" checked={form.isGlutenFree} onChange={(e) => setForm((f) => ({ ...f, isGlutenFree: e.target.checked }))} className="rounded accent-[#E84672]" />
              Gluten Free
            </label>
          </div>
        </div>

        
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
          <div>
            <label className={labelClass}>Return Policy</label>
            <textarea
              value={form.returnPolicy}
              onChange={(e) => setForm((f) => ({ ...f, returnPolicy: e.target.value }))}
              rows={2}
              className={textareaClass}
              placeholder="Describe the return policy..."
            />
          </div>
          <Input label="Warranty" value={form.warranty} onChange={(e) => setForm((f) => ({ ...f, warranty: e.target.value }))} placeholder="e.g. 6 months" />
        </div>

        
        <div className={sectionClass}>
          <h2 className="font-semibold text-neutral-800">SEO & Media</h2>
          <Input label="Meta Title" value={form.metaTitle} onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))} placeholder="Page title for search engines" />
          <div>
            <label className={labelClass}>Meta Description</label>
            <textarea
              value={form.metaDescription}
              onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
              rows={2}
              className={textareaClass}
              placeholder="Brief description for search engines..."
            />
          </div>
          <Input label="Video URL" value={form.videoUrl} onChange={(e) => setForm((f) => ({ ...f, videoUrl: e.target.value }))} placeholder="https://youtube.com/..." />
        </div>

        
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
          <Button type="submit" isLoading={saving}>Save Changes</Button>
          <Link href="/admin/products"><Button variant="outline">Cancel</Button></Link>
        </div>
      </form>

      {subcategoryModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => !creatingSubcategory && setSubcategoryModalOpen(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-neutral-900">New Subcategory</h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Under <span className="font-semibold text-neutral-700">
                    {categories.find((c) => c._id === form.category)?.name ?? "—"}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => !creatingSubcategory && setSubcategoryModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 transition-colors"
                aria-label="Close"
              >
                <RiCloseLine size={20} />
              </button>
            </div>
            <label className="block text-sm font-medium text-neutral-700 mb-1.5">
              Subcategory Name
            </label>
            <input
              type="text"
              value={newSubcategoryName}
              onChange={(e) => setNewSubcategoryName(e.target.value)}
              placeholder="e.g. Cashews"
              autoFocus
              className={selectClass}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleCreateSubcategory(); }
              }}
            />
            <p className="text-xs text-neutral-400 mt-2">
              This will appear in the Subcategory dropdown for products under this category.
            </p>
            <div className="flex items-center justify-end gap-3 mt-5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSubcategoryModalOpen(false)}
                disabled={creatingSubcategory}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={handleCreateSubcategory}
                isLoading={creatingSubcategory}
                leftIcon={<RiAddLine />}
              >
                Create
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
