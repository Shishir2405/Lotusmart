/**
 * Shiprocket Shipping Service
 * Handles order creation, AWB generation, label generation, and tracking.
 */

import axios, { AxiosInstance } from "axios";

const BASE_URL = process.env.SHIPROCKET_API_URL ?? "https://apiv2.shiprocket.in/v1/external";

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;

  const res = await axios.post(`${BASE_URL}/auth/login`, {
    email: process.env.SHIPROCKET_EMAIL,
    password: process.env.SHIPROCKET_PASSWORD,
  });

  cachedToken = res.data.token as string;
  tokenExpiry = Date.now() + 9 * 60 * 60 * 1000; // re-auth every 9 hours
  return cachedToken;
}

async function client(): Promise<AxiosInstance> {
  const token = await getToken();
  return axios.create({
    baseURL: BASE_URL,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
}

// ─── Types ─────────────────────────────────────────────────────────────────────

export interface ShiprocketOrderPayload {
  order_id: string;
  order_date: string; // "YYYY-MM-DD HH:mm"
  pickup_location: string;
  channel_id?: string;
  billing_customer_name: string;
  billing_last_name?: string;
  billing_address: string;
  billing_city: string;
  billing_pincode: string;
  billing_state: string;
  billing_country: string;
  billing_email: string;
  billing_phone: string;
  shipping_is_billing: boolean;
  order_items: Array<{
    name: string;
    sku: string;
    units: number;
    selling_price: number;
    discount?: number;
    tax?: string;
    hsn?: number;
  }>;
  payment_method: "Prepaid" | "COD";
  sub_total: number;
  length: number;
  breadth: number;
  height: number;
  weight: number;
}

// ─── API calls ────────────────────────────────────────────────────────────────

export async function createShiprocketOrder(payload: ShiprocketOrderPayload) {
  const api = await client();
  const res = await api.post("/orders/create/adhoc", payload);
  return res.data as { order_id: number; shipment_id: number; status: string };
}

export async function assignAWB(shipmentId: number, courierId?: number) {
  const api = await client();
  const res = await api.post("/courier/assign/awb", {
    shipment_id: String(shipmentId),
    ...(courierId ? { courier_id: String(courierId) } : {}),
  });
  return res.data;
}

export async function generateLabel(shipmentId: number) {
  const api = await client();
  const res = await api.post("/courier/generate/label", {
    shipment_id: [shipmentId],
  });
  return res.data as { label_url: string };
}

export async function trackShipment(shipmentId: number) {
  const api = await client();
  const res = await api.get(`/courier/track/shipment/${shipmentId}`);
  return res.data;
}

export async function trackByAWB(awb: string) {
  const api = await client();
  const res = await api.get(`/courier/track/awb/${awb}`);
  return res.data;
}

export async function getShippingRates(params: {
  pickup_postcode: string;
  delivery_postcode: string;
  weight: number; // kg
  cod: 0 | 1;
  length?: number;
  breadth?: number;
  height?: number;
}) {
  const api = await client();
  const res = await api.get("/courier/serviceability", { params });
  return res.data;
}

export async function cancelShiprocketOrder(ids: number[]) {
  const api = await client();
  const res = await api.post("/orders/cancel", { ids });
  return res.data;
}
