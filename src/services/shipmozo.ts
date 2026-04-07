import axios, { AxiosInstance } from "axios";

const BASE_URL = (process.env.SHIPMOZO_BASE_URL ?? "https://shipping-api.com/app/api/v1").replace(/\/$/, "");

function client(): AxiosInstance {
  return axios.create({
    baseURL: BASE_URL,
    headers: {
      "public-key": process.env.SHIPMOZO_PUBLIC_KEY ?? "",
      "private-key": process.env.SHIPMOZO_PRIVATE_KEY ?? "",
      "Content-Type": "application/json",
    },
  });
}

/* ─── Info ─── */

export async function checkApiStatus() {
  const api = client();
  const res = await api.get("/info");
  return res.data as { result: string; message: string; data: { Info: string } };
}

/* ─── Push Order ─── */

export interface ShipmozoOrderPayload {
  order_id: string;
  order_date: string; // YYYY-MM-DD
  order_type?: string;
  consignee_name: string;
  consignee_phone: number;
  consignee_alternate_phone?: number;
  consignee_email?: string;
  consignee_address_line_one: string;
  consignee_address_line_two?: string;
  consignee_pin_code: number;
  consignee_city: string;
  consignee_state: string;
  product_detail: Array<{
    name: string;
    sku_number: string;
    quantity: number;
    discount?: string;
    hsn?: string;
    unit_price: number;
    product_category?: string;
  }>;
  payment_type: "PREPAID" | "COD";
  cod_amount?: string;
  weight: number; // grams
  length: number;
  width: number;
  height: number;
  warehouse_id: string;
  gst_ewaybill_number?: string;
  gstin_number?: string;
}

export async function pushOrder(payload: ShipmozoOrderPayload) {
  const api = client();
  const res = await api.post("/push-order", payload);
  return res.data as {
    result: string;
    message: string;
    data: { Info: string; order_id: string; reference_id: string };
  };
}

/* ─── Push Return Order ─── */

export interface ShipmozoReturnOrderPayload {
  order_id: string;
  order_date: string;
  order_type?: string;
  pickup_name: string;
  pickup_phone: number;
  pickup_email?: string;
  pickup_address_line_one: string;
  pickup_address_line_two?: string;
  pickup_pin_code: number;
  pickup_city: string;
  pickup_state: string;
  product_detail: Array<{
    name: string;
    sku_number: string;
    quantity: number;
    discount?: string;
    hsn?: string;
    unit_price: number;
    product_category?: string;
  }>;
  payment_type: string;
  weight: number;
  length: number;
  width: number;
  height: number;
  warehouse_id?: string;
  return_reason_id: number;
  customer_request: string;
  reason_comment?: string;
}

export async function pushReturnOrder(payload: ShipmozoReturnOrderPayload) {
  const api = client();
  const res = await api.post("/push-return-order", payload);
  return res.data as {
    result: string;
    message: string;
    data: { Info: string; order_id: string; reference_id: string };
  };
}

/* ─── Assign Courier ─── */

export async function assignCourier(orderId: string, courierId: number) {
  const api = client();
  const res = await api.post("/assign-courier", {
    order_id: orderId,
    courier_id: courierId,
  });
  return res.data as {
    result: string;
    message: string;
    data: { order_id: string; reference_id: string; courier: string };
  };
}

/* ─── Auto-Assign Order ─── */

export async function autoAssignOrder(orderId: string) {
  const api = client();
  const res = await api.post("/auto-assign-order", { order_id: orderId });
  return res.data as {
    result: string;
    message: string;
    data: {
      order_id: string;
      reference_id: string;
      awb_number: string;
      courier_company: string;
      courier_company_service: string;
    };
  };
}

/* ─── Schedule Pickup ─── */

export async function schedulePickup(orderId: string) {
  const api = client();
  const res = await api.post("/schedule-pickup", { order_id: orderId });
  return res.data as {
    result: string;
    message: string;
    data: {
      order_id: string;
      reference_id: string;
      courier: string;
      awb_number: string;
      lr_number: string;
    };
  };
}

/* ─── Cancel Order ─── */

export async function cancelShipmozoOrder(orderId: string, awbNumber: number) {
  const api = client();
  const res = await api.post("/cancel-order", {
    order_id: orderId,
    awb_number: awbNumber,
  });
  return res.data as {
    result: string;
    message: string;
    data: { order_id: string; reference_id: string };
  };
}

/* ─── Get Order Detail ─── */

export async function getOrderDetail(orderId: string) {
  const api = client();
  const res = await api.get(`/get-order-detail/${orderId}`);
  return res.data;
}

/* ─── Rate Calculator ─── */

export interface RateCalculatorParams {
  order_id?: string;
  pickup_pincode: number;
  delivery_pincode: number;
  payment_type: "PREPAID" | "COD";
  shipment_type: "FORWARD" | "RETURN";
  order_amount: number;
  type_of_package?: string;
  rov_type?: string;
  cod_amount?: string;
  weight: number; // grams
  dimensions: Array<{
    no_of_box: string;
    length: string;
    width: string;
    height: string;
  }>;
}

export async function calculateRates(params: RateCalculatorParams) {
  const api = client();
  const res = await api.post("/rate-calculator", params);
  return res.data;
}

/* ─── Pincode Serviceability ─── */

export async function checkPincodeServiceability(
  pickupPincode: number,
  deliveryPincode: number,
) {
  const api = client();
  const res = await api.post("/pincode-serviceability", {
    pickup_pincode: pickupPincode,
    delivery_pincode: deliveryPincode,
  });
  return res.data as {
    result: string;
    message: string;
    data: { serviceable: boolean };
  };
}

/* ─── Track Order ─── */

export async function trackOrder(awbNumber: string) {
  const api = client();
  const res = await api.get("/track-order", {
    params: { awb_number: awbNumber },
  });
  return res.data as {
    result: string;
    message: string;
    data: {
      order_id: string;
      reference_id: string;
      awb_number: string;
      courier: string;
      expected_delivery_date: string | null;
      current_status: string;
      status_time: string | null;
      scan_detail: Array<{
        date: string;
        activity: string;
        location: string;
      }>;
    };
  };
}

/* ─── Get Order Label ─── */

export async function getOrderLabel(awbNumber: string) {
  const api = client();
  const res = await api.get(`/get-order-label/${awbNumber}`);
  return res.data as {
    result: string;
    message: string;
    data: Array<{ label: string; created_at: string }>;
  };
}

/* ─── Get Return Reasons ─── */

export async function getReturnReasons() {
  const api = client();
  const res = await api.get("/get-return-reason");
  return res.data as {
    result: string;
    message: string;
    data: Array<{ id: number; title: string }>;
  };
}

/* ─── Warehouse APIs ─── */

export interface CreateWarehousePayload {
  address_title: string;
  name?: string;
  phone?: number;
  alternate_phone?: number;
  email?: string;
  address_line_one: string;
  address_line_two?: string;
  pin_code: number;
}

export async function createWarehouse(payload: CreateWarehousePayload) {
  const api = client();
  const res = await api.post("/create-warehouse", payload);
  return res.data as {
    result: string;
    message: string;
    data: { warehouse_id: string };
  };
}

export async function updateWarehouse(orderId: string, warehouseId: number) {
  const api = client();
  const res = await api.post("/order/update-warehouse", {
    order_id: orderId,
    warehouse_id: warehouseId,
  });
  return res.data as {
    result: string;
    message: string;
    data: { order_id: string; reference_id: string };
  };
}

export async function getWarehouses() {
  const api = client();
  const res = await api.get("/get-warehouses");
  return res.data as {
    result: string;
    message: string;
    data: Array<{
      id: number;
      default: string;
      address_title: string;
      name: string;
      email: string;
      phone: string;
      alt_phone: string;
      address_line_one: string;
      address_line_two: string;
      pincode: string;
      city: string;
      state: string;
      country: string;
      status: string;
    }>;
  };
}
