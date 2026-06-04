import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse, paginatedResponse } from "@/lib/api-response";
import Order from "@/modules/orders/order.model";
import Cart from "@/modules/cart/cart.model";
import Product from "@/modules/products/product.model";
import Coupon from "@/modules/coupons/coupon.model";
import { commitOrderSideEffects } from "@/modules/orders/order-fulfillment";

interface RawItem {
  product: string;
  name: string;
  image?: string;
  quantity: number;
  price: number;
  variant?: unknown;
}

interface CartItemPopulated {
  product: {
    _id: { toString(): string };
    name: string;
    images?: string[];
    isActive: boolean;
  };
  quantity: number;
  price: number;
  variant?: { name: string; value: string };
}

interface OrderItemInput {
  product: string;
  name: string;
  image: string;
  quantity: number;
  price: number;
  variant?: string;
  sku?: string;
}

// Coerce a variant (which the client sends as an object) to the string the
// OrderItem schema expects — otherwise Mongoose throws a CastError.
function normalizeVariant(v: unknown): string | undefined {
  if (!v) return undefined;
  if (typeof v === "string") return v.trim() || undefined;
  if (typeof v === "object") {
    const o = v as { name?: string; value?: string };
    if (o.name && o.value) return `${o.name}: ${o.value}`;
    if (o.value) return o.value;
  }
  return undefined;
}

// Re-validate a coupon and recompute its discount server-side (mirrors
// /api/coupons/validate) so a forged/altered client discount is never trusted.
async function computeCouponDiscount(
  code: string,
  subtotal: number,
): Promise<{ discount: number; code: string }> {
  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() }).lean();
  if (!coupon) throw ApiError.badRequest("Invalid coupon code");
  if (!coupon.isActive) throw ApiError.badRequest("This coupon is no longer active");
  const now = new Date();
  if (now < coupon.validFrom) throw ApiError.badRequest("This coupon is not yet valid");
  if (now > coupon.validUntil) throw ApiError.badRequest("This coupon has expired");
  if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit)
    throw ApiError.badRequest("This coupon has reached its usage limit");
  if (coupon.minOrderValue && subtotal < coupon.minOrderValue)
    throw ApiError.badRequest(
      `Minimum order value of ₹${coupon.minOrderValue} required for this coupon`,
    );
  let discount =
    coupon.discountType === "percentage"
      ? (subtotal * coupon.discountValue) / 100
      : coupon.discountValue;
  if (coupon.maxDiscountAmount) discount = Math.min(discount, coupon.maxDiscountAmount);
  discount = Math.min(discount, subtotal);
  return { discount: Math.round(discount * 100) / 100, code: coupon.code };
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);
    const { searchParams } = new URL(request.url);

    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.min(50, Number(searchParams.get("limit") ?? 10));
    const status = searchParams.get("status");

    const query: Record<string, unknown> = { user: authUser.userId };
    if (status) query.orderStatus = status;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Order.countDocuments(query),
    ]);

    return paginatedResponse(orders, { page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const authUser = await requireAuth(request);

    const body = await request.json();
    const { shippingAddress, billingAddress, paymentMethod, notes, items: clientItems, couponCode } = body;

    if (!shippingAddress) throw ApiError.badRequest("Shipping address is required");
    if (paymentMethod !== "razorpay" && paymentMethod !== "cod")
      throw ApiError.badRequest("Invalid payment method");

    // 1. Resolve raw items — client payload, or fall back to the server cart.
    let rawItems: RawItem[] | undefined = clientItems;
    if (!rawItems || rawItems.length === 0) {
      const cart = await Cart.findOne({ user: authUser.userId }).populate(
        "items.product",
        "name price stock isActive sku images",
      );
      if (!cart || cart.items.length === 0) throw ApiError.badRequest("Cart is empty");
      rawItems = (cart.items as CartItemPopulated[])
        .filter((i) => i.product?.isActive)
        .map((i) => ({
          product: i.product._id.toString(),
          name: i.product.name,
          image: i.product.images?.[0],
          quantity: i.quantity,
          price: i.price,
          variant: i.variant,
        }));
    }
    if (!rawItems || rawItems.length === 0)
      throw ApiError.badRequest("No valid items in order");

    // 2. Validate + enrich each item authoritatively from the DB: stock check,
    //    real SKU + image, and variant coerced to a string for the schema.
    const orderItems: OrderItemInput[] = [];
    for (const item of rawItems) {
      const product = await Product.findById(item.product)
        .select("stock name sku images isActive")
        .lean();
      if (!product || !product.isActive)
        throw ApiError.badRequest(`Product not found: ${item.name}`);
      if (product.stock < item.quantity)
        throw ApiError.badRequest(`Insufficient stock for "${product.name}"`);
      orderItems.push({
        product: String(item.product),
        name: product.name,
        image: item.image || product.images?.[0] || "",
        quantity: item.quantity,
        price: item.price,
        variant: normalizeVariant(item.variant),
        sku: product.sku ?? undefined,
      });
    }

    // 3. Totals — recompute the coupon discount server-side; never trust the
    //    client-sent discount.
    const subtotal = orderItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
    // Prepaid (Razorpay) ships free; COD has a flat ₹100 handling fee.
    const shippingCost = paymentMethod === "cod" ? 100 : 0;
    const tax = 0;
    let discount = 0;
    let appliedCoupon: string | undefined;
    if (couponCode) {
      const applied = await computeCouponDiscount(String(couponCode), subtotal);
      discount = applied.discount;
      appliedCoupon = applied.code;
    }
    const total = Math.max(0, subtotal + shippingCost - discount);

    // 4. Create the order as pending. Stock/cart/coupon/email side effects run
    //    only once the order is actually paid — immediately for COD, and at
    //    payment-verify for Razorpay — so an abandoned prepaid checkout never
    //    consumes stock or burns a coupon.
    const order = await Order.create({
      user: authUser.userId,
      items: orderItems,
      shippingAddress,
      billingAddress: billingAddress ?? shippingAddress,
      paymentMethod,
      paymentStatus: "pending",
      orderStatus: "placed",
      subtotal,
      shippingCost,
      tax,
      discount,
      couponCode: appliedCoupon,
      total,
      notes,
    });

    if (paymentMethod === "cod") {
      await commitOrderSideEffects(order, {
        email: authUser.email,
        name: authUser.name ?? "Customer",
      });
    }

    return successResponse(order, "Order placed successfully", 201);
  } catch (err) {
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
