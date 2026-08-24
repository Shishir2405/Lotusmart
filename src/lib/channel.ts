import { NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth";

export type Channel = "app" | "website";

/**
 * The mobile app's shared axios instance (Lotusmart-app/src/services/api.ts)
 * sends this header on every request. The website never sends it, so its
 * presence is what tells the two storefronts apart on a REST route they both
 * hit (e.g. /api/products, /api/products/search).
 */
const APP_HEADER = "x-requested-with";
const APP_HEADER_VALUE = "LotusApp";

export function getChannel(request: NextRequest): Channel {
  return request.headers.get(APP_HEADER) === APP_HEADER_VALUE ? "app" : "website";
}

/**
 * Mongo filter clause restricting a products query to what the requesting
 * channel is allowed to browse — {} (no restriction) for an authenticated
 * admin, who always needs to see the full catalog regardless of channel.
 *
 * Merge the result into a query object: `{ ...baseQuery, ...(await channelProductFilter(request)) }`.
 */
export async function channelProductFilter(
  request: NextRequest,
): Promise<Record<string, unknown>> {
  const user = await getAuthUser(request);
  if (user?.role === "admin") return {};

  const field = getChannel(request) === "app" ? "showOnApp" : "showOnWebsite";
  return { [field]: { $ne: false } };
}
