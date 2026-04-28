"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  RiHeartLine,
  RiHeartFill,
  RiShoppingCartLine,
  RiFlashlightLine,
  RiAddLine,
  RiSubtractLine,
  RiStarFill,
  RiShieldCheckLine,
  RiTruckLine,
  RiArrowLeftLine,
  RiRefund2Line,
  RiLeafLine,
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { Button } from "@/components/ui/Button";
import { ProductImageZoom } from "@/components/products/ProductImageZoom";
import { formatCurrency, calculateDiscount, normalizeImageUrl } from "@/utils/helpers";
import toast from "@/components/ui/toast";

interface ProductDetailProps {
  product: {
    _id: string;
    name: string;
    slug: string;
    description: string;
    shortDescription?: string;
    images: string[];
    price: number;
    compareAtPrice?: number;
    stock: number;
    unit: string;
    sku?: string;
    weight?: number;
    ratings?: { average: number; count: number };
    isFeatured?: boolean;
    tags?: string[];
    category?: { name: string; slug: string };
    variants?: Array<{
      name: string;
      options: Array<{ name: string; value: string; priceAdjustment?: number; stock: number }>;
    }>;
  };
}

export function ProductDetail({ product }: ProductDetailProps) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  const { addItem, isInCart } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();

  // Both stores hydrate from localStorage post-mount; reading them during SSR
  // / first client render would mismatch and trip React 19's hydration guard.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const inCart = mounted && isInCart(product._id);
  const inWishlist = mounted && isInWishlist(product._id);
  const discount = calculateDiscount(product.price, product.compareAtPrice);
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = () => {
    if (isOutOfStock) return;
    const variant = Object.keys(selectedVariants).length
      ? { name: Object.keys(selectedVariants)[0], value: Object.values(selectedVariants)[0] }
      : undefined;

    addItem({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] ?? "",
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: product.stock,
      unit: product.unit,
      quantity,
      variant,
    });
    toast.success("Added to cart");
  };

  const handleBuyNow = () => {
    if (isOutOfStock) return;
    const variant = Object.keys(selectedVariants).length
      ? { name: Object.keys(selectedVariants)[0], value: Object.values(selectedVariants)[0] }
      : undefined;

    addItem({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] ?? "",
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: product.stock,
      unit: product.unit,
      quantity,
      variant,
    });
    router.push("/checkout");
  };

  const handleWishlist = () => {
    const added = toggleItem({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] ?? "",
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      unit: product.unit,
      isInStock: product.stock > 0,
    });
    toast.success(added ? "Saved to wishlist ♥" : "Removed from wishlist");
  };

  return (
    <div className="container-wide py-8">
      
      <div className="flex items-center gap-2 text-sm text-neutral-400 mb-6">
        <Link href="/" className="hover:text-[#E84672] transition-colors">Home</Link>
        <span>/</span>
        <Link href="/products" className="hover:text-[#E84672] transition-colors">Products</Link>
        {product.category && (
          <>
            <span>/</span>
            <Link href={`/categories/${product.category.slug}`} className="hover:text-[#E84672] transition-colors">
              {product.category.name}
            </Link>
          </>
        )}
        <span>/</span>
        <span className="text-neutral-600 font-medium truncate">{product.name}</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
        {/* Images */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          {product.images?.[selectedImage] ? (
            <ProductImageZoom
              src={product.images[selectedImage]}
              alt={product.name}
              discount={discount}
              imageKey={selectedImage}
            />
          ) : (
            <div className="relative aspect-[4/5] sm:aspect-square rounded-2xl lg:rounded-3xl overflow-hidden bg-[#F7F6F0] flex items-center justify-center text-neutral-300 text-lg font-bold">
              No Image
            </div>
          )}

          {product.images?.length > 1 && (
            <div className="flex gap-2.5 overflow-x-auto pb-1 mt-3 no-scrollbar">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  aria-label={`View image ${i + 1}`}
                  className={`shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border-2 transition-all hover:-translate-y-0.5 ${
                    i === selectedImage
                      ? "border-[#E84672] ring-2 ring-[#FFC2D1] ring-offset-1"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <Image src={normalizeImageUrl(img)} alt="" width={80} height={80} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div>
          {product.category && (
            <Link href={`/categories/${product.category.slug}`} className="inline-block text-xs font-semibold uppercase tracking-wider text-[#7A6E42] bg-[#F5F0E1] px-3 py-1 rounded-full hover:bg-[#EBE8D8] transition-colors">
              {product.category.name}
            </Link>
          )}
          <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900 mt-3 mb-2 leading-tight">{product.name}</h1>

          {product.ratings && product.ratings.count > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <RiStarFill
                    key={s}
                    size={15}
                    className={s <= Math.round(product.ratings!.average) ? "text-amber-400" : "text-neutral-200"}
                  />
                ))}
              </div>
              <span className="text-sm text-neutral-500">{product.ratings.average.toFixed(1)} ({product.ratings.count} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-4 pb-4 border-b border-[#EBE8D8]">
            <span className="text-3xl sm:text-4xl font-bold text-neutral-900">{formatCurrency(product.price)}</span>
            <span className="text-sm text-neutral-400">/ {product.unit}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-lg text-neutral-400 line-through">{formatCurrency(product.compareAtPrice)}</span>
            )}
            {discount > 0 && (
              <span className="text-sm font-bold text-[#E84672] bg-[#FFF1F3] px-2.5 py-0.5 rounded-full">
                Save {discount}%
              </span>
            )}
          </div>

          {product.shortDescription && (
            <p className="text-neutral-600 text-sm leading-relaxed mb-5">{product.shortDescription}</p>
          )}

          
          {product.variants?.map((v) => (
            <div key={v.name} className="mb-4">
              <p className="text-sm font-semibold text-neutral-700 mb-2">{v.name}</p>
              <div className="flex flex-wrap gap-2">
                {v.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSelectedVariants((prev) => ({ ...prev, [v.name]: opt.value }))}
                    className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                      selectedVariants[v.name] === opt.value
                        ? "border-[#E84672] bg-[#FFF1F3] text-[#E84672]"
                        : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                    } ${opt.stock === 0 ? "opacity-40 cursor-not-allowed" : ""}`}
                    disabled={opt.stock === 0}
                  >
                    {opt.value}
                    {opt.priceAdjustment && opt.priceAdjustment !== 0 && (
                      <span className="ml-1 text-xs">
                        ({opt.priceAdjustment > 0 ? "+" : ""}{formatCurrency(opt.priceAdjustment)})
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}

          {/* Quantity + Actions */}
          <div className="bg-[#FAFAF9] rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex items-center gap-1 bg-white rounded-xl p-1 border border-neutral-200">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors"
                >
                  <RiSubtractLine size={16} />
                </button>
                <span className="w-10 text-center font-semibold text-neutral-800">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                  disabled={quantity >= product.stock}
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-40"
                >
                  <RiAddLine size={16} />
                </button>
              </div>

              <Button
                size="lg"
                fullWidth
                leftIcon={<RiShoppingCartLine />}
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                variant={inCart ? "outline" : "primary"}
              >
                {isOutOfStock ? "Out of Stock" : inCart ? "In Cart — Add More" : "Add to Cart"}
              </Button>

              <button
                onClick={handleWishlist}
                className="w-11 h-11 rounded-xl border border-neutral-200 bg-white flex items-center justify-center hover:border-[#E84672] hover:bg-[#FFF1F3] transition-all shrink-0"
              >
                {inWishlist ? <RiHeartFill size={18} className="text-[#E84672]" /> : <RiHeartLine size={18} className="text-neutral-400" />}
              </button>
            </div>

            {!isOutOfStock && (
              <Button
                size="lg"
                fullWidth
                leftIcon={<RiFlashlightLine />}
                onClick={handleBuyNow}
                className="bg-[#FF6B35] hover:bg-[#E55A2B] border-[#FF6B35]"
              >
                Buy Now
              </Button>
            )}
          </div>

          {product.stock > 0 && product.stock <= 10 && (
            <p className="text-sm text-amber-600 font-medium mb-4 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
              Only {product.stock} left in stock
            </p>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-5">
            {[
              { icon: RiShieldCheckLine, text: "FSSAI Certified" },
              { icon: RiTruckLine, text: "Free over ₹500" },
              { icon: RiLeafLine, text: "100% Natural" },
              { icon: RiRefund2Line, text: "Easy Returns" },
            ].map(({ icon: Icon, text }) => (
              <div
                key={text}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#FAFAF9] border border-[#EBE8D8] text-xs text-neutral-600"
              >
                <Icon size={16} className="text-[#7A6E42] shrink-0" />
                <span className="font-medium truncate">{text}</span>
              </div>
            ))}
          </div>

          
          {product.sku && <p className="text-xs text-neutral-400 mb-2">SKU: {product.sku}</p>}
          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {product.tags.map((tag) => (
                <span key={tag} className="px-2.5 py-0.5 rounded-full bg-[#F7F6F0] text-xs text-neutral-500">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="mt-12 bg-white rounded-3xl p-6 sm:p-8 border border-neutral-100 shadow-sm">
          <div className="flex items-center gap-2 mb-5">
            <span className="w-1 h-5 rounded-full bg-[#E84672]" />
            <h2 className="text-xl font-bold text-neutral-900">Product Details</h2>
          </div>
          <div
            className="prose prose-sm max-w-none text-neutral-600 leading-relaxed prose-headings:text-neutral-800 prose-strong:text-neutral-800 prose-a:text-[#E84672]"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </div>
      )}

      <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-[#E84672] mt-6 mb-4 transition-colors">
        <RiArrowLeftLine size={16} /> Back to all products
      </Link>
    </div>
  );
}
