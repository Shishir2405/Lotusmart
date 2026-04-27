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
  const order = await Order.findById(orderId).populate("user", "name email phone");
  if (!order) throw new Error("Order not found");

  if (order.shipmozoOrderId) {
    return { status: "skipped", reason: "already pushed" };
  }
  if (order.paymentMethod !== "razorpay" || order.paymentStatus !== "paid") {
    return { status: "skipped", reason: "not a paid prepaid order" };
  }

  const whRes = await getWarehouses();
  if (whRes.result !== "1" || !whRes.data?.length) {
    throw new Error(whRes.message || "No warehouses found — add one in Admin > Warehouses");
  }
  const warehouse = whRes.data.find((w) => w.default === "YES") ?? whRes.data[0];
  const warehouse_id = String(warehouse.id);

  const user = order.user as { email?: string } | null;
  const addr = order.shippingAddress;

  const phone = Number((addr.phone ?? "").replace(/\D/g, "")) || 0;
  const pincode = Number((addr.pincode ?? "").replace(/\D/g, "")) || 0;
  if (!phone) throw new Error("Invalid shipping phone number on this order");
  if (!pincode) throw new Error("Invalid shipping pincode on this order");

  const productDetail = order.items.map((item) => ({
    name: item.name,
    sku_number: item.product?.toString() ?? "SKU",
    quantity: item.quantity,
    discount: "",
    hsn: "",
    unit_price: item.price,
    product_category: "Other",
  }));

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
    warehouse_id,
  });

  if (result.result !== "1") {
    throw new Error(result.message || "Failed to push order to Shipmozo");
  }

  order.shipmozoOrderId = result.data.order_id;
  order.shipmozoReferenceId = result.data.reference_id;
  if (order.orderStatus === "placed") order.orderStatus = "confirmed";
  await order.save();

  return {
    status: "pushed",
    orderId: result.data.order_id,
    referenceId: result.data.reference_id,
  };
}
