"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { RiHeartFill, RiHeartLine, RiShoppingCartLine } from "react-icons/ri";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/utils/helpers";
import { useWishlistStore } from "@/store/wishlist.store";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import axios from "axios";
import toast from "react-hot-toast";

interface WishlistProduct {
  _id: string;
  name: string;
  slug: string;
  images: string[];
  price: number;
  compareAtPrice?: number;
  stock: number;
  unit: string;
  isActive: boolean;
}

interface ServerWishlistItem {
  product: WishlistProduct;
  addedAt: string;
}

export default function WishlistPage() {
  const { user } = useAuthStore();
  const { items: localItems, toggleItem } = useWishlistStore();
  const { addItem } = useCartStore();
  const [serverItems, setServerItems] = useState<WishlistProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    axios
      .get<{ data: { items: ServerWishlistItem[] } }>("/api/wishlist")
      .then((r) => setServerItems(r.data.data.items.map((i) => i.product).filter(Boolean)))
      .catch(() => null)
      .finally(() => setLoading(false));
  }, [user]);

  const handleRemove = async (productId: string) => {
    setRemoving(productId);
    if (user) {
      await axios.post("/api/wishlist", { productId }).catch(() => null);
      setServerItems((prev) => prev.filter((p) => p._id !== productId));
    } else {
      toggleItem({ productId, name: "", slug: "", image: "", price: 0, unit: "", isInStock: true });
    }
    setRemoving(null);
    toast.success("Removed from wishlist");
  };

  const handleAddToCart = (product: WishlistProduct) => {
    if (product.stock === 0) return;
    addItem({ productId: product._id, name: product.name, slug: product.slug, price: product.price, image: product.images?.[0] ?? "", stock: product.stock, unit: product.unit });
    toast.success("Added to cart");
  };

  // For guests, show local wishlist (just IDs — no product details available without fetching)
  const isEmpty = user ? serverItems.length === 0 : localItems.length === 0;

  if (!loading && isEmpty) {
    return (
      <div className="container-narrow py-24 text-center">
        <RiHeartLine size={48} className="text-neutral-300 mx-auto mb-5" />
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Your wishlist is empty</h2>
        <p className="text-neutral-500 mb-8">
          {user ? "Save items you love and find them here." : "Sign in to save your wishlist across devices."}
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/products"><Button size="lg">Browse Products</Button></Link>
          {!user && <Link href="/login"><Button variant="outline" size="lg">Sign In</Button></Link>}
        </div>
      </div>
    );
  }

  if (!user) {
    // Guests only have IDs; prompt them to sign in for full wishlist view
    return (
      <div className="container-narrow py-24 text-center">
        <RiHeartLine size={48} className="text-neutral-300 mx-auto mb-5" />
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          {localItems.length} item{localItems.length !== 1 ? "s" : ""} saved
        </h2>
        <p className="text-neutral-500 mb-8">Sign in to view and manage your full wishlist.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/login"><Button size="lg">Sign In</Button></Link>
          <Link href="/products"><Button variant="outline" size="lg">Keep Browsing</Button></Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-narrow py-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-neutral-900">My Wishlist</h1>
        <p className="text-sm text-neutral-400">{serverItems.length} item{serverItems.length !== 1 ? "s" : ""}</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <AnimatePresence>
          {serverItems.map((product) => {
            const discount = product.compareAtPrice && product.compareAtPrice > product.price
              ? Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)
              : null;

            return (
              <motion.div
                key={product._id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl border border-neutral-100 overflow-hidden group"
              >
                <Link href={`/products/${product.slug}`} className="block relative">
                  <div className="aspect-square bg-[#F7F6F0] relative overflow-hidden">
                    {product.images?.[0] ? (
                      <Image
                        src={product.images[0]}
                        alt={product.name}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-neutral-300 text-sm font-bold">No Image</div>
                    )}
                    {discount && (
                      <Badge variant="error" className="absolute top-2 left-2">
                        -{discount}%
                      </Badge>
                    )}
                    {product.stock === 0 && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                        <Badge variant="neutral">Out of Stock</Badge>
                      </div>
                    )}
                  </div>
                </Link>

                <div className="p-3">
                  <Link href={`/products/${product.slug}`}>
                    <h3 className="text-sm font-medium text-neutral-800 line-clamp-2 leading-snug hover:text-[#E84672] transition-colors">
                      {product.name}
                    </h3>
                  </Link>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <span className="text-sm font-bold text-neutral-900">{formatCurrency(product.price)}</span>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="text-xs text-neutral-400 line-through">{formatCurrency(product.compareAtPrice)}</span>
                    )}
                  </div>

                  <div className="flex gap-1.5 mt-2.5">
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                      className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg bg-[#E84672] text-white text-xs font-medium hover:bg-[#C9305A] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <RiShoppingCartLine size={13} />
                      Add
                    </button>
                    <button
                      onClick={() => handleRemove(product._id)}
                      disabled={removing === product._id}
                      className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-100 text-[#E84672] hover:bg-red-50 transition-colors disabled:opacity-40"
                    >
                      <RiHeartFill size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
