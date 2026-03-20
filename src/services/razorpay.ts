/**
 * Razorpay Payment Service
 *
 * Wraps the official `razorpay` npm package with typed helpers.
 * Env vars required: RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET
 */

import Razorpay from "razorpay";
import crypto from "crypto";

// ─── Singleton instance ───────────────────────────────────────────────────────

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

// ─── Create order ─────────────────────────────────────────────────────────────

/**
 * Create a Razorpay order.
 *
 * @param amountInRupees - Amount in INR (will be converted to paise internally)
 * @param receipt        - Unique receipt identifier (our DB order ID or similar)
 * @param notes          - Optional key-value metadata attached to the order
 */
export async function createRazorpayOrder(
  amountInRupees: number,
  receipt: string,
  notes?: Record<string, string>,
) {
  const rz = getRazorpay();

  const order = await rz.orders.create({
    amount: Math.round(amountInRupees * 100), // Razorpay expects paise
    currency: "INR",
    receipt,
    notes: notes ?? {},
  });

  return order;
}

// ─── Verify payment signature ─────────────────────────────────────────────────

/**
 * Verify the Razorpay payment signature returned by the checkout widget.
 *
 * Signature = HMAC-SHA256(keySecret, "<orderId>|<paymentId>")
 *
 * @returns `true` if the signature is valid, `false` otherwise
 */
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

/**
 * @deprecated Use verifyPaymentSignature (renamed for consistency)
 */
export const verifyRazorpayPayment = verifyPaymentSignature;

// ─── Fetch payment details ────────────────────────────────────────────────────

/**
 * Fetch full payment details from Razorpay by payment ID.
 */
export async function fetchPaymentDetails(paymentId: string) {
  const rz = getRazorpay();
  return rz.payments.fetch(paymentId);
}

/**
 * @deprecated Use fetchPaymentDetails (renamed for consistency)
 */
export const getRazorpayPayment = fetchPaymentDetails;

// ─── Refund ───────────────────────────────────────────────────────────────────

/**
 * Initiate a full or partial refund for a Razorpay payment.
 *
 * @param paymentId      - The `razorpay_payment_id` to refund
 * @param amountInRupees - Amount to refund in INR. Omit for full refund.
 * @param notes          - Optional metadata for the refund record
 */
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
