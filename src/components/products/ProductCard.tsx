"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { RiHeartLine, RiHeartFill, RiShoppingCartLine, RiStarFill } from "react-icons/ri";
import { useCartStore } from "@/store/cart.store";
import { useWishlistStore } from "@/store/wishlist.store";
import { formatCurrency, calculateDiscount, normalizeImageUrl } from "@/utils/helpers";
import toast from "@/components/ui/toast";
import { cn } from "@/utils/helpers";

export interface ProductCardData {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  compareAtPrice?: number;
  stock: number;
  unit: string;
  ratings?: { average: number; count: number };
  isFeatured?: boolean;
  category?: { name: string; slug: string };
}

interface ProductCardProps {
  product: ProductCardData;
  className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
  const [imgError, setImgError] = useState(false);
  const { addItem, isInCart } = useCartStore();
  const { toggleItem, isInWishlist } = useWishlistStore();

  const inCart = isInCart(product._id);
  const inWishlist = isInWishlist(product._id);
  const discount = calculateDiscount(product.price, product.compareAtPrice);
  const isOutOfStock = product.stock === 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isOutOfStock) return;

    addItem({
      productId: product._id,
      name: product.name,
      slug: product.slug,
      image: product.images?.[0] ?? "",
      price: product.price,
      compareAtPrice: product.compareAtPrice,
      stock: product.stock,
      unit: product.unit,
    });
    toast.success("Added to cart");
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
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
    toast.success(added ? "Added to wishlist" : "Removed from wishlist");
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={cn("group", className)}
    >
      <Link href={`/products/${product.slug}`} className="block">
        <div className="bg-white rounded-2xl overflow-hidden border border-neutral-100 hover:border-neutral-200 hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-300">
          
          <div className="relative aspect-square overflow-hidden bg-[#F7F6F0]">
            {!imgError && product.images?.[0] ? (
              <Image
                src={normalizeImageUrl(product.images[0])}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-500"
                onError={() => setImgError(true)}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-300 text-sm font-bold">No Image</div>
            )}

            
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />

            
            <button
              onClick={handleWishlist}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:scale-110"
              aria-label="Toggle wishlist"
            >
              {inWishlist ? (
                <RiHeartFill size={16} className="text-[#E84672]" />
              ) : (
                <RiHeartLine size={16} className="text-neutral-400" />
              )}
            </button>

            
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {discount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-[#E84672] text-white text-xs font-bold">
                  -{discount}%
                </span>
              )}
              {isOutOfStock && (
                <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-white text-xs font-medium">
                  Out of Stock
                </span>
              )}
              {product.isFeatured && !isOutOfStock && (
                <span className="px-2 py-0.5 rounded-full bg-[#7A6E42] text-white text-xs font-medium">
                  Featured
                </span>
              )}
            </div>
          </div>

          
          <div className="p-4">
            {product.category && (
              <p className="text-xs text-[#7A6E42] font-medium mb-1">{product.category.name}</p>
            )}
            <h3 className="text-sm font-semibold text-neutral-800 line-clamp-2 leading-snug mb-2">
              {product.name}
            </h3>

            
            {product.ratings && product.ratings.count > 0 && (
              <div className="flex items-center gap-1 mb-2">
                <RiStarFill size={12} className="text-amber-400" />
                <span className="text-xs font-medium text-neutral-600">
                  {product.ratings.average.toFixed(1)} ({product.ratings.count})
                </span>
              </div>
            )}

            
            <div className="flex items-center justify-between mt-3">
              <div>
                <span className="text-base font-bold text-neutral-900">
                  {formatCurrency(product.price)}
                </span>
                <span className="text-xs text-neutral-400 ml-1">/ {product.unit}</span>
                {product.compareAtPrice && product.compareAtPrice > product.price && (
                  <p className="text-xs text-neutral-400 line-through">
                    {formatCurrency(product.compareAtPrice)}
                  </p>
                )}
              </div>

              <button
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-200",
                  isOutOfStock
                    ? "bg-neutral-100 text-neutral-400 cursor-not-allowed"
                    : inCart
                    ? "bg-[#FFF1F3] text-[#E84672] border border-[#FFC2D1]"
                    : "bg-[#E84672] text-white hover:bg-[#C9305A] hover:shadow-sm",
                )}
              >
                <RiShoppingCartLine size={14} />
                {inCart ? "In Cart" : "Add"}
              </button>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
