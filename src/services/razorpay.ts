

import Razorpay from "razorpay";
import crypto from "crypto";


let _instance: Razorpay | null = null;

function getRazorpay(): Razorpay {
  if (!_instance) {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      throw new Error(
        "Missing Razorpay credentials. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
      );
    }

    _instance = new Razorpay({ key_id: keyId, key_secret: keySecret });
  }
  return _instance;
}


export async function createRazorpayOrder(
  amountInRupees: number,
  receipt: string,
  notes?: Record<string, string>,
) {
  const rz = getRazorpay();

  const order = await rz.orders.create({
    amount: Math.round(amountInRupees * 100), 
    currency: "INR",
    receipt,
    notes: notes ?? {},
  });

  return order;
}


export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string,
): boolean {
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) throw new Error("RAZORPAY_KEY_SECRET is not set");

  const body = `${orderId}|${paymentId}`;
  const expectedSignature = crypto
    .createHmac("sha256", keySecret)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}


export const verifyRazorpayPayment = verifyPaymentSignature;


export async function fetchPaymentDetails(paymentId: string) {
  const rz = getRazorpay();
  return rz.payments.fetch(paymentId);
}


export const getRazorpayPayment = fetchPaymentDetails;


export async function initiateRefund(
  paymentId: string,
  amountInRupees?: number,
  notes?: Record<string, string>,
) {
  const rz = getRazorpay();

  return rz.payments.refund(paymentId, {
    ...(amountInRupees !== undefined
      ? { amount: Math.round(amountInRupees * 100) }
      : {}),
    notes: notes ?? {},
  });
}
