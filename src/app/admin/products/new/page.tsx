"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import {
  RiArrowLeftLine,
  RiUploadLine,
  RiDeleteBinLine,
  RiAddLine,
  RiArrowDownSLine,
  RiSearchLine,
  RiCheckLine,
  RiArrowRightLine,
  RiErrorWarningLine,
  RiCloseLine,
} from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import dynamic from "next/dynamic";
import axios from "axios";
import toast from "@/components/ui/toast";
import { useUpload } from "@/hooks/useUpload";
import { normalizeImageUrl } from "@/utils/helpers";
import hsnCodesData from "@/data/hsn-codes.json";
import skuCodesData from "@/data/sku-codes.json";

const RichTextEditor = dynamic(
  () => import("@/components/ui/RichTextEditor").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 rounded-xl border border-neutral-200 bg-neutral-50 animate-pulse" />
    ),
  },
);

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


const SKU_OPTIONS = (skuCodesData as Record<string, unknown>[]).filter(
  (s): s is Record<string, unknown> & { sku: string; product_name: string; category: string } =>
    "sku" in s && typeof s.sku === "string" && !!s.sku,
);


const HSN_OPTIONS = (hsnCodesData as Record<string, unknown>[]).filter(
  (h): h is Record<string, unknown> & { hsn: string; product_name: string; gst_pct: number } =>
    "hsn" in h && typeof h.hsn === "string" && !!h.hsn,
);

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
const CERTIFICATIONS = [
  "FSSAI", "Organic India", "ISO 22000", "HACCP", "GMP",
  "Halal", "Kosher", "USDA Organic", "India Organic", "Non-GMO",
];

const STEPS = [
  { id: 1, title: "Basic Info", desc: "Product details & images" },
  { id: 2, title: "Pricing & Inventory", desc: "Price, stock & tax" },
  { id: 3, title: "Details & Nutrition", desc: "Ingredients, dietary & nutrition" },
  { id: 4, title: "Shipping & SEO", desc: "Dimensions, policies & visibility" },
] as const;

interface ProductFormValues {
  name: string; description: string; shortDescription: string;
  category: string; subcategory: string; sku: string; barcode: string;
  productType: string; brand: string; manufacturer: string; tags: string;
  price: string; compareAtPrice: string; costPrice: string;
  pricePerKg: string; pricePerGram: string; pricePerUnit: string;
  gstRate: string; hsnCode: string;
  stock: string; lowStockThreshold: string; unit: string;
  weight: string; shippingWeight: string;
  minOrderQuantity: string; maxOrderQuantity: string;
  countryOfOrigin: string; ingredients: string; shelfLife: string;
  bestBefore: string; allergens: string; certifications: string[];
  fssaiLicenseNumber: string;
  isOrganic: boolean; isVegan: boolean; isGlutenFree: boolean;
  servingSize: string; calories: string; totalFat: string;
  saturatedFat: string; transFat: string; cholesterol: string;
  sodium: string; totalCarbs: string; dietaryFiber: string;
  sugars: string; protein: string;
  length: string; width: string; height: string; dimensionUnit: string;
  returnPolicy: string; warranty: string;
  metaTitle: string; metaDescription: string; videoUrl: string;
  isActive: boolean; isFeatured: boolean;
}

const DEFAULTS: ProductFormValues = {
  name: "", description: "", shortDescription: "",
  category: "", subcategory: "", sku: "", barcode: "",
  productType: "", brand: "", manufacturer: "", tags: "",
  price: "", compareAtPrice: "", costPrice: "",
  pricePerKg: "", pricePerGram: "", pricePerUnit: "",
  gstRate: "0", hsnCode: "",
  stock: "", lowStockThreshold: "", unit: "g",
  weight: "", shippingWeight: "",
  minOrderQuantity: "", maxOrderQuantity: "",
  countryOfOrigin: "India", ingredients: "", shelfLife: "",
  bestBefore: "", allergens: "", certifications: [],
  fssaiLicenseNumber: "",
  isOrganic: false, isVegan: false, isGlutenFree: false,
  servingSize: "", calories: "", totalFat: "",
  saturatedFat: "", transFat: "", cholesterol: "",
  sodium: "", totalCarbs: "", dietaryFiber: "",
  sugars: "", protein: "",
  length: "", width: "", height: "", dimensionUnit: "cm",
  returnPolicy: "", warranty: "",
  metaTitle: "", metaDescription: "", videoUrl: "",
  isActive: true, isFeatured: false,
};

export default function NewProductPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [videos, setVideos] = useState<string[]>([]);
  const { upload, uploading, stage, progress } = useUpload({ target: "products" });
  const [saving, setSaving] = useState(false);
  const [bulkPricing, setBulkPricing] = useState<BulkPriceRow[]>([]);
  const [nutritionOpen, setNutritionOpen] = useState(false);
  const [hsnSearch, setHsnSearch] = useState("");
  const [hsnDropdownOpen, setHsnDropdownOpen] = useState(false);
  const [skuSearch, setSkuSearch] = useState("");
  const [skuDropdownOpen, setSkuDropdownOpen] = useState(false);

  const [formIssues, setFormIssues] = useState<{ field: string; step: number; message: string }[]>([]);

  const filteredHsnCodes = hsnSearch.length >= 2
    ? HSN_OPTIONS.filter((h) => h.hsn.includes(hsnSearch) || h.product_name.toLowerCase().includes(hsnSearch.toLowerCase())).slice(0, 10)
    : [];

  const filteredSkuCodes = skuSearch.length >= 2
    ? SKU_OPTIONS.filter((s) => s.sku.toLowerCase().includes(skuSearch.toLowerCase()) || s.product_name.toLowerCase().includes(skuSearch.toLowerCase()) || s.category.toLowerCase().includes(skuSearch.toLowerCase())).slice(0, 10)
    : [];

  const { register, handleSubmit, control, watch, setValue, trigger, formState: { errors } } = useForm<ProductFormValues>({ defaultValues: DEFAULTS, mode: "onChange" });
  const w = watch();

  useEffect(() => { axios.get<{ data: Category[] }>("/api/categories?flat=true").then((r: { data: { data: Category[] } }) => setCategories(r.data.data)).catch(() => null); }, []);

  const [subcategoryModalOpen, setSubcategoryModalOpen] = useState(false);
  const [newSubcategoryName, setNewSubcategoryName] = useState("");
  const [creatingSubcategory, setCreatingSubcategory] = useState(false);

  const topCategories: Category[] = topLevelCategories(categories);
  const selectedCategory: Category | undefined = categories.find((c: Category) => c._id === w.category);
  const subcategoryOptions = descendantOptions(w.category, categories);

  const handleCreateSubcategory = async () => {
    if (!w.category) { toast.error("Please select a Category first"); return; }
    const trimmed = newSubcategoryName.trim();
    if (trimmed.length < 2) { toast.error("Subcategory name must be at least 2 characters"); return; }
    setCreatingSubcategory(true);
    try {
      const res = await axios.post<{ data: Category }>("/api/admin/categories", {
        name: trimmed,
        parent: w.category,
        isActive: true,
      });
      const created = res.data.data;
      setCategories((prev: Category[]) => [...prev, created]);
      setValue("subcategory", created._id);
      setNewSubcategoryName("");
      setSubcategoryModalOpen(false);
      toast.success("Subcategory created");
    } catch (err: unknown) {
      toast.error(axios.isAxiosError(err) ? (err.response?.data?.message ?? "Failed to create subcategory") : "Failed to create subcategory");
    } finally {
      setCreatingSubcategory(false);
    }
  };

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
    setValue("pricePerKg", value);
    setValue("pricePerGram", !isNaN(kg) && kg > 0 ? (kg / 1000).toFixed(2) : "");
  };
  const handlePricePerGramChange = (value: string) => {
    const g = parseFloat(value);
    setValue("pricePerGram", value);
    setValue("pricePerKg", !isNaN(g) && g > 0 ? (g * 1000).toFixed(2) : "");
  };

  const addBulkPriceRow = () => setBulkPricing((p) => [...p, { minQty: "", maxQty: "", price: "", unit: "g" }]);
  const removeBulkPriceRow = (i: number) => setBulkPricing((p) => p.filter((_, idx) => idx !== i));
  const updateBulkPriceRow = (i: number, f: keyof BulkPriceRow, v: string) => setBulkPricing((p) => p.map((r, idx) => (idx === i ? { ...r, [f]: v } : r)));

  const toggleCertification = (cert: string) => {
    const cur = w.certifications;
    setValue("certifications", cur.includes(cert) ? cur.filter((c) => c !== cert) : [...cur, cert]);
  };

  const validateStep = async (s: number): Promise<boolean> => {
    if (s === 1) return trigger(["name"]);
    if (s === 2) return trigger(["price", "stock"]);
    return true;
  };

  const goNext = async () => { if (!(await validateStep(step))) { toast.error("Please fill all required fields"); return; } setStep((s) => Math.min(s + 1, 4)); };
  const goPrev = () => setStep((s) => Math.max(s - 1, 1));

  const collectIssues = (data: ProductFormValues): { field: string; step: number; message: string }[] => {
    const issues: { field: string; step: number; message: string }[] = [];
    if (!data.name || data.name.trim().length < 2) {
      issues.push({ field: "name", step: 1, message: "Product Name is missing. Go to Step 1 → Basic Information and enter a name (at least 2 characters)." });
    }
    if (!images || images.length === 0) {
      issues.push({ field: "images", step: 1, message: "Product Images are missing. Go to Step 1 → Product Images and upload at least 1 photo. The first photo becomes the main image." });
    }
    if (!data.description || data.description.replace(/<[^>]*>/g, "").trim().length < 10) {
      issues.push({ field: "description", step: 1, message: "Description is too short. Go to Step 1 → Description and write at least 10 characters describing the product." });
    }
    if (!data.category) {
      issues.push({ field: "category", step: 1, message: "Category is not selected. Go to Step 1 → Category and pick one from the dropdown." });
    }
    if (!data.sku || data.sku.trim().length === 0) {
      issues.push({ field: "sku", step: 1, message: "SKU is missing. Go to Step 1 → SKU and enter a unique product code (you can search the suggestions or type your own)." });
    }
    const priceNum = Number(data.price);
    if (!data.price || isNaN(priceNum) || priceNum <= 0) {
      issues.push({ field: "price", step: 2, message: "Price is missing or invalid. Go to Step 2 → Pricing and enter a selling price greater than 0." });
    }
    const stockNum = Number(data.stock);
    if (data.stock === "" || isNaN(stockNum) || stockNum < 0) {
      issues.push({ field: "stock", step: 2, message: "Stock quantity is missing. Go to Step 2 → Inventory and enter how many units you have (0 or more)." });
    }
    return issues;
  };

  const mapServerErrorToIssue = (message: string): { field: string; step: number; message: string } => {
    const m = message.toLowerCase();
    if (m.includes("name")) return { field: "name", step: 1, message: "Product Name — " + message + ". Go to Step 1 → Basic Information to fix this." };
    if (m.includes("description")) return { field: "description", step: 1, message: "Description — " + message + ". Go to Step 1 → Description to fix this." };
    if (m.includes("category")) return { field: "category", step: 1, message: "Category — " + message + ". Go to Step 1 → Category to fix this." };
    if (m.includes("sku")) return { field: "sku", step: 1, message: "SKU — " + message + ". Go to Step 1 → SKU to fix this." };
    if (m.includes("image")) return { field: "images", step: 1, message: "Images — " + message + ". Go to Step 1 → Product Images to fix this." };
    if (m.includes("price")) return { field: "price", step: 2, message: "Price — " + message + ". Go to Step 2 → Pricing to fix this." };
    if (m.includes("stock")) return { field: "stock", step: 2, message: "Stock — " + message + ". Go to Step 2 → Inventory to fix this." };
    return { field: "general", step: 1, message: message };
  };

  const onSubmit = async (data: ProductFormValues) => {
    const issues = collectIssues(data);
    if (issues.length > 0) {
      setFormIssues(issues);
      setStep(issues[0].step);
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.error(`${issues.length} field${issues.length > 1 ? "s need" : " needs"} attention`);
      return;
    }
    setFormIssues([]);
    setSaving(true);
    try {
      await axios.post("/api/products", {
        name: data.name, description: data.description,
        shortDescription: data.shortDescription || undefined,
        price: Number(data.price),
        compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : undefined,
        costPrice: data.costPrice ? Number(data.costPrice) : undefined,
        pricePerKg: data.pricePerKg ? Number(data.pricePerKg) : undefined,
        pricePerGram: data.pricePerGram ? Number(data.pricePerGram) : undefined,
        pricePerUnit: data.pricePerUnit ? Number(data.pricePerUnit) : undefined,
        gstRate: Number(data.gstRate), hsn: data.hsnCode || undefined,
        stock: Number(data.stock),
        lowStockThreshold: data.lowStockThreshold ? Number(data.lowStockThreshold) : undefined,
        weight: data.weight ? Number(data.weight) : undefined,
        shippingWeight: data.shippingWeight ? Number(data.shippingWeight) : undefined,
        minOrderQuantity: data.minOrderQuantity ? Number(data.minOrderQuantity) : undefined,
        maxOrderQuantity: data.maxOrderQuantity ? Number(data.maxOrderQuantity) : undefined,
        tags: data.tags ? data.tags.split(",").map((t) => t.trim()).filter(Boolean) : [],
        allergens: data.allergens ? data.allergens.split(",").map((t) => t.trim()).filter(Boolean) : [],
        category: data.category || undefined, subcategory: data.subcategory || undefined,
        sku: data.sku || undefined, barcode: data.barcode || undefined,
        unit: data.unit, productType: data.productType || undefined,
        brand: data.brand || undefined, manufacturer: data.manufacturer || undefined,
        countryOfOrigin: data.countryOfOrigin || undefined,
        ingredients: data.ingredients || undefined,
        shelfLife: data.shelfLife || undefined, bestBefore: data.bestBefore || undefined,
        certifications: data.certifications.length > 0 ? data.certifications : undefined,
        fssaiLicense: data.fssaiLicenseNumber || undefined,
        isOrganic: data.isOrganic, isVegan: data.isVegan, isGlutenFree: data.isGlutenFree,
        isActive: data.isActive, isFeatured: data.isFeatured, images, videos,
        bulkPricing: bulkPricing.filter((r) => r.minQty && r.price).map((r) => ({ minQty: Number(r.minQty), maxQty: r.maxQty ? Number(r.maxQty) : undefined, price: Number(r.price), unit: r.unit })),
        nutritionInfo: {
          servingSize: data.servingSize || undefined,
          calories: data.calories ? Number(data.calories) : undefined,
          totalFat: data.totalFat ? Number(data.totalFat) : undefined,
          saturatedFat: data.saturatedFat ? Number(data.saturatedFat) : undefined,
          transFat: data.transFat ? Number(data.transFat) : undefined,
          cholesterol: data.cholesterol ? Number(data.cholesterol) : undefined,
          sodium: data.sodium ? Number(data.sodium) : undefined,
          totalCarbs: data.totalCarbs ? Number(data.totalCarbs) : undefined,
          dietaryFiber: data.dietaryFiber ? Number(data.dietaryFiber) : undefined,
          sugars: data.sugars ? Number(data.sugars) : undefined,
          protein: data.protein ? Number(data.protein) : undefined,
        },
        dimensions: { length: data.length ? Number(data.length) : undefined, width: data.width ? Number(data.width) : undefined, height: data.height ? Number(data.height) : undefined, unit: data.dimensionUnit },
        returnPolicy: data.returnPolicy || undefined, warranty: data.warranty || undefined,
        metaTitle: data.metaTitle || undefined, metaDescription: data.metaDescription || undefined,
        videoUrl: data.videoUrl || undefined,
      });
      toast.success("Product created");
      router.push("/admin/products");
    } catch (err: unknown) {
      const serverIssues: { field: string; step: number; message: string }[] = [];
      let headline = "Failed to create product";
      if (axios.isAxiosError(err)) {
        const data = err.response?.data;
        headline = data?.message ?? headline;
        const fieldErrors = data?.errors as Record<string, string[]> | undefined;
        if (fieldErrors && typeof fieldErrors === "object") {
          for (const [fld, msgs] of Object.entries(fieldErrors)) {
            if (Array.isArray(msgs)) {
              for (const m of msgs) {
                serverIssues.push(mapServerErrorToIssue(`${fld}: ${m}`));
              }
            }
          }
        }
        if (serverIssues.length === 0 && headline) {
          serverIssues.push(mapServerErrorToIssue(headline));
        }
      } else {
        serverIssues.push({ field: "general", step: 1, message: "Something went wrong while saving. Please check your internet connection and try again." });
      }
      setFormIssues(serverIssues);
      if (serverIssues[0]) setStep(serverIssues[0].step);
      window.scrollTo({ top: 0, behavior: "smooth" });
      toast.error(headline);
    } finally { setSaving(false); }
  };

  const sel = "w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672] bg-white";
  const ta = "w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672] resize-none";
  const sec = "bg-white rounded-2xl p-5 border border-neutral-100 space-y-4";
  const lbl = "block text-sm font-medium text-neutral-700 mb-1.5";

  return (
    <div className="p-8 max-w-4xl">
      <Link href="/admin/products" className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors mb-6">
        <RiArrowLeftLine size={15} /> Back to Products
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">Add New Product</h1>

      {formIssues.length > 0 && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5" role="alert">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
              <RiErrorWarningLine className="text-red-600" size={18} />
            </div>
            <div className="flex-1">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-red-800">
                    We couldn&apos;t save the product yet
                  </h3>
                  <p className="mt-0.5 text-xs text-red-700">
                    Please fix the {formIssues.length === 1 ? "item" : `${formIssues.length} items`} below, then click <span className="font-semibold">Create Product</span> again.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormIssues([])}
                  className="text-red-400 hover:text-red-600 transition-colors"
                  aria-label="Dismiss"
                >
                  <RiCloseLine size={18} />
                </button>
              </div>
              <ul className="mt-3 space-y-2">
                {formIssues.map((iss, idx) => (
                  <li key={idx} className="flex items-start gap-2 rounded-xl bg-white/70 p-3 text-xs text-red-800 border border-red-100">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <div className="flex-1">
                      <p className="leading-relaxed">{iss.message}</p>
                      <button
                        type="button"
                        onClick={() => { setStep(iss.step); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                        className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-red-600 hover:text-red-800 underline underline-offset-2"
                      >
                        Take me to Step {iss.step}
                        <RiArrowRightLine size={12} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}


      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s) => (
          <button key={s.id} type="button" onClick={() => s.id < step && setStep(s.id)}
            className={`flex-1 flex items-center gap-3 p-3 rounded-xl border-2 transition-all ${step === s.id ? "border-[#E84672] bg-[#FFF1F3]" : s.id < step ? "border-green-300 bg-green-50 cursor-pointer" : "border-neutral-100 bg-white"}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${step === s.id ? "bg-[#E84672] text-white" : s.id < step ? "bg-green-500 text-white" : "bg-neutral-100 text-neutral-400"}`}>
              {s.id < step ? <RiCheckLine size={16} /> : s.id}
            </div>
            <div className="text-left hidden sm:block">
              <p className={`text-sm font-semibold ${step === s.id ? "text-[#E84672]" : s.id < step ? "text-green-700" : "text-neutral-400"}`}>{s.title}</p>
              <p className="text-xs text-neutral-400">{s.desc}</p>
            </div>
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        
        {step === 1 && (<>
          <div className={sec}>
            <h2 className="font-semibold text-neutral-800 mb-4">Product Images & Videos</h2>
            <div className="flex flex-wrap gap-3 mb-3">
              {images.map((url, i) => (
                <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-neutral-200 group">

                  <img src={normalizeImageUrl(url)} alt="" className="w-full h-full object-cover" />
                  <button type="button" onClick={() => setImages((p) => p.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <RiDeleteBinLine className="text-white" size={16} />
                  </button>
                  {i === 0 && <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">Main</span>}
                </div>
              ))}
              {videos.map((url, i) => (
                <div key={`v-${i}`} className="relative w-20 h-20 rounded-xl overflow-hidden border border-neutral-200 group bg-black">
                  <video src={url} className="w-full h-full object-cover" muted />
                  <span className="absolute top-1 left-1 text-[9px] bg-black/70 text-white px-1 rounded">VIDEO</span>
                  <button type="button" onClick={() => setVideos((p) => p.filter((_, idx) => idx !== i))} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
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

          <div className={sec}>
            <h2 className="font-semibold text-neutral-800">Basic Information</h2>
            <Input label="Product Name *" {...register("name", { required: "Product name is required" })} error={errors.name?.message} />
            <Controller name="description" control={control} render={({ field }) => (
              <RichTextEditor label="Description" value={field.value} onChange={field.onChange} placeholder="Describe the product..." />
            )} />
            <div>
              <label className={lbl}>Short Description</label>
              <textarea {...register("shortDescription")} rows={2} maxLength={500} className={ta} placeholder="Brief summary (max 500 characters)" />
              <p className="text-xs text-neutral-400 mt-1">{w.shortDescription.length}/500</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>Category</label>
                <select {...register("category", { onChange: () => setValue("subcategory", "") })} className={sel}>
                  <option value="">No category</option>
                  {topCategories.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                  {w.category && !topCategories.some((c) => c._id === w.category) && (
                    <option value={w.category}>{selectedCategory?.name ?? w.category}</option>
                  )}
                </select>
              </div>
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-neutral-700">Subcategory</label>
                  <button
                    type="button"
                    onClick={() => {
                      if (!w.category) { toast.error("Select a Category first"); return; }
                      setSubcategoryModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#E84672] hover:text-[#d13a64] transition-colors"
                  >
                    <RiAddLine size={14} /> New
                  </button>
                </div>
                <select
                  {...register("subcategory")}
                  className={sel}
                  disabled={!w.category}
                >
                  <option value="">
                    {!w.category
                      ? "Select a category first"
                      : subcategoryOptions.length === 0
                        ? "No subcategories — click New to add one"
                        : "No subcategory"}
                  </option>
                  {subcategoryOptions.map(({ cat, depth }) => (
                    <option key={cat._id} value={cat._id}>{"— ".repeat(depth)}{cat.name}</option>
                  ))}
                  {w.subcategory && !subcategoryOptions.some((o) => o.cat._id === w.subcategory) && (
                    <option value={w.subcategory}>
                      {categories.find((c) => c._id === w.subcategory)?.name ?? w.subcategory} (legacy)
                    </option>
                  )}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <label className={lbl}>SKU</label>
                <div className="relative">
                  <input value={w.sku} onChange={(e) => { setValue("sku", e.target.value); setSkuSearch(e.target.value); setSkuDropdownOpen(true); }}
                    onFocus={() => { if (w.sku.length >= 2) setSkuDropdownOpen(true); }}
                    onBlur={() => setTimeout(() => setSkuDropdownOpen(false), 200)}
                    placeholder="Search or type SKU..." className={sel} />
                  <RiSearchLine size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                </div>
                {skuDropdownOpen && filteredSkuCodes.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
                    {filteredSkuCodes.map((s) => (
                      <button key={s.sku} type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50 transition-colors"
                        onMouseDown={() => { setValue("sku", s.sku); setSkuDropdownOpen(false); setSkuSearch(""); }}>
                        <span className="font-mono font-semibold text-[#E84672] shrink-0 text-xs">{s.sku}</span>
                        <span className="text-neutral-600 truncate">{s.product_name}</span>
                        <span className="ml-auto shrink-0 text-xs text-neutral-400">{s.category}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <Input label="Barcode" {...register("barcode")} placeholder="EAN / UPC" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>Product Type</label>
                <select {...register("productType")} className={sel}><option value="">Select type</option>{PRODUCT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select>
              </div>
              <Input label="Brand" {...register("brand")} />
            </div>
            <Input label="Manufacturer" {...register("manufacturer")} />
            <Input label="Tags (comma-separated)" {...register("tags")} placeholder="spice, organic, premium" />
          </div>
        </>)}

        
        {step === 2 && (<>
          <div className={sec}>
            <h2 className="font-semibold text-neutral-800">Pricing</h2>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Price (*) *" type="number" min="0" step="0.01" {...register("price", { required: "Price is required" })} error={errors.price?.message} />
              <Input label="Compare At Price" type="number" min="0" step="0.01" {...register("compareAtPrice")} placeholder="MRP" />
              <Input label="Cost Price" type="number" min="0" step="0.01" {...register("costPrice")} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Price Per KG" type="number" min="0" step="0.01" value={w.pricePerKg} onChange={(e) => handlePricePerKgChange(e.target.value)} />
              <Input label="Price Per Gram" type="number" min="0" step="0.0001" value={w.pricePerGram} onChange={(e) => handlePricePerGramChange(e.target.value)} />
              <Input label="Price Per Unit" type="number" min="0" step="0.01" {...register("pricePerUnit")} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>GST Rate</label>
                <select {...register("gstRate")} className={sel}>{GST_RATES.map((r) => <option key={r} value={r}>{r}%</option>)}</select>
              </div>
              <div className="relative">
                <label className={lbl}>HSN Code</label>
                <div className="relative">
                  <input value={w.hsnCode} onChange={(e) => { setValue("hsnCode", e.target.value); setHsnSearch(e.target.value); setHsnDropdownOpen(true); }}
                    onFocus={() => { if (w.hsnCode.length >= 2) setHsnDropdownOpen(true); }}
                    onBlur={() => setTimeout(() => setHsnDropdownOpen(false), 200)}
                    placeholder="Search HSN code or description..." className={sel} />
                  <RiSearchLine size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                </div>
                {hsnDropdownOpen && filteredHsnCodes.length > 0 && (
                  <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
                    {filteredHsnCodes.map((h) => (
                      <button key={h.hsn} type="button" className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50 transition-colors"
                        onMouseDown={() => { setValue("hsnCode", h.hsn); setValue("gstRate", String(h.gst_pct)); setHsnDropdownOpen(false); setHsnSearch(""); }}>
                        <span className="font-mono font-semibold text-[#E84672] shrink-0">{h.hsn}</span>
                        <span className="text-neutral-600 truncate">{h.product_name}</span>
                        <span className="ml-auto shrink-0 text-xs text-neutral-400">{h.gst_pct}% GST</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={sec}>
            <h2 className="font-semibold text-neutral-800">Inventory</h2>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Stock *" type="number" min="0" {...register("stock", { required: "Stock is required" })} error={errors.stock?.message} />
              <Input label="Low Stock Threshold" type="number" min="0" {...register("lowStockThreshold")} placeholder="Alert when below" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className={lbl}>Unit</label>
                <select {...register("unit")} className={sel}>{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select>
              </div>
              <Input label="Weight (grams)" type="number" min="0" {...register("weight")} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Shipping Weight (g)" type="number" min="0" {...register("shippingWeight")} />
              <Input label="Min Order Qty" type="number" min="1" {...register("minOrderQuantity")} />
              <Input label="Max Order Qty" type="number" min="1" {...register("maxOrderQuantity")} />
            </div>
          </div>

          <div className={sec}>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-neutral-800">Bulk Pricing</h2>
              <button type="button" onClick={addBulkPriceRow} className="inline-flex items-center gap-1 text-sm text-[#E84672] hover:text-[#d13a64] font-medium transition-colors"><RiAddLine size={16} /> Add Tier</button>
            </div>
            {bulkPricing.length === 0 && <p className="text-sm text-neutral-400">No bulk pricing tiers. Click &quot;Add Tier&quot; to create one.</p>}
            {bulkPricing.map((row, i) => (
              <div key={i} className="grid grid-cols-[1fr_1fr_1fr_80px_32px] gap-2 items-end">
                <Input label={i === 0 ? "Min Qty" : undefined} type="number" min="1" value={row.minQty} onChange={(e) => updateBulkPriceRow(i, "minQty", e.target.value)} placeholder="Min" />
                <Input label={i === 0 ? "Max Qty" : undefined} type="number" min="1" value={row.maxQty} onChange={(e) => updateBulkPriceRow(i, "maxQty", e.target.value)} placeholder="Max" />
                <Input label={i === 0 ? "Price" : undefined} type="number" min="0" step="0.01" value={row.price} onChange={(e) => updateBulkPriceRow(i, "price", e.target.value)} placeholder="Price" />
                <div>{i === 0 && <label className={lbl}>Unit</label>}
                  <select value={row.unit} onChange={(e) => updateBulkPriceRow(i, "unit", e.target.value)} className={sel}>{UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select>
                </div>
                <button type="button" onClick={() => removeBulkPriceRow(i)} className="h-10.5 flex items-center justify-center text-neutral-400 hover:text-red-500"><RiDeleteBinLine size={16} /></button>
              </div>
            ))}
          </div>
        </>)}

        
        {step === 3 && (<>
          <div className={sec}>
            <h2 className="font-semibold text-neutral-800">Product Details</h2>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Country of Origin" {...register("countryOfOrigin")} />
              <Input label="Shelf Life" {...register("shelfLife")} placeholder="e.g. 12 months" />
              <Input label="Best Before" type="date" {...register("bestBefore")} />
            </div>
            <div><label className={lbl}>Ingredients</label>
              <textarea {...register("ingredients")} rows={3} className={ta} placeholder="List all ingredients..." />
            </div>
            <Input label="Allergens (comma-separated)" {...register("allergens")} placeholder="e.g. Nuts, Gluten, Dairy" />
          </div>

          <div className={sec}>
            <h2 className="font-semibold text-neutral-800">Certifications & Dietary</h2>
            <div><label className={lbl}>Certifications</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {CERTIFICATIONS.map((cert) => (
                  <label key={cert} className="flex items-center gap-1.5 text-sm cursor-pointer bg-neutral-50 rounded-lg px-3 py-1.5 border border-neutral-200 hover:border-[#E84672] transition-colors">
                    <input type="checkbox" checked={w.certifications.includes(cert)} onChange={() => toggleCertification(cert)} className="rounded accent-[#E84672]" />{cert}
                  </label>
                ))}
              </div>
            </div>
            <Input label="FSSAI License Number" {...register("fssaiLicenseNumber")} placeholder="e.g. 10012345678901" />
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" {...register("isOrganic")} className="rounded accent-[#E84672]" /><span className="text-sm text-neutral-700">Is Organic</span></label>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" {...register("isVegan")} className="rounded accent-[#E84672]" /><span className="text-sm text-neutral-700">Is Vegan</span></label>
              <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" {...register("isGlutenFree")} className="rounded accent-[#E84672]" /><span className="text-sm text-neutral-700">Is Gluten Free</span></label>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-neutral-100">
            <button type="button" onClick={() => setNutritionOpen((o) => !o)} className="w-full flex items-center justify-between p-5">
              <h2 className="font-semibold text-neutral-800">Nutrition Info</h2>
              <RiArrowDownSLine size={20} className={`text-neutral-400 transition-transform ${nutritionOpen ? "rotate-180" : ""}`} />
            </button>
            {nutritionOpen && (
              <div className="px-5 pb-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Serving Size" {...register("servingSize")} placeholder="e.g. 100g" />
                  <Input label="Calories" type="number" min="0" {...register("calories")} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input label="Total Fat (g)" type="number" min="0" step="0.1" {...register("totalFat")} />
                  <Input label="Saturated Fat (g)" type="number" min="0" step="0.1" {...register("saturatedFat")} />
                  <Input label="Trans Fat (g)" type="number" min="0" step="0.1" {...register("transFat")} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Cholesterol (mg)" type="number" min="0" {...register("cholesterol")} />
                  <Input label="Sodium (mg)" type="number" min="0" {...register("sodium")} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <Input label="Total Carbs (g)" type="number" min="0" step="0.1" {...register("totalCarbs")} />
                  <Input label="Dietary Fiber (g)" type="number" min="0" step="0.1" {...register("dietaryFiber")} />
                  <Input label="Sugars (g)" type="number" min="0" step="0.1" {...register("sugars")} />
                </div>
                <Input label="Protein (g)" type="number" min="0" step="0.1" {...register("protein")} />
              </div>
            )}
          </div>
        </>)}

        
        {step === 4 && (<>
          <div className={sec}>
            <h2 className="font-semibold text-neutral-800">Dimensions & Shipping</h2>
            <div className="grid grid-cols-4 gap-4">
              <Input label="Length" type="number" min="0" step="0.1" {...register("length")} />
              <Input label="Width" type="number" min="0" step="0.1" {...register("width")} />
              <Input label="Height" type="number" min="0" step="0.1" {...register("height")} />
              <div><label className={lbl}>Unit</label><select {...register("dimensionUnit")} className={sel}>{DIMENSION_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}</select></div>
            </div>
            <Input label="Shipping Weight (grams)" type="number" min="0" {...register("shippingWeight")} placeholder="With packaging" />
          </div>
          <div className={sec}>
            <h2 className="font-semibold text-neutral-800">Media</h2>
            <Input label="Video URL" {...register("videoUrl")} placeholder="https://youtube.com/..." />
            <p className="text-xs text-neutral-400">Images are managed in Step 1.</p>
          </div>
          <div className={sec}>
            <h2 className="font-semibold text-neutral-800">SEO</h2>
            <div><Input label="Meta Title" {...register("metaTitle")} placeholder="Page title for search engines" /><p className="text-xs text-neutral-400 mt-1">{w.metaTitle.length}/70 characters</p></div>
            <div><label className={lbl}>Meta Description</label><textarea {...register("metaDescription")} rows={2} className={ta} placeholder="Brief description for search results..." /><p className="text-xs text-neutral-400 mt-1">{w.metaDescription.length}/160 characters</p></div>
          </div>
          <div className={sec}>
            <h2 className="font-semibold text-neutral-800">Policies</h2>
            <div><label className={lbl}>Return Policy</label><textarea {...register("returnPolicy")} rows={3} className={ta} placeholder="Describe return policy for this product..." /></div>
            <Input label="Warranty" {...register("warranty")} placeholder="e.g. No warranty / 6 months" />
          </div>
          <div className="bg-white rounded-2xl p-5 border border-neutral-100 space-y-3">
            <h2 className="font-semibold text-neutral-800">Visibility</h2>
            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" {...register("isActive")} className="rounded accent-[#E84672]" /><span className="text-sm text-neutral-700">Active (visible to customers)</span></label>
            <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" {...register("isFeatured")} className="rounded accent-[#E84672]" /><span className="text-sm text-neutral-700">Featured (shown on homepage)</span></label>
          </div>
        </>)}

        
        <div className="flex items-center justify-between pt-2">
          <div>{step > 1 && <Button type="button" variant="outline" onClick={goPrev} leftIcon={<RiArrowLeftLine />}>Previous</Button>}</div>
          <div className="flex gap-3">
            <Link href="/admin/products"><Button type="button" variant="outline">Cancel</Button></Link>
            {step < 4
              ? <Button type="button" onClick={goNext} rightIcon={<RiArrowRightLine />}>Next</Button>
              : <Button type="submit" isLoading={saving} leftIcon={<RiCheckLine />}>Create Product</Button>}
          </div>
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
                  Under <span className="font-semibold text-neutral-700">{selectedCategory?.name ?? "—"}</span>
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
              className={sel}
              onKeyDown={(e) => {
                if (e.key === "Enter") { e.preventDefault(); handleCreateSubcategory(); }
              }}
            />
            <p className="text-xs text-neutral-400 mt-2">
              This will appear in the Subcategory dropdown for products under {selectedCategory?.name ?? "this category"}.
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
