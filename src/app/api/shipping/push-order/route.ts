import { NextRequest } from "next/server";
import connectDB from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { ApiError } from "@/lib/api-error";
import { successResponse, errorResponse } from "@/lib/api-response";
import { pushOrder, getWarehouses } from "@/services/shipmozo";
import Order from "@/modules/orders/order.model";

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(request);

    const { orderId } = await request.json();
    if (!orderId) throw ApiError.badRequest("orderId is required");

    // Auto-resolve warehouse: fetch from Shipmozo, pick default or first
    const whRes = await getWarehouses();
    if (whRes.result !== "1" || !whRes.data?.length) {
      throw ApiError.badRequest(whRes.message || "No warehouses found — add one in Admin > Warehouses");
    }
    const warehouse = whRes.data.find((w) => w.default === "YES") ?? whRes.data[0];
    const warehouse_id = String(warehouse.id);

    const order = await Order.findById(orderId).populate("user", "name email phone");
    if (!order) throw ApiError.notFound("Order not found");

    const user = order.user as any;
    const addr = order.shippingAddress;

    // Sanitize phone: keep only digits (strip +91, spaces, dashes)
    const rawPhone = (addr.phone ?? "").replace(/\D/g, "");
    const phone = Number(rawPhone) || 0;
    const pincode = Number((addr.pincode ?? "").replace(/\D/g, "")) || 0;

    if (!phone) throw ApiError.badRequest("Invalid shipping phone number on this order");
    if (!pincode) throw ApiError.badRequest("Invalid shipping pincode on this order");

    const productDetail = order.items.map((item: any) => ({
      name: item.name,
      sku_number: item.product?.toString() ?? "SKU",
      quantity: item.quantity,
      discount: "",
      hsn: "",
      unit_price: item.price,
      product_category: "Other",
    }));

    console.log("[Shipmozo push-order] Pushing order", order.orderNumber, "warehouse:", warehouse_id);

    const result = await pushOrder({
      order_id: order.orderNumber,
      order_date: new Date(order.createdAt).toISOString().slice(0, 10),
      order_type: "ESSENTIALS",
      consignee_name: addr.fullName,
      consignee_phone: phone,
      consignee_email: user?.email ?? "",
      consignee_address_line_one: addr.addressLine1,
      consignee_address_line_two: addr.addressLine2 ?? "",
      consignee_pin_code: pincode,
      consignee_city: addr.city,
      consignee_state: addr.state,
      product_detail: productDetail,
      payment_type: "PREPAID",
      cod_amount: "",
      weight: 500,
      length: 20,
      width: 15,
      height: 10,
      warehouse_id: warehouse_id,
    });

    if (result.result !== "1") {
      throw ApiError.badRequest(result.message || "Failed to push order to Shipmozo");
    }

    order.shipmozoOrderId = result.data.order_id;
    order.shipmozoReferenceId = result.data.reference_id;
    if (order.orderStatus === "placed") order.orderStatus = "confirmed";
    await order.save();

    return successResponse(result.data, "Order pushed to Shipmozo");
  } catch (err) {
    console.error("[Shipmozo push-order]", (err as any)?.response?.data ?? (err as Error).message);
    const e = ApiError.from(err);
    return errorResponse(e.message, e.statusCode);
  }
}
