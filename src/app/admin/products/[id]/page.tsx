"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  RiArrowLeftLine,
  RiEditLine,
  RiExternalLinkLine,
  RiStackLine,
  RiPriceTag3Line,
  RiShieldCheckLine,
  RiRulerLine,
  RiSeoLine,
  RiHeartPulseLine,
  RiStarFill,
  RiCheckLine,
  RiErrorWarningLine,
  RiFilmLine,
} from "react-icons/ri";
import axios from "axios";
import toast from "@/components/ui/toast";
import { formatCurrency, normalizeImageUrl } from "@/utils/helpers";
import { Skeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";

interface ProductData {
  _id: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  price: number;
  compareAtPrice?: number;
  costPrice?: number;
  pricePerKg?: number;
  pricePerGram?: number;
  pricePerUnit?: number;
  gstRate?: number;
  hsn?: string;
  hsnCode?: string;
  stock: number;
  lowStockThreshold?: number;
  unit: string;
  category?: { _id: string; name: string; slug?: string } | string;
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
  fssaiLicense?: string;
  isOrganic?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  nutritionInfo?: {
    servingSize?: string;
    calories?: number;
    totalFat?: number;
    saturatedFat?: number;
    transFat?: number;
    cholesterol?: number;
    sodium?: number;
    totalCarbs?: number;
    dietaryFiber?: number;
    sugars?: number;
    protein?: number;
  };
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: string;
  };
  bulkPricing?: Array<{
    minQty: number;
    maxQty?: number;
    price: number;
    unit: string;
  }>;
  returnPolicy?: string;
  warranty?: string;
  metaTitle?: string;
  metaDescription?: string;
  videoUrl?: string;
  ratings?: { average: number; count: number };
  createdAt?: string;
  updatedAt?: string;
}

export default function AdminProductDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    axios
      .get<{ data: ProductData }>(`/api/products/${id}`)
      .then((res) => {
        setProduct(res.data.data);
      })
      .catch(() => {
        toast.error("Failed to load product details");
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 max-w-6xl space-y-6">
        <Skeleton className="h-6 w-36" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-10 w-28" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full" rounded="xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full" rounded="xl" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="p-12 max-w-xl mx-auto text-center space-y-4">
        <RiErrorWarningLine size={48} className="text-red-500 mx-auto" />
        <h2 className="text-xl font-bold text-neutral-800">Product Not Found</h2>
        <p className="text-sm text-neutral-500">
          The requested product could not be found or has been removed.
        </p>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 text-sm font-semibold text-[#E84672] hover:underline"
        >
          <RiArrowLeftLine /> Return to Products list
        </Link>
      </div>
    );
  }

  const categoryName =
    typeof product.category === "object" && product.category
      ? product.category.name
      : "Uncategorized";

  const costPrice = product.costPrice ?? 0;
  const price = product.price ?? 0;
  const profitMargin = price > 0 && costPrice > 0 ? price - costPrice : 0;
  const profitMarginPct =
    price > 0 && costPrice > 0 ? Math.round((profitMargin / price) * 100) : 0;

  const totalStockValueCost = product.stock * (product.costPrice ?? product.price);
  const totalStockValueRetail = product.stock * product.price;
  const isLowStock = product.stock > 0 && product.stock <= (product.lowStockThreshold ?? 5);
  const isOutOfStock = product.stock === 0;

  return (
    <div className="p-6 md:p-8 max-w-7xl space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
        >
          <RiArrowLeftLine size={16} /> Back to Products
        </Link>

        <div className="flex items-center gap-3">
          <Link
            href={`/products/${product.slug}`}
            target="_blank"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-neutral-700 bg-white border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors shadow-sm"
          >
            <RiExternalLinkLine size={16} /> View on Store
          </Link>
          <Link
            href={`/admin/products/${product._id}/edit`}
            className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-[#E84672] hover:bg-[#d13a64] rounded-xl transition-colors shadow"
          >
            <RiEditLine size={18} /> Edit Product
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-[#F5F0E1] text-[#7A6E42]">
              {categoryName}
            </span>
            {product.productType && (
              <span className="text-xs font-semibold px-3 py-1 rounded-full bg-neutral-100 text-neutral-700 uppercase">
                {product.productType}
              </span>
            )}
            <Badge variant={product.isActive ? "success" : "neutral"} dot>
              {product.isActive ? "Active in Store" : "Hidden / Inactive"}
            </Badge>
            {product.isFeatured && (
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 flex items-center gap-1">
                <RiStarFill size={12} /> Featured
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 leading-tight">
            {product.name}
          </h1>
          <p className="text-xs text-neutral-400 mt-1 font-mono">
            SKU: {product.sku || "N/A"} &nbsp;•&nbsp; ID: {product._id}
          </p>
        </div>

        <div className="flex items-center gap-4 bg-neutral-50 rounded-xl p-4 border border-neutral-100 shrink-0">
          <div className="text-right">
            <p className="text-xs text-neutral-500">Current Stock</p>
            <p className="text-xl font-bold text-neutral-900">
              {product.stock} <span className="text-sm font-normal text-neutral-500">{product.unit}</span>
            </p>
          </div>
          <div>
            {isOutOfStock ? (
              <span className="inline-block px-3 py-1 text-xs font-bold bg-red-100 text-red-700 rounded-full">
                Out of Stock
              </span>
            ) : isLowStock ? (
              <span className="inline-block px-3 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
                Low Stock Alert
              </span>
            ) : (
              <span className="inline-block px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-800 rounded-full">
                In Stock
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Selling Price</span>
            <RiPriceTag3Line size={18} className="text-[#E84672]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900">{formatCurrency(price)}</span>
            {product.compareAtPrice && product.compareAtPrice > price && (
              <span className="text-xs text-neutral-400 line-through">
                {formatCurrency(product.compareAtPrice)}
              </span>
            )}
          </div>
          {costPrice > 0 ? (
            <div className="pt-2 border-t border-neutral-100 text-xs flex justify-between">
              <span className="text-neutral-500">Cost: {formatCurrency(costPrice)}</span>
              <span className="font-semibold text-emerald-600">
                Margin: +{formatCurrency(profitMargin)} ({profitMarginPct}%)
              </span>
            </div>
          ) : (
            <p className="text-xs text-neutral-400 pt-2 border-t border-neutral-100">
              No cost price defined
            </p>
          )}
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Inventory Value</span>
            <RiStackLine size={18} className="text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            {formatCurrency(totalStockValueRetail)}
          </div>
          <div className="pt-2 border-t border-neutral-100 text-xs flex justify-between text-neutral-500">
            <span>Threshold: {product.lowStockThreshold ?? 5} units</span>
            <span>Cost Value: {formatCurrency(totalStockValueCost)}</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Ratings & Reviews</span>
            <RiStarFill size={18} className="text-amber-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-neutral-900">
              {product.ratings?.average ? product.ratings.average.toFixed(1) : "0.0"}
            </span>
            <span className="text-xs text-neutral-500">
              ({product.ratings?.count ?? 0} customer reviews)
            </span>
          </div>
          <p className="text-xs text-neutral-400 pt-2 border-t border-neutral-100">
            {product.isFeatured ? "Highlighted on Homepage" : "Standard store listing"}
          </p>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-neutral-500">
            <span className="text-xs font-semibold uppercase tracking-wider">GST & HSN</span>
            <RiShieldCheckLine size={18} className="text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-neutral-900">
            {product.gstRate != null ? `${product.gstRate}% GST` : "0% GST"}
          </div>
          <p className="text-xs text-neutral-500 pt-2 border-t border-neutral-100">
            HSN Code: <strong className="font-mono">{product.hsn || product.hsnCode || "Not set"}</strong>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-neutral-800 flex items-center justify-between">
              <span>Product Media ({product.images?.length ?? 0} photos)</span>
              <span className="text-xs text-[#E84672] font-semibold">Main Image first</span>
            </h3>

            <div className="aspect-square relative rounded-2xl overflow-hidden bg-neutral-100 border border-neutral-200">
              {product.images?.[selectedImage] ? (
                <img
                  src={normalizeImageUrl(product.images[selectedImage])}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">
                  No Image Available
                </div>
              )}
              {selectedImage === 0 && product.images?.length > 0 && (
                <span className="absolute top-3 left-3 bg-[#E84672] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow flex items-center gap-1">
                  <RiStarFill size={12} /> Main Image
                </span>
              )}
            </div>

            {product.images && product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-all ${
                      i === selectedImage
                        ? "border-[#E84672] ring-2 ring-[#FFC2D1]"
                        : "border-neutral-200 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img
                      src={normalizeImageUrl(img)}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {((product.videos && product.videos.length > 0) || product.videoUrl) && (
              <div className="pt-3 border-t border-neutral-100 space-y-2">
                <h4 className="text-xs font-semibold text-neutral-700 flex items-center gap-1.5">
                  <RiFilmLine className="text-amber-500" size={15} /> Video Preview
                </h4>
                {product.videos?.map((vid, idx) => (
                  <video
                    key={idx}
                    src={vid}
                    controls
                    preload="metadata"
                    className="w-full aspect-video rounded-xl bg-black"
                  />
                ))}
                {product.videoUrl && (
                  <a
                    href={product.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline font-medium"
                  >
                    <RiExternalLinkLine size={13} /> External Video Link
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
              Descriptions & Copy
            </h3>

            {product.shortDescription && (
              <div>
                <p className="text-xs font-semibold uppercase text-neutral-400 mb-1">
                  Short Description
                </p>
                <p className="text-sm text-neutral-700 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  {product.shortDescription}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs font-semibold uppercase text-neutral-400 mb-1">
                Full Description
              </p>
              {product.description ? (
                <div
                  className="prose prose-sm max-w-none text-neutral-700 bg-neutral-50 p-4 rounded-xl border border-neutral-100 leading-relaxed overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="text-xs text-neutral-400 italic">No detailed description added yet.</p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-neutral-900 border-b border-neutral-100 pb-2 flex items-center justify-between">
              <span>Basic Information & Classification</span>
              <Link
                href={`/admin/products/${product._id}/edit`}
                className="text-xs font-medium text-[#E84672] hover:underline inline-flex items-center gap-1"
              >
                <RiEditLine /> Edit
              </Link>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-neutral-400 block">Category</span>
                <span className="font-semibold text-neutral-800">{categoryName}</span>
              </div>
              <div>
                <span className="text-neutral-400 block">Subcategory</span>
                <span className="font-semibold text-neutral-800">{product.subcategory || "None"}</span>
              </div>
              <div>
                <span className="text-neutral-400 block">Product Type</span>
                <span className="font-semibold text-neutral-800 capitalize">
                  {product.productType || "Standard"}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block">SKU Code</span>
                <span className="font-mono font-semibold text-neutral-800">{product.sku}</span>
              </div>
              <div>
                <span className="text-neutral-400 block">Barcode</span>
                <span className="font-mono font-semibold text-neutral-800">
                  {product.barcode || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block">Unit</span>
                <span className="font-semibold text-neutral-800">{product.unit}</span>
              </div>
              <div>
                <span className="text-neutral-400 block">Brand</span>
                <span className="font-semibold text-neutral-800">{product.brand || "Lotus Mart"}</span>
              </div>
              <div>
                <span className="text-neutral-400 block">Manufacturer</span>
                <span className="font-semibold text-neutral-800">
                  {product.manufacturer || "N/A"}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block">Country of Origin</span>
                <span className="font-semibold text-neutral-800">
                  {product.countryOfOrigin || "India"}
                </span>
              </div>
            </div>

            {product.tags && product.tags.length > 0 && (
              <div className="pt-2 border-t border-neutral-100">
                <span className="text-xs text-neutral-400 block mb-1.5">Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {product.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600 text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
              Pricing Breakdown & Unit Rates
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                <span className="text-neutral-400 block">Selling Price</span>
                <span className="text-base font-bold text-neutral-900">
                  {formatCurrency(product.price)}
                </span>
              </div>
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                <span className="text-neutral-400 block">MRP / Compare At</span>
                <span className="text-base font-bold text-neutral-600">
                  {product.compareAtPrice ? formatCurrency(product.compareAtPrice) : "N/A"}
                </span>
              </div>
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                <span className="text-neutral-400 block">Cost Price</span>
                <span className="text-base font-bold text-neutral-600">
                  {product.costPrice ? formatCurrency(product.costPrice) : "N/A"}
                </span>
              </div>
              <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                <span className="text-neutral-400 block">Estimated Profit</span>
                <span className="text-base font-bold text-emerald-600">
                  {costPrice > 0 ? `+${formatCurrency(profitMargin)}` : "N/A"}
                </span>
              </div>
            </div>

            {(product.pricePerKg || product.pricePerGram || product.pricePerUnit) && (
              <div className="pt-2 border-t border-neutral-100 grid grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-neutral-400 block">Price / KG</span>
                  <span className="font-semibold text-neutral-800">
                    {product.pricePerKg ? formatCurrency(product.pricePerKg) : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Price / Gram</span>
                  <span className="font-semibold text-neutral-800">
                    {product.pricePerGram ? `₹${product.pricePerGram}` : "N/A"}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-400 block">Price / Unit</span>
                  <span className="font-semibold text-neutral-800">
                    {product.pricePerUnit ? formatCurrency(product.pricePerUnit) : "N/A"}
                  </span>
                </div>
              </div>
            )}

            {product.bulkPricing && product.bulkPricing.length > 0 && (
              <div className="pt-3 border-t border-neutral-100 space-y-2">
                <h4 className="text-xs font-semibold text-neutral-700">Bulk Pricing Tiers</h4>
                <div className="overflow-x-auto rounded-xl border border-neutral-200">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200">
                      <tr>
                        <th className="px-3 py-2">Quantity Range</th>
                        <th className="px-3 py-2">Tier Price</th>
                        <th className="px-3 py-2">Savings / Unit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-100">
                      {product.bulkPricing.map((tier, idx) => {
                        const savings = price > tier.price ? price - tier.price : 0;
                        return (
                          <tr key={idx}>
                            <td className="px-3 py-2 font-medium">
                              {tier.minQty} {tier.maxQty ? `to ${tier.maxQty}` : "+"} {tier.unit}
                            </td>
                            <td className="px-3 py-2 font-bold text-[#E84672]">
                              {formatCurrency(tier.price)}
                            </td>
                            <td className="px-3 py-2 text-emerald-600 font-semibold">
                              {savings > 0 ? `Save ${formatCurrency(savings)}` : "Standard"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-neutral-900 border-b border-neutral-100 pb-2">
              Dietary, Certifications & Ingredients
            </h3>

            <div className="flex flex-wrap gap-2">
              {product.isOrganic && (
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center gap-1">
                  <RiCheckLine /> Organic Certified
                </span>
              )}
              {product.isVegan && (
                <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-bold flex items-center gap-1">
                  <RiCheckLine /> 100% Vegan
                </span>
              )}
              {product.isGlutenFree && (
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold flex items-center gap-1">
                  <RiCheckLine /> Gluten Free
                </span>
              )}
              {!product.isOrganic && !product.isVegan && !product.isGlutenFree && (
                <span className="text-xs text-neutral-400 italic">No specific dietary flags set</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <span className="text-neutral-400 block mb-1">Certifications</span>
                {product.certifications && product.certifications.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {product.certifications.map((c) => (
                      <span
                        key={c}
                        className="px-2.5 py-1 rounded-lg bg-neutral-100 text-neutral-800 font-semibold"
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-neutral-500">None specified</span>
                )}
              </div>

              <div>
                <span className="text-neutral-400 block mb-1">FSSAI License Number</span>
                <span className="font-mono font-semibold text-neutral-800">
                  {product.fssaiLicense || "Not provided"}
                </span>
              </div>
            </div>

            <div className="space-y-3 pt-2 border-t border-neutral-100 text-xs">
              <div>
                <span className="text-neutral-400 block mb-1">Ingredients List</span>
                <p className="text-neutral-700 bg-neutral-50 p-3 rounded-xl border border-neutral-100 leading-relaxed">
                  {product.ingredients || "No ingredient list specified."}
                </p>
              </div>

              {product.allergens && product.allergens.length > 0 && (
                <div>
                  <span className="text-neutral-400 block mb-1">Allergens</span>
                  <p className="text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 font-medium">
                    {product.allergens.join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {product.nutritionInfo && (
            <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm space-y-4">
              <h3 className="text-base font-semibold text-neutral-900 border-b border-neutral-100 pb-2 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <RiHeartPulseLine className="text-rose-500" /> Nutrition Facts
                </span>
                {product.nutritionInfo.servingSize && (
                  <span className="text-xs text-neutral-500 font-normal">
                    Per {product.nutritionInfo.servingSize}
                  </span>
                )}
              </h3>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-neutral-400 block">Calories</span>
                  <span className="text-base font-bold text-neutral-900">
                    {product.nutritionInfo.calories ?? "-"} kcal
                  </span>
                </div>
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-neutral-400 block">Protein</span>
                  <span className="text-base font-bold text-neutral-900">
                    {product.nutritionInfo.protein ?? "-"} g
                  </span>
                </div>
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-neutral-400 block">Total Carbs</span>
                  <span className="text-base font-bold text-neutral-900">
                    {product.nutritionInfo.totalCarbs ?? "-"} g
                  </span>
                </div>
                <div className="bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  <span className="text-neutral-400 block">Total Fat</span>
                  <span className="text-base font-bold text-neutral-900">
                    {product.nutritionInfo.totalFat ?? "-"} g
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-2 border-t border-neutral-100 text-neutral-600">
                <div>Saturated Fat: <strong>{product.nutritionInfo.saturatedFat ?? "-"} g</strong></div>
                <div>Trans Fat: <strong>{product.nutritionInfo.transFat ?? "-"} g</strong></div>
                <div>Cholesterol: <strong>{product.nutritionInfo.cholesterol ?? "-"} mg</strong></div>
                <div>Sodium: <strong>{product.nutritionInfo.sodium ?? "-"} mg</strong></div>
                <div>Dietary Fiber: <strong>{product.nutritionInfo.dietaryFiber ?? "-"} g</strong></div>
                <div>Sugars: <strong>{product.nutritionInfo.sugars ?? "-"} g</strong></div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm space-y-4">
            <h3 className="text-base font-semibold text-neutral-900 border-b border-neutral-100 pb-2 flex items-center gap-2">
              <RiRulerLine className="text-blue-500" /> Dimensions, Shipping & Policies
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-neutral-400 block">Package Dimensions</span>
                <span className="font-semibold text-neutral-800">
                  {product.dimensions?.length || product.dimensions?.width || product.dimensions?.height
                    ? `${product.dimensions.length ?? 0} × ${product.dimensions.width ?? 0} × ${product.dimensions.height ?? 0} ${product.dimensions.unit ?? "cm"}`
                    : "Not set"}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block">Product Weight</span>
                <span className="font-semibold text-neutral-800">
                  {product.weight ? `${product.weight} g` : "Not set"}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block">Shipping Weight</span>
                <span className="font-semibold text-neutral-800">
                  {product.shippingWeight ? `${product.shippingWeight} g` : "Not set"}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block">Shelf Life</span>
                <span className="font-semibold text-neutral-800">{product.shelfLife || "N/A"}</span>
              </div>
              <div>
                <span className="text-neutral-400 block">Min / Max Order Qty</span>
                <span className="font-semibold text-neutral-800">
                  Min {product.minOrderQuantity ?? 1} / Max {product.maxOrderQuantity || "Unlimited"}
                </span>
              </div>
              <div>
                <span className="text-neutral-400 block">Warranty</span>
                <span className="font-semibold text-neutral-800">{product.warranty || "None"}</span>
              </div>
            </div>

            {product.returnPolicy && (
              <div className="pt-2 border-t border-neutral-100 text-xs">
                <span className="text-neutral-400 block mb-1">Return Policy</span>
                <p className="text-neutral-700 bg-neutral-50 p-3 rounded-xl border border-neutral-100">
                  {product.returnPolicy}
                </p>
              </div>
            )}
          </div>

          {(product.metaTitle || product.metaDescription) && (
            <div className="bg-white rounded-2xl p-6 border border-neutral-100 shadow-sm space-y-4">
              <h3 className="text-base font-semibold text-neutral-900 border-b border-neutral-100 pb-2 flex items-center gap-2">
                <RiSeoLine className="text-purple-500" /> Search Engine Optimization (SEO)
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="text-neutral-400 block mb-1">Meta Title</span>
                  <p className="font-semibold text-neutral-800 bg-neutral-50 p-2.5 rounded-xl border border-neutral-100">
                    {product.metaTitle}
                  </p>
                </div>
                <div>
                  <span className="text-neutral-400 block mb-1">Meta Description</span>
                  <p className="text-neutral-700 bg-neutral-50 p-3 rounded-xl border border-neutral-100 leading-relaxed">
                    {product.metaDescription}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-2xl p-4 border border-neutral-200 shadow-lg flex items-center justify-between sticky bottom-6">
        <div className="text-xs text-neutral-500">
          Viewing details for <strong className="text-neutral-800">{product.name}</strong> ({product.stock} in stock)
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="px-4 py-2 text-xs font-semibold text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-xl transition-colors"
          >
            Back to List
          </Link>
          <Link
            href={`/admin/products/${product._id}/edit`}
            className="px-5 py-2 text-xs font-semibold text-white bg-[#E84672] hover:bg-[#d13a64] rounded-xl transition-colors shadow flex items-center gap-1.5"
          >
            <RiEditLine size={15} /> Edit Product
          </Link>
        </div>
      </div>
    </div>
  );
}
