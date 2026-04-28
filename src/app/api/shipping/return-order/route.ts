import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { pushReturnOrder, getWarehouses } from "@/services/shipmozo";
import Order from "@/modules/orders/order.model";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const { orderId, return_reason_id, customer_request, reason_comment } =
      await request.json();
    if (!orderId) throw ApiError.badRequest("orderId is required");
    if (!return_reason_id) throw ApiError.badRequest("return_reason_id is required");

    const order = await Order.findById(orderId).populate("user", "name email");
    if (!order) throw ApiError.notFound("Order not found");
    if (order.shipmozoReturnOrderId) {
      throw ApiError.badRequest("Return already initiated for this order");
    }

    // Pickup is the customer's shipping address (we're picking up from
    // the customer back to the warehouse).
    const addr = order.shippingAddress;
    const phone = Number((addr.phone ?? "").replace(/\D/g, "")) || 0;
    const pincode = Number((addr.pincode ?? "").replace(/\D/g, "")) || 0;
    if (!phone) throw ApiError.badRequest("Invalid phone on this order");
    if (!pincode) throw ApiError.badRequest("Invalid pincode on this order");

    const whRes = await getWarehouses();
    if (whRes.result !== "1" || !whRes.data?.length) {
      throw ApiError.badRequest("No warehouses found — add one in Admin > Warehouses");
    }
    const warehouse = whRes.data.find((w) => w.default === "YES") ?? whRes.data[0];

    const productDetail = order.items.map((item) => ({
      name: item.name,
      sku_number: item.product?.toString() ?? "SKU",
      quantity: item.quantity,
      discount: "",
      hsn: "",
      unit_price: item.price,
      product_category: "Other",
    }));

    const result = await pushReturnOrder({
      order_id: `RET-${order.orderNumber}`,
      order_date: new Date().toISOString().slice(0, 10),
      order_type: "ESSENTIALS",
      pickup_name: addr.fullName,
      pickup_phone: phone,
      pickup_email: (order.user as { email?: string } | null)?.email ?? "",
      pickup_address_line_one: addr.addressLine1,
      pickup_address_line_two: addr.addressLine2 ?? "",
      pickup_pin_code: pincode,
      pickup_city: addr.city,
      pickup_state: addr.state,
      product_detail: productDetail,
      payment_type: "PREPAID",
      weight: 500,
      length: 20,
      width: 15,
      height: 10,
      warehouse_id: String(warehouse.id),
      return_reason_id: Number(return_reason_id),
      customer_request: customer_request ?? "RETURN",
      reason_comment: reason_comment ?? "",
    });

    if (result.result !== "1") {
      throw ApiError.badRequest(result.message || "Failed to initiate return");
    }

    order.shipmozoReturnOrderId = result.data.order_id;
    order.shipmozoReturnReferenceId = result.data.reference_id;
    order.returnReason = reason_comment ?? "";
    order.returnedAt = new Date();
    order.orderStatus = "returned";
    await order.save();

    return successResponse(
      { order_id: result.data.order_id, reference_id: result.data.reference_id },
      "Return initiated",
    );
  } catch (err) {
    console.error(
      "[Shipmozo return-order]",
      (err as { response?: { data?: unknown } })?.response?.data ?? (err as Error).message,
    );
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
