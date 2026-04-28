import { pushOrder, getWarehouses } from "@/services/shipmozo";
import Order from "@/modules/orders/order.model";

export type PushOutcome =
  | { status: "pushed"; orderId: string; referenceId: string }
  | { status: "skipped"; reason: string };

/**
 * Pushes an Order to Shipmozo as a PREPAID draft. Idempotent — safe to call
 * twice; the second call returns { status: "skipped" }. Throws on validation
 * or Shipmozo API failure so callers can decide whether to surface or swallow.
 */
export async function pushOrderToShipmozo(orderId: string): Promise<PushOutcome> {
  console.log("[shipmozo-push] start", orderId);

  const order = await Order.findById(orderId).populate("user", "name email phone");
  if (!order) {
    console.error("[shipmozo-push] order not found", orderId);
    throw new Error("Order not found");
  }

  console.log("[shipmozo-push] order loaded", {
    orderNumber: order.orderNumber,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    orderStatus: order.orderStatus,
    alreadyPushed: !!order.shipmozoOrderId,
  });

  if (order.shipmozoOrderId) {
    console.log("[shipmozo-push] skip: already pushed", order.shipmozoOrderId);
    return { status: "skipped", reason: "already pushed" };
  }
  if (order.paymentMethod !== "razorpay" || order.paymentStatus !== "paid") {
    console.log("[shipmozo-push] skip: not a paid prepaid order", {
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
    });
    return { status: "skipped", reason: "not a paid prepaid order" };
  }

  console.log("[shipmozo-push] fetching warehouses…");
  const whRes = await getWarehouses();
  console.log("[shipmozo-push] warehouses response", {
    result: whRes.result,
    message: whRes.message,
    count: whRes.data?.length ?? 0,
  });
  if (whRes.result !== "1" || !whRes.data?.length) {
    throw new Error(whRes.message || "No warehouses found — add one in Admin > Warehouses");
  }
  const warehouse = whRes.data.find((w) => w.default === "YES") ?? whRes.data[0];
  const warehouse_id = String(warehouse.id);
  console.log("[shipmozo-push] selected warehouse", {
    id: warehouse_id,
    title: warehouse.address_title,
    default: warehouse.default,
  });

  const user = order.user as { email?: string } | null;
  const addr = order.shippingAddress;

  const phone = Number((addr.phone ?? "").replace(/\D/g, "")) || 0;
  const pincode = Number((addr.pincode ?? "").replace(/\D/g, "")) || 0;
  if (!phone) {
    console.error("[shipmozo-push] invalid phone", addr.phone);
    throw new Error("Invalid shipping phone number on this order");
  }
  if (!pincode) {
    console.error("[shipmozo-push] invalid pincode", addr.pincode);
    throw new Error("Invalid shipping pincode on this order");
  }

  const productDetail = order.items.map((item) => ({
    name: item.name,
    sku_number: item.product?.toString() ?? "SKU",
    quantity: item.quantity,
    discount: "",
    hsn: "",
    unit_price: item.price,
    product_category: "Other",
  }));

  const payload = {
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
    payment_type: "PREPAID" as const,
    cod_amount: "",
    weight: 500,
    length: 20,
    width: 15,
    height: 10,
    warehouse_id,
  };

  console.log("[shipmozo-push] calling pushOrder", {
    orderNumber: payload.order_id,
    items: productDetail.length,
    warehouse_id,
    pincode,
  });

  const result = await pushOrder(payload);
  console.log("[shipmozo-push] pushOrder response", {
    result: result.result,
    message: result.message,
    data: result.data,
  });

  if (result.result !== "1") {
    throw new Error(result.message || "Failed to push order to Shipmozo");
  }

  order.shipmozoOrderId = result.data.order_id;
  order.shipmozoReferenceId = result.data.reference_id;
  if (order.orderStatus === "placed") order.orderStatus = "confirmed";
  await order.save();
  console.log("[shipmozo-push] order updated with shipmozo IDs", {
    orderNumber: order.orderNumber,
    shipmozoOrderId: result.data.order_id,
    referenceId: result.data.reference_id,
  });

  return {
    status: "pushed",
    orderId: result.data.order_id,
    referenceId: result.data.reference_id,
  };
}
