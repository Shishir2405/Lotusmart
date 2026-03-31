

import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import Cart from "@/modules/cart/cart.model";
import Product from "@/modules/products/product.model";
import type { CartItem } from "@/store/cart.store";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);

    const body = await request.json();
    const localItems: CartItem[] = body.localItems ?? [];
    const deviceId: string | undefined = body.deviceId;

    
    let cart = await Cart.findOne({ user: authUser.userId });
    if (!cart) {
      cart = await Cart.create({ user: authUser.userId, items: [], discount: 0 });
    }

    
    if (deviceId) {
      const anonCart = await Cart.findOne({ deviceId });
      if (anonCart && anonCart.items.length > 0) {
        for (const anonItem of anonCart.items) {
          const productId = anonItem.product.toString();
          const product = await Product.findById(productId).select("price stock isActive").lean();
          if (!product || !product.isActive || product.stock < 1) continue;

          
          const existingIdx = (cart.items as any[]).findIndex(
            (i: { product: { toString: () => string }; variant?: string }) =>
              i.product.toString() === productId && i.variant === anonItem.variant,
          );

          if (existingIdx >= 0) {
            cart.items[existingIdx].quantity = Math.min(
              Math.max(cart.items[existingIdx].quantity, anonItem.quantity),
              product.stock,
            );
          } else {
            
            (cart.items as any[]).push({
              product: productId,
              quantity: Math.min(anonItem.quantity, product.stock),
              variant: anonItem.variant,
              price: product.price,
            });
          }
        }
        
        await Cart.deleteOne({ _id: anonCart._id });
      }
    }

    
    for (const local of localItems) {
      if (!local.productId || local.quantity < 1) continue;

      const product = await Product.findById(local.productId)
        .select("price stock isActive")
        .lean();
      if (!product || !product.isActive || product.stock < 1) continue;

      
      const existingIdx = (cart.items as any[]).findIndex(
        (i: { product: { toString: () => string }; variant?: { name: string; value: string } }) =>
          i.product.toString() === local.productId &&
          JSON.stringify(i.variant) === JSON.stringify(local.variant),
      );

      if (existingIdx >= 0) {
        cart.items[existingIdx].quantity = Math.min(
          Math.max(cart.items[existingIdx].quantity, local.quantity),
          product.stock,
        );
      } else {
        
        (cart.items as any[]).push({
          product: local.productId,
          quantity: Math.min(local.quantity, product.stock),
          variant: local.variant ?? undefined,
          price: product.price,
        });
      }
    }

    await cart.save();

    
    const populated = await Cart.findById(cart._id).populate(
      "items.product",
      "name slug images price compareAtPrice stock unit isActive",
    );

    
    const rawItems: any[] = populated?.items ?? [];
    const items: CartItem[] = rawItems
      .filter((i: { product: { isActive: boolean; stock: number } }) => i.product?.isActive && i.product?.stock > 0)
      .map((i: {
        product: {
          _id: { toString: () => string };
          name: string;
          slug: string;
          images: string[];
          price: number;
          compareAtPrice?: number;
          stock: number;
          unit: string;
        };
        quantity: number;
        variant?: { name: string; value: string };
        price: number;
      }) => ({
        productId: i.product._id.toString(),
        name: i.product.name,
        slug: i.product.slug,
        image: i.product.images?.[0] ?? "",
        price: i.price,
        compareAtPrice: i.product.compareAtPrice,
        quantity: i.quantity,
        variant: i.variant,
        stock: i.product.stock,
        unit: i.product.unit,
      }));

    return successResponse({ items }, "Cart merged successfully");
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
