// Public, unauthenticated feed powering the "someone recently bought this"
// social-proof toast.
//
// PRIVACY CONTRACT — this endpoint is readable by anyone, so it deliberately
// emits the absolute minimum: a customer's FIRST NAME and CITY only. It never
// returns full names, emails, phones, street addresses, pincodes, user ids,
// order ids, order numbers or order totals. Results are also de-duplicated by
// customer so a visitor can never correlate two entries back to one person.

import { ApiError } from "@/lib/api-error";
import { errorResponse, successResponse } from "@/lib/api-response";
import connectDB from "@/lib/db";
import Order from "@/modules/orders/order.model";
import Product from "@/modules/products/product.model";

// Cached at the edge for 5 minutes so a traffic spike doesn't hammer Mongo —
// every visitor on the site hits this once per page load.
export const revalidate = 300;

/** Max entries handed to the client. */
const MAX_RESULTS = 20;
/** How many recent orders we scan to fill MAX_RESULTS after de-duplication. */
const SCAN_LIMIT = 200;
/** Ignore anything older than this — "bought 4 months ago" is not social proof. */
const MAX_AGE_DAYS = 30;
/** Defensive truncation on the two free-text fields we echo back. */
const MAX_NAME_LEN = 14;
const MAX_CITY_LEN = 28;

const NAME_FALLBACK = "A customer";
const CITY_FALLBACK = "India";

export interface RecentPurchaseEntry {
  firstName: string;
  city: string;
  productName: string;
  productSlug: string;
  /** Canonical id used for the product URL (/products/<id>). Not customer data. */
  productId: string;
  productImage: string | null;
  minutesAgo: number;
}

/**
 * First token of a name only, letters/spaces stripped of anything exotic, and
 * truncated. "Priya Sharma Verma" -> "Priya". Never the surname.
 */
function toFirstName(fullName: unknown): string {
  if (typeof fullName !== "string") return NAME_FALLBACK;
  const first = fullName.trim().split(/\s+/)[0] ?? "";
  const cleaned = first.replace(/[^\p{L}\p{M}'-]/gu, "").slice(0, MAX_NAME_LEN);
  if (cleaned.length < 2) return NAME_FALLBACK;
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function toCity(city: unknown): string {
  if (typeof city !== "string") return CITY_FALLBACK;
  const cleaned = city.trim().replace(/\s+/g, " ").slice(0, MAX_CITY_LEN);
  if (cleaned.length < 2) return CITY_FALLBACK;
  return cleaned;
}

export async function GET() {
  try {
    await connectDB();

    const since = new Date(Date.now() - MAX_AGE_DAYS * 24 * 60 * 60 * 1000);

    // Only orders that actually represent a completed purchase intent:
    //  - orderStatus excludes "cancelled" and "returned"
    //  - COD orders count as soon as they are placed
    //  - prepaid (razorpay) orders only count once payment is confirmed, which
    //    filters out abandoned "pending" and "failed" checkouts, plus refunds.
    const orders = await Order.find({
      createdAt: { $gte: since },
      orderStatus: { $in: ["placed", "confirmed", "processing", "shipped", "delivered"] },
      $or: [{ paymentMethod: "cod" }, { paymentStatus: "paid" }],
    })
      // Narrow projection: we never even load email/phone/total into memory.
      .select("items.product items.name shippingAddress.fullName shippingAddress.city user createdAt")
      .sort({ createdAt: -1 })
      .limit(SCAN_LIMIT)
      .lean();

    // One entry per customer at most. This is what makes the feed
    // non-correlatable: no visitor can see two purchases by the same person.
    const seenCustomers = new Set<string>();
    const candidates: Array<{
      productId: string;
      fallbackName: string;
      firstName: string;
      city: string;
      createdAt: Date;
    }> = [];

    for (const order of orders) {
      if (candidates.length >= MAX_RESULTS) break;

      const customerKey = order.user ? String(order.user) : null;
      if (!customerKey || seenCustomers.has(customerKey)) continue;

      const item = order.items?.find((i) => i?.product);
      if (!item?.product) continue;

      seenCustomers.add(customerKey);
      candidates.push({
        productId: String(item.product),
        fallbackName: typeof item.name === "string" ? item.name : "",
        firstName: toFirstName(order.shippingAddress?.fullName),
        city: toCity(order.shippingAddress?.city),
        createdAt: order.createdAt as Date,
      });
    }

    if (candidates.length === 0) {
      return successResponse<RecentPurchaseEntry[]>([], "Success");
    }

    // Resolve products in one round-trip. Anything delisted since the order was
    // placed is dropped so the toast never links to a dead product page.
    const products = await Product.find({
      _id: { $in: candidates.map((c) => c.productId) },
      isActive: true,
    })
      .select("_id name slug images")
      .lean();

    const productMap = new Map(
      products.map((p) => [String(p._id), p] as const),
    );

    const now = Date.now();
    const data: RecentPurchaseEntry[] = [];

    for (const candidate of candidates) {
      const product = productMap.get(candidate.productId);
      if (!product) continue;

      const createdAtMs = new Date(candidate.createdAt).getTime();
      const minutesAgo = Number.isFinite(createdAtMs)
        ? Math.max(1, Math.floor((now - createdAtMs) / 60000))
        : 1;

      data.push({
        firstName: candidate.firstName,
        city: candidate.city,
        productName: product.name || candidate.fallbackName || "a LotusMart favourite",
        productSlug: product.slug ?? "",
        productId: String(product._id),
        productImage: product.images?.[0] ?? null,
        minutesAgo,
      });
    }

    const response = successResponse<RecentPurchaseEntry[]>(data);
    response.headers.set(
      "Cache-Control",
      "public, s-maxage=300, stale-while-revalidate=600",
    );
    return response;
  } catch (error) {
    const apiError = ApiError.from(error);
    return errorResponse(apiError.message, apiError.statusCode, apiError.errors);
  }
}
