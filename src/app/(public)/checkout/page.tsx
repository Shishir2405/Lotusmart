"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { RiCheckLine, RiLockLine, RiArrowRightLine } from "react-icons/ri";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/helpers";
import axios from "axios";
import toast from "react-hot-toast";

type Step = "address" | "account" | "payment" | "confirm";

interface AddressForm {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
}

const STEPS: { key: Step; label: string }[] = [
  { key: "address", label: "Address" },
  { key: "account", label: "Account" },
  { key: "payment", label: "Payment" },
  { key: "confirm", label: "Confirm" },
];

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const user = useAuthStore((s) => s.user);
  const { register, isLoading: authLoading } = useAuth();

  const subtotal = getSubtotal();
  const shippingCost = subtotal >= 500 ? 0 : 60;
  const total = subtotal + shippingCost;

  const [step, setStep] = useState<Step>("address");
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "razorpay">("razorpay");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  const [address, setAddress] = useState<AddressForm>({
    fullName: user?.name ?? "",
    phone: user?.phone ?? "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
  });

  const [guestForm, setGuestForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [addressErrors, setAddressErrors] = useState<Partial<AddressForm>>({});

  // Redirect if cart empty
  useEffect(() => {
    if (items.length === 0 && !placedOrderId) router.replace("/cart");
  }, [items, placedOrderId, router]);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.head.appendChild(script);
    return () => { document.head.removeChild(script); };
  }, []);

  const validateAddress = () => {
    const errs: Partial<AddressForm> = {};
    if (!address.fullName.trim()) errs.fullName = "Required";
    if (!address.phone.match(/^[6-9]\d{9}$/)) errs.phone = "Enter a valid 10-digit mobile number";
    if (!address.addressLine1.trim()) errs.addressLine1 = "Required";
    if (!address.city.trim()) errs.city = "Required";
    if (!address.state.trim()) errs.state = "Required";
    if (!address.pincode.match(/^\d{6}$/)) errs.pincode = "Enter a valid 6-digit pincode";
    setAddressErrors(errs);
    return !Object.keys(errs).length;
  };

  const handleAddressNext = () => {
    if (!validateAddress()) return;
    // Skip account step if already logged in
    setStep(user ? "payment" : "account");
  };

  const handleAccountNext = async () => {
    if (!user) {
      // Create account (cart will be merged automatically via useAuth)
      try {
        await register({
          name: guestForm.name || address.fullName,
          email: guestForm.email,
          password: guestForm.password,
          confirmPassword: guestForm.confirmPassword,
        });
        setStep("payment");
      } catch {
        // handled in useAuth
      }
    } else {
      setStep("payment");
    }
  };

  const placeOrder = async (extraPaymentFields?: Record<string, string>) => {
    setIsPlacingOrder(true);
    try {
      const res = await axios.post<{ data: { _id: string; orderNumber: string } }>("/api/orders", {
        shippingAddress: address,
        billingAddress: address,
        paymentMethod,
        items: items.map((i) => ({
          product: i.productId,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          variant: i.variant,
          sku: i.productId,
        })),
        ...extraPaymentFields,
      });

      const order = res.data.data;
      setPlacedOrderId(order._id);
      clearCart();
      setStep("confirm");
    } catch (err) {
      toast.error(
        axios.isAxiosError(err) ? err.response?.data?.message ?? "Failed to place order" : "Failed to place order",
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePayment = async () => {
    if (paymentMethod === "cod") {
      await placeOrder();
      return;
    }

    // Razorpay flow
    try {
      // First create a pending order to get the internal ID
      const orderRes = await axios.post<{ data: { _id: string } }>("/api/orders", {
        shippingAddress: address,
        billingAddress: address,
        paymentMethod: "razorpay",
        items: items.map((i) => ({
          product: i.productId,
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          variant: i.variant,
          sku: i.productId,
        })),
      });
      const internalOrderId = orderRes.data.data._id;

      // Create Razorpay order
      const rzRes = await axios.post<{
        data: { razorpayOrderId: string; amount: number; currency: string; keyId: string };
      }>("/api/payments/razorpay", { amount: total, internalOrderId });

      const { razorpayOrderId, amount, currency, keyId } = rzRes.data.data;

      const rzOptions = {
        key: keyId,
        amount,
        currency,
        name: "LotusMart",
        description: "Premium Spices & Dry Fruits",
        order_id: razorpayOrderId,
        prefill: {
          name: address.fullName,
          contact: address.phone,
          email: user?.email ?? guestForm.email,
        },
        theme: { color: "#E84672" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          // Verify and finalize
          await axios.post("/api/payments/verify", {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            internalOrderId,
          });
          setPlacedOrderId(internalOrderId);
          clearCart();
          setStep("confirm");
          toast.success("Payment successful!");
        },
      };

      const rz = new window.Razorpay(rzOptions);
      rz.open();
    } catch (err) {
      toast.error(
        axios.isAxiosError(err) ? err.response?.data?.message ?? "Payment initiation failed" : "Payment initiation failed",
      );
    }
  };

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="container-wide py-10 max-w-5xl">
      <h1 className="text-3xl font-bold text-neutral-900 mb-8">Checkout</h1>

      {/* Stepper */}
      <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
        {STEPS.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2 shrink-0">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                i < currentStepIndex
                  ? "bg-[#E84672] text-white"
                  : i === currentStepIndex
                  ? "bg-[#FFF1F3] text-[#E84672] border-2 border-[#E84672]"
                  : "bg-neutral-100 text-neutral-400"
              }`}
            >
              {i < currentStepIndex ? <RiCheckLine size={14} /> : <span>{i + 1}</span>}
              {s.label}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`h-px w-8 ${i < currentStepIndex ? "bg-[#E84672]" : "bg-neutral-200"}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Step Content */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {/* ADDRESS STEP */}
            {step === "address" && (
              <motion.div key="address" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <div className="bg-white rounded-2xl p-6 border border-neutral-100">
                  <h2 className="text-xl font-bold mb-6">Delivery Address</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input label="Full Name" value={address.fullName} onChange={(e) => setAddress((a) => ({ ...a, fullName: e.target.value }))} error={addressErrors.fullName} required />
                    <Input label="Phone Number" value={address.phone} onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))} error={addressErrors.phone} placeholder="10-digit mobile" required />
                    <div className="sm:col-span-2">
                      <Input label="Address Line 1" value={address.addressLine1} onChange={(e) => setAddress((a) => ({ ...a, addressLine1: e.target.value }))} error={addressErrors.addressLine1} placeholder="Flat/House No., Building, Street" required />
                    </div>
                    <div className="sm:col-span-2">
                      <Input label="Address Line 2" value={address.addressLine2} onChange={(e) => setAddress((a) => ({ ...a, addressLine2: e.target.value }))} placeholder="Locality, Landmark (optional)" />
                    </div>
                    <Input label="City" value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} error={addressErrors.city} required />
                    <Input label="State" value={address.state} onChange={(e) => setAddress((a) => ({ ...a, state: e.target.value }))} error={addressErrors.state} required />
                    <Input label="Pincode" value={address.pincode} onChange={(e) => setAddress((a) => ({ ...a, pincode: e.target.value }))} error={addressErrors.pincode} placeholder="6-digit pincode" required maxLength={6} />
                  </div>
                  <Button fullWidth size="lg" className="mt-6" rightIcon={<RiArrowRightLine />} onClick={handleAddressNext}>
                    Continue
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ACCOUNT STEP (guest only) */}
            {step === "account" && !user && (
              <motion.div key="account" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <div className="bg-white rounded-2xl p-6 border border-neutral-100">
                  <h2 className="text-xl font-bold mb-2">Create Your Account</h2>
                  <p className="text-sm text-neutral-500 mb-6">
                    Save your details and track your order easily. Takes only 30 seconds!
                  </p>
                  <div className="space-y-4">
                    <Input label="Email" type="email" value={guestForm.email} onChange={(e) => setGuestForm((f) => ({ ...f, email: e.target.value }))} required />
                    <Input label="Password" type="password" value={guestForm.password} onChange={(e) => setGuestForm((f) => ({ ...f, password: e.target.value }))} placeholder="Min. 8 characters" required />
                    <Input label="Confirm Password" type="password" value={guestForm.confirmPassword} onChange={(e) => setGuestForm((f) => ({ ...f, confirmPassword: e.target.value }))} required />
                  </div>
                  <p className="text-xs text-neutral-400 mt-4">
                    Your cart will be saved to your account and you can track this order anytime.
                  </p>
                  <Button fullWidth size="lg" className="mt-5" isLoading={authLoading} rightIcon={<RiArrowRightLine />} onClick={handleAccountNext}>
                    Create Account & Continue
                  </Button>
                  <button
                    className="w-full text-center text-sm text-neutral-400 hover:text-neutral-600 mt-3 py-2 transition-colors"
                    onClick={() => setStep("payment")}
                  >
                    Skip for now →
                  </button>
                </div>
              </motion.div>
            )}

            {/* PAYMENT STEP */}
            {step === "payment" && (
              <motion.div key="payment" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                <div className="bg-white rounded-2xl p-6 border border-neutral-100">
                  <h2 className="text-xl font-bold mb-6">Payment Method</h2>

                  <div className="space-y-3">
                    {[
                      { value: "razorpay", label: "Pay Online", desc: "Credit/Debit card, UPI, Net Banking, Wallets", badge: "Recommended" },
                      { value: "cod", label: "Cash on Delivery", desc: "Pay when your order arrives", badge: null },
                    ].map((opt) => (
                      <label
                        key={opt.value}
                        className={`flex items-start gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          paymentMethod === opt.value
                            ? "border-[#E84672] bg-[#FFF1F3]"
                            : "border-neutral-200 hover:border-neutral-300"
                        }`}
                      >
                        <input
                          type="radio"
                          name="payment"
                          value={opt.value}
                          checked={paymentMethod === opt.value as "cod" | "razorpay"}
                          onChange={() => setPaymentMethod(opt.value as "cod" | "razorpay")}
                          className="mt-1 accent-[#E84672]"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-neutral-800">{opt.label}</span>
                            {opt.badge && (
                              <span className="text-xs px-2 py-0.5 rounded-full bg-[#E84672] text-white font-medium">
                                {opt.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-neutral-500 mt-0.5">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 mt-5 text-xs text-neutral-400">
                    <RiLockLine size={14} /> All transactions are encrypted and secure
                  </div>

                  <Button
                    fullWidth
                    size="lg"
                    className="mt-6"
                    isLoading={isPlacingOrder}
                    onClick={handlePayment}
                    rightIcon={<RiArrowRightLine />}
                  >
                    {paymentMethod === "cod" ? "Place Order" : `Pay ${formatCurrency(total)}`}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* CONFIRMATION */}
            {step === "confirm" && (
              <motion.div key="confirm" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
                <div className="bg-white rounded-2xl p-10 border border-neutral-100 text-center">
                  <div className="w-20 h-20 rounded-full bg-[#FFF1F3] flex items-center justify-center mx-auto mb-5">
                    <RiCheckLine size={36} className="text-[#E84672]" />
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">Order Placed!</h2>
                  <p className="text-neutral-500 mb-6">
                    Thank you for your order. You'll receive a confirmation email shortly.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {placedOrderId && (
                      <Button onClick={() => router.push(`/orders/${placedOrderId}`)}>
                        Track Order
                      </Button>
                    )}
                    <Button variant="outline" onClick={() => router.push("/products")}>
                      Continue Shopping
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Order Summary Sidebar */}
        {step !== "confirm" && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-5 border border-neutral-100 sticky top-24">
              <h3 className="font-bold text-neutral-900 mb-4">Order Summary</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variant?.value}`} className="flex justify-between text-sm">
                    <span className="text-neutral-600 line-clamp-1 flex-1 pr-2">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="font-medium text-neutral-800 shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#EBE8D8] pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal</span><span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Shipping</span>
                  <span className={shippingCost === 0 ? "text-green-600 font-medium" : ""}>{shippingCost === 0 ? "FREE" : formatCurrency(shippingCost)}</span>
                </div>
                <div className="flex justify-between font-bold text-neutral-900 text-base pt-1">
                  <span>Total</span>
                  <span className="text-[#E84672]">{formatCurrency(total)}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
