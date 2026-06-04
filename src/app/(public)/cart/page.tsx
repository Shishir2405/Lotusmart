"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiDeleteBinLine,
  RiAddLine,
  RiSubtractLine,
  RiShoppingCartLine,
  RiArrowRightLine,
} from "react-icons/ri";
import { useCartStore } from "@/store/cart.store";
import { Button } from "@/components/ui/Button";
import { formatCurrency, normalizeImageUrl } from "@/utils/helpers";

export default function CartPage() {
  const { items, removeItem, updateQuantity, getSubtotal, getTotal, discount, couponCode } =
    useCartStore();

  const subtotal = getSubtotal();
  const total = getTotal();

  if (items.length === 0) {
    return (
      <div className="container-narrow py-24 text-center">
        <div className="text-neutral-300 mb-6 flex justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg></div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Your cart is empty</h2>
        <p className="text-neutral-500 mb-8">
          Browse our collection and add something delicious!
        </p>
        <Link href="/products">
          <Button size="lg">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container-wide py-10">
      <h1 className="text-3xl font-bold text-neutral-900 mb-8">
        Shopping Cart
        <span className="ml-3 text-lg font-normal text-neutral-400">
          ({items.length} {items.length === 1 ? "item" : "items"})
        </span>
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div
                key={`${item.productId}-${item.variant?.value}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="bg-white rounded-2xl p-4 sm:p-5 flex gap-4 border border-neutral-100"
              >
                
                <Link href={`/products/${item.productId}`} className="shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-[#F7F6F0] overflow-hidden">
                    {item.image ? (
                      <Image
                        src={normalizeImageUrl(item.image)}
                        alt={item.name}
                        width={96}
                        height={96}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-neutral-300 font-bold">N/A</div>
                    )}
                  </div>
                </Link>

                
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.productId}`}>
                    <h3 className="text-sm font-semibold text-neutral-800 hover:text-[#E84672] transition-colors line-clamp-2">
                      {item.name}
                    </h3>
                  </Link>
                  {item.variant && (
                    <p className="text-xs text-neutral-400 mt-0.5">
                      {item.variant.name}: {item.variant.value}
                    </p>
                  )}
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {formatCurrency(item.price)} / {item.unit}
                  </p>

                  <div className="flex items-center justify-between mt-3">
                    
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity - 1, item.variant)}
                        className="w-7 h-7 rounded-lg bg-[#F7F6F0] hover:bg-[#EBE8D8] flex items-center justify-center text-neutral-600 transition-colors"
                      >
                        <RiSubtractLine size={14} />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold text-neutral-800">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.productId, item.quantity + 1, item.variant)}
                        disabled={item.quantity >= item.stock}
                        className="w-7 h-7 rounded-lg bg-[#F7F6F0] hover:bg-[#EBE8D8] flex items-center justify-center text-neutral-600 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <RiAddLine size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-base font-bold text-neutral-900">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                      <button
                        onClick={() => removeItem(item.productId, item.variant)}
                        className="p-1.5 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <RiDeleteBinLine size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl p-6 border border-neutral-100 sticky top-24">
            <h2 className="text-lg font-bold text-neutral-900 mb-5">Order Summary</h2>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-neutral-600">
                <span>Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotal)}</span>
              </div>
              <div className="flex justify-between text-neutral-600">
                <span>Shipping</span>
                <span className="text-green-600 font-medium">
                  {subtotal > 0 ? "FREE" : "—"}
                </span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount {couponCode && `(${couponCode})`}</span>
                  <span className="font-medium">-{formatCurrency(discount)}</span>
                </div>
              )}

              {subtotal > 0 && (
                <div className="bg-[#FFF9E8] rounded-xl p-3 text-xs text-amber-700 border border-amber-200">
                  Free shipping on online payment. Cash on Delivery adds a flat ₹100 handling fee.
                </div>
              )}
            </div>

            <div className="border-t border-[#EBE8D8] mt-4 pt-4 flex justify-between items-center">
              <span className="text-base font-bold text-neutral-900">Total</span>
              <span className="text-xl font-bold text-[#E84672]">
                {formatCurrency(total)}
              </span>
            </div>

            <Link href="/checkout" className="block mt-5">
              <Button fullWidth size="lg" rightIcon={<RiArrowRightLine />}>
                Proceed to Checkout
              </Button>
            </Link>

            <Link href="/products" className="block text-center text-sm text-neutral-500 hover:text-neutral-700 mt-4 transition-colors">
              ← Continue Shopping
            </Link>

            
            <div className="mt-5 pt-4 border-t border-[#EBE8D8] flex items-center justify-center gap-4 text-xs text-neutral-400">
              <span>Secure checkout</span>
              <span>•</span>
              <span>7-day returns</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
