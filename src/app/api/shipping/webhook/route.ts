import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { successResponse, errorResponse } from "@/lib/api-response";
import Order from "@/modules/orders/order.model";
import type { OrderStatus } from "@/types";

// Map Shipmozo status strings → our OrderStatus enum. Shipmozo sends a variety
// of labels; normalise to lowercase and bucket them.
function mapStatus(raw: string): OrderStatus | null {
  const s = (raw || "").toLowerCase().trim();
  if (!s) return null;
  if (/deliver/.test(s)) return "delivered";
  if (/(rto|return)/.test(s)) return "returned";
  if (/cancel/.test(s)) return "cancelled";
  if (/(out for delivery|in[ -]?transit|shipped|dispatch|pick.?up|manifest)/.test(s)) return "shipped";
  if (/(ready|processing|booked|confirm)/.test(s)) return "processing";
  return null; // unknown → leave orderStatus untouched
}

export async function POST(request: NextRequest) {
  try {
    // Shared-secret auth (Shipmozo callbacks carry no JWT). Accept ?token= or
    // x-webhook-token header. If a secret is configured, enforce it.
    const secret = process.env.SHIPMOZO_WEBHOOK_SECRET;
    if (secret) {
      const provided =
        request.nextUrl.searchParams.get("token") ||
        request.headers.get("x-webhook-token") ||
        "";
      if (provided !== secret) return errorResponse("Unauthorized", 401);
    }

    await connectDB();
    const body = await request.json().catch(() => ({}));
    const data = (body?.data ?? body) as Record<string, unknown>;

    // Tolerant extraction — Shipmozo nests inconsistently and misspells
    // "reference" as "refrence".
    const get = (...keys: string[]): string => {
      for (const k of keys) {
        const v = data[k] ?? (body as Record<string, unknown>)[k];
        if (v != null && v !== "") return String(v);
      }
      return "";
    };

    const shipmozoOrderId = get("order_id", "shipmozo_order_id");
    const referenceId = get("reference_id", "refrence_id");
    const awb = get("awb_number", "awb");
    const ourOrderNumber = get("client_order_id", "seller_order_id", "order_number");
    const statusRaw = get("current_status", "status", "shipment_status");
    const courier = get("courier", "courier_company", "courier_name");
    const edd = get("expected_delivery_date", "edd", "estimated_delivery");
    const deliveredOn = get("delivered_date", "delivered_at");

    const or: Record<string, unknown>[] = [];
    if (shipmozoOrderId) or.push({ shipmozoOrderId });
    if (referenceId) or.push({ shipmozoReferenceId: referenceId });
    if (awb) or.push({ awbNumber: awb });
    if (ourOrderNumber) or.push({ orderNumber: ourOrderNumber });
    if (or.length === 0) return errorResponse("No order identifier in payload", 400);

    const order = await Order.findOne({ $or: or });
    if (!order) {
      // 200 so Shipmozo doesn't endlessly retry for an order we don't have.
      return successResponse({ matched: false }, "No matching order");
    }

    if (awb && !order.awbNumber) order.awbNumber = awb;
    if (courier && !order.courierCompany) order.courierCompany = courier;
    if (edd) {
      const d = new Date(edd);
      if (!isNaN(d.getTime())) order.estimatedDelivery = d;
    }

    const mapped = mapStatus(statusRaw);
    if (mapped) {
      order.orderStatus = mapped;
      if (mapped === "delivered") {
        const d = deliveredOn ? new Date(deliveredOn) : new Date();
        order.deliveredAt = isNaN(d.getTime()) ? new Date() : d;
      }
    }

    await order.save();
    console.log("[shipping/webhook] updated", {
      orderNumber: order.orderNumber,
      statusRaw,
      mapped,
      awb: order.awbNumber,
    });

    return successResponse(
      { matched: true, orderNumber: order.orderNumber, orderStatus: order.orderStatus },
      "Order updated",
    );
  } catch (err) {
    console.error("[shipping/webhook] error", (err as Error)?.message ?? err);
    return errorResponse("Webhook processing failed", 500);
  }
}
