"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
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
} from "react-icons/ri";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { Button } from "@/components/ui/Button";
import { formatCurrency, calculateDiscount } from "@/utils/helpers";
import toast from "react-hot-toast";

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

  const inCart = isInCart(product._id);
  const inWishlist = isInWishlist(product._id);
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
      {/* Breadcrumb */}
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

      <div className="grid lg:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <motion.div
            key={selectedImage}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative aspect-square rounded-3xl overflow-hidden bg-[#F7F6F0] mb-4"
          >
            {product.images?.[selectedImage] ? (
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-300 text-lg font-bold">No Image</div>
            )}
            {discount > 0 && (
              <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#E84672] text-white text-sm font-bold">
                -{discount}%
              </div>
            )}
          </motion.div>

          {product.images?.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1 no-scrollbar">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-colors ${i === selectedImage ? "border-[#E84672]" : "border-transparent"}`}
                >
                  <Image src={img} alt="" width={80} height={80} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.category && (
            <Link href={`/categories/${product.category.slug}`} className="text-sm font-medium text-[#7A6E42] hover:underline">
              {product.category.name}
            </Link>
          )}
          <h1 className="text-3xl font-bold text-neutral-900 mt-2 mb-3">{product.name}</h1>

          {/* Rating */}
          {product.ratings && product.ratings.count > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <RiStarFill
                    key={s}
                    size={16}
                    className={s <= Math.round(product.ratings!.average) ? "text-amber-400" : "text-neutral-200"}
                  />
                ))}
              </div>
              <span className="text-sm text-neutral-500">{product.ratings.average.toFixed(1)} ({product.ratings.count} reviews)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-5">
            <span className="text-4xl font-bold text-neutral-900">{formatCurrency(product.price)}</span>
            <span className="text-base text-neutral-400">/ {product.unit}</span>
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="text-lg text-neutral-400 line-through">{formatCurrency(product.compareAtPrice)}</span>
            )}
          </div>

          {/* Short description */}
          {product.shortDescription && (
            <p className="text-neutral-600 text-sm leading-relaxed mb-5">{product.shortDescription}</p>
          )}

          {/* Variants */}
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

          {/* Quantity + CTA */}
          <div className="flex items-center gap-4 mb-4">
            <div className="flex items-center gap-2 bg-[#F7F6F0] rounded-xl p-1">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors"
              >
                <RiSubtractLine size={16} />
              </button>
              <span className="w-10 text-center font-semibold text-neutral-800">{quantity}</span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
                className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-neutral-600 hover:bg-neutral-50 transition-colors disabled:opacity-40"
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
              className="w-12 h-12 rounded-xl border border-neutral-200 flex items-center justify-center hover:border-[#E84672] hover:bg-[#FFF1F3] transition-all shrink-0"
            >
              {inWishlist ? <RiHeartFill size={20} className="text-[#E84672]" /> : <RiHeartLine size={20} className="text-neutral-400" />}
            </button>
          </div>

          {product.stock > 0 && product.stock <= 10 && (
            <p className="text-sm text-amber-600 font-medium mb-4">Only {product.stock} left in stock</p>
          )}

          {/* Trust badges */}
          <div className="flex flex-wrap gap-4 py-4 border-t border-b border-[#EBE8D8] my-5">
            {[
              { icon: RiShieldCheckLine, text: "FSSAI Certified" },
              { icon: RiTruckLine, text: "Free shipping ₹500+" },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-1.5 text-sm text-neutral-500">
                <Icon size={15} className="text-[#7A6E42]" /> {text}
              </div>
            ))}
          </div>

          {/* SKU & Tags */}
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

      {/* Full description */}
      {product.description && (
        <div className="mt-12 bg-white rounded-2xl p-8 border border-neutral-100">
          <h2 className="text-xl font-bold text-neutral-900 mb-4">Product Details</h2>
          <div className="prose prose-sm max-w-none text-neutral-600 leading-relaxed whitespace-pre-wrap">
            {product.description}
          </div>
        </div>
      )}

      {/* Back link */}
      <Link href="/products" className="inline-flex items-center gap-1.5 text-sm text-neutral-400 hover:text-[#E84672] mt-8 transition-colors">
        <RiArrowLeftLine size={16} /> Back to all products
      </Link>
    </div>
  );
}
