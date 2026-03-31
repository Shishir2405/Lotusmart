"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import dynamic from "next/dynamic";
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
} from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import axios from "axios";
import toast from "react-hot-toast";
import hsnCodesData from "@/data/hsn-codes.json";
import skuCodesData from "@/data/sku-codes.json";

const RichTextEditor = dynamic(
  () => import("@/components/ui/RichTextEditor").then((m) => m.default),
  {
    ssr: false,
    loading: () => (
      <div className="h-40 rounded-xl border border-neutral-200 bg-neutral-50 animate-pulse" />
    ),
  }
);

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

interface ProductFormValues {
  // Step 1: Basic Information
  name: string;
  description: string;
  shortDescription: string;
  category: string;
  subcategory: string;
  sku: string;
  skuPrefix: string;
  barcode: string;
  productType: string;
  brand: string;
  manufacturer: string;
  tags: string;
  // Step 2: Pricing & Inventory
  price: string;
  compareAtPrice: string;
  costPrice: string;
  pricePerKg: string;
  pricePerGram: string;
  pricePerUnit: string;
  gstRate: string;
  hsnCode: string;
  stock: string;
  lowStockThreshold: string;
  unit: string;
  weight: string;
  shippingWeight: string;
  minOrderQuantity: string;
  maxOrderQuantity: string;
  // Step 3: Product Details
  countryOfOrigin: string;
  ingredients: string;
  shelfLife: string;
  bestBefore: string;
  allergens: string;
  certifications: string[];
  fssaiLicenseNumber: string;
  isOrganic: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  // Nutrition
  servingSize: string;
  calories: string;
  totalFat: string;
  saturatedFat: string;
  transFat: string;
  cholesterol: string;
  sodium: string;
  totalCarbs: string;
  dietaryFiber: string;
  sugars: string;
  protein: string;
  // Step 4: Shipping, SEO & Visibility
  length: string;
  width: string;
  height: string;
  dimensionUnit: string;
  returnPolicy: string;
  warranty: string;
  metaTitle: string;
  metaDescription: string;
  videoUrl: string;
  isActive: boolean;
  isFeatured: boolean;
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
const CERTIFICATIONS = [
  "FSSAI",
  "Organic India",
  "ISO 22000",
  "HACCP",
  "GMP",
  "Halal",
  "Kosher",
  "USDA Organic",
  "India Organic",
  "Non-GMO",
];

const STEPS = [
  { id: 1, label: "Basic Info" },
  { id: 2, label: "Pricing & Inventory" },
  { id: 3, label: "Details & Nutrition" },
  { id: 4, label: "Shipping, SEO & Visibility" },
];

export default function NewProductPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [bulkPricing, setBulkPricing] = useState<BulkPriceRow[]>([]);
  const [nutritionOpen, setNutritionOpen] = useState(false);
  const [hsnSearch, setHsnSearch] = useState("");
  const [hsnDropdownOpen, setHsnDropdownOpen] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<ProductFormValues>({
    defaultValues: {
      name: "",
      description: "",
      shortDescription: "",
      category: "",
      subcategory: "",
      sku: "",
      skuPrefix: "",
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
      certifications: [],
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
    },
  });

  const watchHsnCode = watch("hsnCode");
  const watchPricePerKg = watch("pricePerKg");
  const watchPricePerGram = watch("pricePerGram");

  const filteredHsnCodes =
    hsnSearch.length >= 2
      ? hsnCodesData
          .filter(
            (h) =>
              h.code.includes(hsnSearch) ||
              h.description.toLowerCase().includes(hsnSearch.toLowerCase())
          )
          .slice(0, 10)
      : [];

  useEffect(() => {
    axios
      .get<{ data: Category[] }>("/api/categories")
      .then((r) => setCategories(r.data.data))
      .catch(() => null);
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
        const res = await axios.post<{ data: { url: string } }>(
          "/api/upload",
          fd
        );
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
    setValue("pricePerKg", value);
    setValue(
      "pricePerGram",
      !isNaN(kg) && kg > 0 ? (kg / 1000).toFixed(2) : ""
    );
  };

  const handlePricePerGramChange = (value: string) => {
    const g = parseFloat(value);
    setValue("pricePerGram", value);
    setValue(
      "pricePerKg",
      !isNaN(g) && g > 0 ? (g * 1000).toFixed(2) : ""
    );
  };

  const addBulkPriceRow = () => {
    setBulkPricing((prev) => [
      ...prev,
      { minQty: "", maxQty: "", price: "", unit: "g" },
    ]);
  };

  const removeBulkPriceRow = (index: number) => {
    setBulkPricing((prev) => prev.filter((_, i) => i !== index));
  };

  const updateBulkPriceRow = (
    index: number,
    field: keyof BulkPriceRow,
    value: string
  ) => {
    setBulkPricing((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const toggleCertification = (cert: string) => {
    const current = getValues("certifications");
    if (current.includes(cert)) {
      setValue(
        "certifications",
        current.filter((c) => c !== cert)
      );
    } else {
      setValue("certifications", [...current, cert]);
    }
  };

  // Step validation before proceeding
  const validateStep = async (currentStep: number): Promise<boolean> => {
    if (currentStep === 1) {
      return trigger(["name"]);
    }
    if (currentStep === 2) {
      return trigger(["price", "stock"]);
    }
    return true;
  };

  const goNext = async () => {
    const valid = await validateStep(step);
    if (valid) setStep((s) => Math.min(s + 1, 4));
  };

  const goPrev = () => setStep((s) => Math.max(s - 1, 1));

  const onSubmit = async (data: ProductFormValues) => {
    setSaving(true);
    try {
      await axios.post("/api/products", {
        name: data.name,
        description: data.description,
        shortDescription: data.shortDescription || undefined,
        price: Number(data.price),
        compareAtPrice: data.compareAtPrice
          ? Number(data.compareAtPrice)
          : undefined,
        costPrice: data.costPrice ? Number(data.costPrice) : undefined,
        pricePerKg: data.pricePerKg ? Number(data.pricePerKg) : undefined,
        pricePerGram: data.pricePerGram
          ? Number(data.pricePerGram)
          : undefined,
        pricePerUnit: data.pricePerUnit
          ? Number(data.pricePerUnit)
          : undefined,
        gstRate: Number(data.gstRate),
        hsn: data.hsnCode || undefined,
        stock: Number(data.stock),
        lowStockThreshold: data.lowStockThreshold
          ? Number(data.lowStockThreshold)
          : undefined,
        weight: data.weight ? Number(data.weight) : undefined,
        shippingWeight: data.shippingWeight
          ? Number(data.shippingWeight)
          : undefined,
        minOrderQuantity: data.minOrderQuantity
          ? Number(data.minOrderQuantity)
          : undefined,
        maxOrderQuantity: data.maxOrderQuantity
          ? Number(data.maxOrderQuantity)
          : undefined,
        tags: data.tags
          ? data.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        allergens: data.allergens
          ? data.allergens
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean)
          : [],
        category: data.category || undefined,
        subcategory: data.subcategory || undefined,
        sku: data.sku || (data.skuPrefix ? `${data.skuPrefix}-` : undefined),
        barcode: data.barcode || undefined,
        unit: data.unit,
        productType: data.productType || undefined,
        brand: data.brand || undefined,
        manufacturer: data.manufacturer || undefined,
        countryOfOrigin: data.countryOfOrigin || undefined,
        ingredients: data.ingredients || undefined,
        shelfLife: data.shelfLife || undefined,
        bestBefore: data.bestBefore || undefined,
        certifications:
          data.certifications.length > 0 ? data.certifications : undefined,
        fssaiLicense: data.fssaiLicenseNumber || undefined,
        isOrganic: data.isOrganic,
        isVegan: data.isVegan,
        isGlutenFree: data.isGlutenFree,
        isActive: data.isActive,
        isFeatured: data.isFeatured,
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
          servingSize: data.servingSize || undefined,
          calories: data.calories ? Number(data.calories) : undefined,
          totalFat: data.totalFat ? Number(data.totalFat) : undefined,
          saturatedFat: data.saturatedFat
            ? Number(data.saturatedFat)
            : undefined,
          transFat: data.transFat ? Number(data.transFat) : undefined,
          cholesterol: data.cholesterol ? Number(data.cholesterol) : undefined,
          sodium: data.sodium ? Number(data.sodium) : undefined,
          totalCarbs: data.totalCarbs ? Number(data.totalCarbs) : undefined,
          dietaryFiber: data.dietaryFiber
            ? Number(data.dietaryFiber)
            : undefined,
          sugars: data.sugars ? Number(data.sugars) : undefined,
          protein: data.protein ? Number(data.protein) : undefined,
        },
        dimensions: {
          length: data.length ? Number(data.length) : undefined,
          width: data.width ? Number(data.width) : undefined,
          height: data.height ? Number(data.height) : undefined,
          unit: data.dimensionUnit,
        },
        returnPolicy: data.returnPolicy || undefined,
        warranty: data.warranty || undefined,
        metaTitle: data.metaTitle || undefined,
        metaDescription: data.metaDescription || undefined,
        videoUrl: data.videoUrl || undefined,
      });
      toast.success("Product created");
      router.push("/admin/products");
    } catch (err: unknown) {
      const msg = axios.isAxiosError(err)
        ? err.response?.data?.message
        : "Failed to create product";
      toast.error(msg ?? "Failed to create product");
    } finally {
      setSaving(false);
    }
  };

  const selectClass =
    "w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672] bg-white";
  const textareaClass =
    "w-full border border-neutral-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-[#E84672] resize-none";
  const sectionClass =
    "bg-white rounded-2xl p-5 border border-neutral-100 space-y-4";
  const labelClass = "block text-sm font-medium text-neutral-700 mb-1.5";

  return (
    <div className="p-8 max-w-4xl">
      <Link
        href="/admin/products"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-800 transition-colors mb-6"
      >
        <RiArrowLeftLine size={15} />
        Back to Products
      </Link>
      <h1 className="text-2xl font-bold text-neutral-900 mb-6">
        Add New Product
      </h1>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.id} className="flex items-center gap-2 flex-1">
            <button
              type="button"
              onClick={() => {
                if (s.id < step) setStep(s.id);
              }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all w-full ${
                step === s.id
                  ? "bg-[#E84672] text-white"
                  : step > s.id
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-neutral-50 text-neutral-400 border border-neutral-100"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step === s.id
                    ? "bg-white/20 text-white"
                    : step > s.id
                      ? "bg-green-200 text-green-700"
                      : "bg-neutral-200 text-neutral-400"
                }`}
              >
                {step > s.id ? <RiCheckLine size={12} /> : s.id}
              </span>
              <span className="truncate">{s.label}</span>
            </button>
            {i < STEPS.length - 1 && (
              <div
                className={`h-px w-4 shrink-0 ${step > s.id ? "bg-green-300" : "bg-neutral-200"}`}
              />
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* ══════════════════════════════════════════════
            STEP 1: Basic Information & Images
            ══════════════════════════════════════════════ */}
        {step === 1 && (
          <>
            {/* Product Images */}
            <div className={sectionClass}>
              <h2 className="font-semibold text-neutral-800 mb-4">
                Product Images
              </h2>
              <div className="flex flex-wrap gap-3 mb-3">
                {images.map((url, i) => (
                  <div
                    key={i}
                    className="relative w-20 h-20 rounded-xl overflow-hidden border border-neutral-200 group"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setImages((prev) =>
                          prev.filter((_, idx) => idx !== i)
                        )
                      }
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <RiDeleteBinLine className="text-white" size={16} />
                    </button>
                    {i === 0 && (
                      <span className="absolute bottom-1 left-1 text-[10px] bg-black/60 text-white px-1 rounded">
                        Main
                      </span>
                    )}
                  </div>
                ))}
                <label
                  className={`w-20 h-20 rounded-xl border-2 border-dashed border-neutral-200 flex flex-col items-center justify-center cursor-pointer hover:border-[#E84672] transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}
                >
                  <RiUploadLine size={18} className="text-neutral-400" />
                  <span className="text-[10px] text-neutral-400 mt-1">
                    {uploading ? "Uploading..." : "Add photo"}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="sr-only"
                    onChange={handleUpload}
                  />
                </label>
              </div>
              <p className="text-xs text-neutral-400">
                First image is used as the main product image.
              </p>
            </div>

            {/* Basic Information */}
            <div className={sectionClass}>
              <h2 className="font-semibold text-neutral-800">
                Basic Information
              </h2>
              <div>
                <Input
                  label="Product Name *"
                  {...register("name", { required: "Product name is required" })}
                  error={errors.name?.message}
                />
              </div>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <RichTextEditor
                    label="Description"
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Describe the product..."
                  />
                )}
              />
              <div>
                <label className={labelClass}>Short Description</label>
                <textarea
                  {...register("shortDescription")}
                  rows={2}
                  maxLength={500}
                  className={textareaClass}
                  placeholder="Brief summary (max 500 characters)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Category</label>
                  <select {...register("category")} className={selectClass}>
                    <option value="">No category</option>
                    {categories.map((c) => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Subcategory"
                  {...register("subcategory")}
                  placeholder="e.g. Whole Spices"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>SKU Prefix</label>
                  <select {...register("skuPrefix")} className={selectClass}>
                    <option value="">Select SKU prefix</option>
                    {skuCodesData.map((s) => (
                      <option key={s.prefix} value={s.prefix}>
                        {s.prefix} - {s.category}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="SKU (or auto from prefix)"
                  {...register("sku")}
                  placeholder="Auto-generated if empty"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Barcode"
                  {...register("barcode")}
                  placeholder="EAN / UPC"
                />
                <div>
                  <label className={labelClass}>Product Type</label>
                  <select
                    {...register("productType")}
                    className={selectClass}
                  >
                    <option value="">Select type</option>
                    {PRODUCT_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Brand" {...register("brand")} />
                <Input
                  label="Manufacturer"
                  {...register("manufacturer")}
                />
              </div>
              <Input
                label="Tags (comma-separated)"
                {...register("tags")}
                placeholder="spice, organic, premium"
              />
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════
            STEP 2: Pricing & Inventory
            ══════════════════════════════════════════════ */}
        {step === 2 && (
          <>
            <div className={sectionClass}>
              <h2 className="font-semibold text-neutral-800">Pricing</h2>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Price (INR) *"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("price", { required: "Price is required" })}
                  error={errors.price?.message}
                />
                <Input
                  label="Compare At Price (INR)"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("compareAtPrice")}
                  placeholder="MRP"
                />
                <Input
                  label="Cost Price (INR)"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("costPrice")}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Price Per KG (INR)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={watchPricePerKg}
                  onChange={(e) => handlePricePerKgChange(e.target.value)}
                />
                <Input
                  label="Price Per Gram (INR)"
                  type="number"
                  min="0"
                  step="0.0001"
                  value={watchPricePerGram}
                  onChange={(e) => handlePricePerGramChange(e.target.value)}
                />
                <Input
                  label="Price Per Unit (INR)"
                  type="number"
                  min="0"
                  step="0.01"
                  {...register("pricePerUnit")}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>GST Rate</label>
                  <select {...register("gstRate")} className={selectClass}>
                    {GST_RATES.map((r) => (
                      <option key={r} value={r}>
                        {r}%
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative">
                  <label className={labelClass}>HSN Code</label>
                  <div className="relative">
                    <input
                      value={watchHsnCode}
                      onChange={(e) => {
                        setValue("hsnCode", e.target.value);
                        setHsnSearch(e.target.value);
                        setHsnDropdownOpen(true);
                      }}
                      onFocus={() => {
                        if (watchHsnCode.length >= 2)
                          setHsnDropdownOpen(true);
                      }}
                      onBlur={() =>
                        setTimeout(() => setHsnDropdownOpen(false), 200)
                      }
                      placeholder="Search HSN code or description..."
                      className={selectClass}
                    />
                    <RiSearchLine
                      size={14}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    />
                  </div>
                  {hsnDropdownOpen && filteredHsnCodes.length > 0 && (
                    <div className="absolute z-20 mt-1 w-full max-h-48 overflow-y-auto rounded-xl border border-neutral-200 bg-white shadow-lg">
                      {filteredHsnCodes.map((h) => (
                        <button
                          key={h.code}
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-neutral-50 transition-colors"
                          onMouseDown={() => {
                            setValue("hsnCode", h.code);
                            setValue("gstRate", String(h.gst));
                            setHsnDropdownOpen(false);
                            setHsnSearch("");
                          }}
                        >
                          <span className="font-mono font-semibold text-[#E84672] shrink-0">
                            {h.code}
                          </span>
                          <span className="text-neutral-600 truncate">
                            {h.description}
                          </span>
                          <span className="ml-auto shrink-0 text-xs text-neutral-400">
                            {h.gst}% GST
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Inventory */}
            <div className={sectionClass}>
              <h2 className="font-semibold text-neutral-800">Inventory</h2>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Stock *"
                  type="number"
                  min="0"
                  {...register("stock", { required: "Stock is required" })}
                  error={errors.stock?.message}
                />
                <Input
                  label="Low Stock Threshold"
                  type="number"
                  min="0"
                  {...register("lowStockThreshold")}
                  placeholder="Alert when below"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Unit</label>
                  <select {...register("unit")} className={selectClass}>
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
                <Input
                  label="Weight (grams)"
                  type="number"
                  min="0"
                  {...register("weight")}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Shipping Weight (g)"
                  type="number"
                  min="0"
                  {...register("shippingWeight")}
                />
                <Input
                  label="Min Order Qty"
                  type="number"
                  min="1"
                  {...register("minOrderQuantity")}
                />
                <Input
                  label="Max Order Qty"
                  type="number"
                  min="1"
                  {...register("maxOrderQuantity")}
                />
              </div>
            </div>

            {/* Bulk Pricing */}
            <div className={sectionClass}>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-neutral-800">
                  Bulk Pricing
                </h2>
                <button
                  type="button"
                  onClick={addBulkPriceRow}
                  className="inline-flex items-center gap-1 text-sm text-[#E84672] hover:text-[#d13a64] font-medium transition-colors"
                >
                  <RiAddLine size={16} /> Add Tier
                </button>
              </div>
              {bulkPricing.length === 0 && (
                <p className="text-sm text-neutral-400">
                  No bulk pricing tiers. Click &quot;Add Tier&quot; to
                  create one.
                </p>
              )}
              {bulkPricing.map((row, i) => (
                <div
                  key={i}
                  className="grid grid-cols-[1fr_1fr_1fr_80px_32px] gap-2 items-end"
                >
                  <Input
                    label={i === 0 ? "Min Qty" : undefined}
                    type="number"
                    min="1"
                    value={row.minQty}
                    onChange={(e) =>
                      updateBulkPriceRow(i, "minQty", e.target.value)
                    }
                    placeholder="Min"
                  />
                  <Input
                    label={i === 0 ? "Max Qty" : undefined}
                    type="number"
                    min="1"
                    value={row.maxQty}
                    onChange={(e) =>
                      updateBulkPriceRow(i, "maxQty", e.target.value)
                    }
                    placeholder="Max"
                  />
                  <Input
                    label={i === 0 ? "Price (INR)" : undefined}
                    type="number"
                    min="0"
                    step="0.01"
                    value={row.price}
                    onChange={(e) =>
                      updateBulkPriceRow(i, "price", e.target.value)
                    }
                    placeholder="Price"
                  />
                  <div>
                    {i === 0 && <label className={labelClass}>Unit</label>}
                    <select
                      value={row.unit}
                      onChange={(e) =>
                        updateBulkPriceRow(i, "unit", e.target.value)
                      }
                      className={selectClass}
                    >
                      {UNITS.map((u) => (
                        <option key={u} value={u}>
                          {u}
                        </option>
                      ))}
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeBulkPriceRow(i)}
                    className="h-10.5 flex items-center justify-center text-neutral-400 hover:text-red-500"
                  >
                    <RiDeleteBinLine size={16} />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════
            STEP 3: Product Details & Nutrition
            ══════════════════════════════════════════════ */}
        {step === 3 && (
          <>
            <div className={sectionClass}>
              <h2 className="font-semibold text-neutral-800">
                Product Details
              </h2>
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Country of Origin"
                  {...register("countryOfOrigin")}
                />
                <Input
                  label="Shelf Life"
                  {...register("shelfLife")}
                  placeholder="e.g. 12 months"
                />
                <Input
                  label="Best Before"
                  type="date"
                  {...register("bestBefore")}
                />
              </div>
              <div>
                <label className={labelClass}>Ingredients</label>
                <textarea
                  {...register("ingredients")}
                  rows={3}
                  className={textareaClass}
                  placeholder="List all ingredients..."
                />
              </div>
              <Input
                label="Allergens (comma-separated)"
                {...register("allergens")}
                placeholder="e.g. Nuts, Gluten, Dairy"
              />
            </div>

            {/* Certifications & Dietary */}
            <div className={sectionClass}>
              <h2 className="font-semibold text-neutral-800">
                Certifications & Dietary
              </h2>
              <div>
                <label className={labelClass}>Certifications</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  <Controller
                    name="certifications"
                    control={control}
                    render={({ field }) =>
                      <>
                        {CERTIFICATIONS.map((cert) => (
                          <label
                            key={cert}
                            className="flex items-center gap-1.5 text-sm cursor-pointer bg-neutral-50 rounded-lg px-3 py-1.5 border border-neutral-200 hover:border-[#E84672] transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={field.value.includes(cert)}
                              onChange={() => toggleCertification(cert)}
                              className="rounded accent-[#E84672]"
                            />
                            {cert}
                          </label>
                        ))}
                      </>
                    }
                  />
                </div>
              </div>
              <Input
                label="FSSAI License Number"
                {...register("fssaiLicenseNumber")}
                placeholder="e.g. 10012345678901"
              />
              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("isOrganic")}
                    className="rounded accent-[#E84672]"
                  />
                  <span className="text-sm text-neutral-700">Is Organic</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("isVegan")}
                    className="rounded accent-[#E84672]"
                  />
                  <span className="text-sm text-neutral-700">Is Vegan</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register("isGlutenFree")}
                    className="rounded accent-[#E84672]"
                  />
                  <span className="text-sm text-neutral-700">
                    Is Gluten Free
                  </span>
                </label>
              </div>
            </div>

            {/* Nutrition Info (collapsible) */}
            <div className="bg-white rounded-2xl border border-neutral-100">
              <button
                type="button"
                onClick={() => setNutritionOpen((o) => !o)}
                className="w-full flex items-center justify-between p-5"
              >
                <h2 className="font-semibold text-neutral-800">
                  Nutrition Info
                </h2>
                <RiArrowDownSLine
                  size={20}
                  className={`text-neutral-400 transition-transform ${nutritionOpen ? "rotate-180" : ""}`}
                />
              </button>
              {nutritionOpen && (
                <div className="px-5 pb-5 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Serving Size"
                      {...register("servingSize")}
                      placeholder="e.g. 100g"
                    />
                    <Input
                      label="Calories"
                      type="number"
                      min="0"
                      {...register("calories")}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Total Fat (g)"
                      type="number"
                      min="0"
                      step="0.1"
                      {...register("totalFat")}
                    />
                    <Input
                      label="Saturated Fat (g)"
                      type="number"
                      min="0"
                      step="0.1"
                      {...register("saturatedFat")}
                    />
                    <Input
                      label="Trans Fat (g)"
                      type="number"
                      min="0"
                      step="0.1"
                      {...register("transFat")}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Cholesterol (mg)"
                      type="number"
                      min="0"
                      {...register("cholesterol")}
                    />
                    <Input
                      label="Sodium (mg)"
                      type="number"
                      min="0"
                      {...register("sodium")}
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <Input
                      label="Total Carbs (g)"
                      type="number"
                      min="0"
                      step="0.1"
                      {...register("totalCarbs")}
                    />
                    <Input
                      label="Dietary Fiber (g)"
                      type="number"
                      min="0"
                      step="0.1"
                      {...register("dietaryFiber")}
                    />
                    <Input
                      label="Sugars (g)"
                      type="number"
                      min="0"
                      step="0.1"
                      {...register("sugars")}
                    />
                  </div>
                  <Input
                    label="Protein (g)"
                    type="number"
                    min="0"
                    step="0.1"
                    {...register("protein")}
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* ══════════════════════════════════════════════
            STEP 4: Shipping, SEO & Visibility
            ══════════════════════════════════════════════ */}
        {step === 4 && (
          <>
            {/* Dimensions & Shipping */}
            <div className={sectionClass}>
              <h2 className="font-semibold text-neutral-800">
                Dimensions & Shipping
              </h2>
              <div className="grid grid-cols-4 gap-4">
                <Input
                  label="Length"
                  type="number"
                  min="0"
                  step="0.1"
                  {...register("length")}
                />
                <Input
                  label="Width"
                  type="number"
                  min="0"
                  step="0.1"
                  {...register("width")}
                />
                <Input
                  label="Height"
                  type="number"
                  min="0"
                  step="0.1"
                  {...register("height")}
                />
                <div>
                  <label className={labelClass}>Unit</label>
                  <select
                    {...register("dimensionUnit")}
                    className={selectClass}
                  >
                    {DIMENSION_UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <Input
                label="Shipping Weight (grams)"
                type="number"
                min="0"
                {...register("shippingWeight")}
                placeholder="With packaging"
              />
            </div>

            {/* Media */}
            <div className={sectionClass}>
              <h2 className="font-semibold text-neutral-800">Media</h2>
              <Input
                label="Video URL"
                {...register("videoUrl")}
                placeholder="https://youtube.com/..."
              />
              <p className="text-xs text-neutral-400">
                Images are managed in Step 1 (Basic Info).
              </p>
            </div>

            {/* SEO */}
            <div className={sectionClass}>
              <h2 className="font-semibold text-neutral-800">SEO</h2>
              <div>
                <Input
                  label="Meta Title"
                  {...register("metaTitle")}
                  placeholder="Page title for search engines"
                />
              </div>
              <div>
                <label className={labelClass}>Meta Description</label>
                <textarea
                  {...register("metaDescription")}
                  rows={2}
                  className={textareaClass}
                  placeholder="Brief description for search results..."
                />
              </div>
            </div>

            {/* Policies */}
            <div className={sectionClass}>
              <h2 className="font-semibold text-neutral-800">Policies</h2>
              <div>
                <label className={labelClass}>Return Policy</label>
                <textarea
                  {...register("returnPolicy")}
                  rows={3}
                  className={textareaClass}
                  placeholder="Describe return policy for this product..."
                />
              </div>
              <Input
                label="Warranty"
                {...register("warranty")}
                placeholder="e.g. No warranty / 6 months"
              />
            </div>

            {/* Visibility */}
            <div className="bg-white rounded-2xl p-5 border border-neutral-100 space-y-3">
              <h2 className="font-semibold text-neutral-800">Visibility</h2>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("isActive")}
                  className="rounded accent-[#E84672]"
                />
                <span className="text-sm text-neutral-700">
                  Active (visible to customers)
                </span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  {...register("isFeatured")}
                  className="rounded accent-[#E84672]"
                />
                <span className="text-sm text-neutral-700">
                  Featured (shown on homepage)
                </span>
              </label>
            </div>
          </>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {step > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={goPrev}
                leftIcon={<RiArrowLeftLine />}
              >
                Previous
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Link href="/admin/products">
              <Button type="button" variant="outline">
                Cancel
              </Button>
            </Link>
            {step < 4 ? (
              <Button
                type="button"
                onClick={goNext}
                rightIcon={<RiArrowRightLine />}
              >
                Next
              </Button>
            ) : (
              <Button type="submit" isLoading={saving}>
                Create Product
              </Button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
