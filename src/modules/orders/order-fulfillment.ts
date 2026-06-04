import Product from "@/modules/products/product.model";
import Cart from "@/modules/cart/cart.model";
import Coupon from "@/modules/coupons/coupon.model";
import { sendOrderConfirmation, sendAdminNewOrderAlert } from "@/services/email";
import { Types } from "mongoose";
import type { IOrderDocument } from "./order.model";

/**
 * Atomically decrement stock for each item. The conditional guard prevents
 * overselling under concurrency; if a product genuinely went out of stock
 * between checkout and payment we still decrement (the payment is already
 * committed) and log the oversell so an admin can reconcile.
 */
export async function decrementStock(
  items: { product: unknown; quantity: number; name: string }[],
): Promise<void> {
  for (const it of items) {
    const ok = await Product.findOneAndUpdate(
      { _id: it.product as Types.ObjectId, stock: { $gte: it.quantity } },
      { $inc: { stock: -it.quantity } },
    );
    if (!ok) {
      await Product.findByIdAndUpdate(it.product as Types.ObjectId, { $inc: { stock: -it.quantity } });
      console.warn(`[order] oversold "${it.name}" x${it.quantity} — stock went negative`);
    }
  }
}

/**
 * Side effects that must run exactly once, only when an order is actually paid:
 * decrement stock, clear the cart, bump coupon usage, and email the customer +
 * admin. Called at creation for COD, and at payment-verify for Razorpay, so an
 * abandoned prepaid checkout never consumes stock or burns a coupon.
 */
export async function commitOrderSideEffects(
  order: IOrderDocument,
  customer: { email: string; name: string },
): Promise<void> {
  await decrementStock(
    order.items.map((i) => ({ product: i.product, quantity: i.quantity, name: i.name })),
  );

  await Cart.findOneAndUpdate(
    { user: order.user },
    { $set: { items: [], discount: 0, couponCode: null } },
  );

  if (order.couponCode) {
    await Coupon.updateOne({ code: order.couponCode }, { $inc: { usedCount: 1 } });
  }

  // Await emails (via allSettled) so they aren't dropped when the serverless
  // function freezes on return; failures must not break order completion.
  await Promise.allSettled([
    sendOrderConfirmation(customer.email, customer.name, {
      orderNumber: order.orderNumber,
      items: order.items.map((i) => ({
        name: i.name,
        image: i.image,
        quantity: i.quantity,
        price: i.price,
        variant: i.variant,
      })),
      subtotal: order.subtotal,
      shippingCost: order.shippingCost,
      tax: order.tax,
      total: order.total,
      shippingAddress: order.shippingAddress,
    }),
    sendAdminNewOrderAlert({
      orderNumber: order.orderNumber,
      total: order.total,
      customerName: customer.name || customer.email,
      paymentMethod: order.paymentMethod,
      itemCount: order.items.length,
    }),
  ]);
}
