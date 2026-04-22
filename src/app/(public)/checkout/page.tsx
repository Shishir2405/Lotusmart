"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiCheckLine,
  RiLockLine,
  RiArrowRightLine,
  RiArrowLeftLine,
  RiAddLine,
  RiSubtractLine,
  RiDeleteBinLine,
  RiMapPinLine,
  RiAddCircleLine,
  RiEditLine,
  RiCoupon3Line,
  RiCloseLine,
  RiPriceTag3Line,
} from "react-icons/ri";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCurrency, normalizeImageUrl } from "@/utils/helpers";
import axios from "axios";
import toast from "@/components/ui/toast";
import LocationPicker, { type LocationPickerValue } from "@/components/shared/LocationPicker";

type Step = "cart" | "address" | "account" | "payment" | "confirm";

interface AddressForm {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  pincode: string;
  label: string;
  coordinates?: { lat: number; lng: number };
  formattedAddress?: string;
}

interface SavedAddress extends AddressForm {
  _id: string;
  isDefault: boolean;
}

interface AvailableCoupon {
  _id: string;
  code: string;
  description?: string;
  discountType: "percentage" | "fixed";
  discountValue: number;
  minOrderValue?: number;
  maxDiscountAmount?: number;
  validUntil: string;
}

const STEPS: { key: Step; label: string }[] = [
  { key: "cart", label: "Cart Review" },
  { key: "address", label: "Address" },
  { key: "account", label: "Account" },
  { key: "payment", label: "Payment" },
  { key: "confirm", label: "Confirm" },
];

interface RazorpayInstance {
  open: () => void;
  on: (
    event: "payment.failed",
    handler: (resp: {
      error: { code?: string; description?: string; reason?: string; source?: string };
    }) => void,
  ) => void;
}

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

const EMPTY_ADDRESS: AddressForm = {
  fullName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
  label: "home",
};

export default function CheckoutPage() {
  const router = useRouter();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const getSubtotal = useCartStore((s) => s.getSubtotal);
  const discount = useCartStore((s) => s.discount);
  const couponCode = useCartStore((s) => s.couponCode);
  const applyCoupon = useCartStore((s) => s.applyCoupon);
  const removeCoupon = useCartStore((s) => s.removeCoupon);
  const user = useAuthStore((s) => s.user);
  const { register, isLoading: authLoading } = useAuth();

  const subtotal = getSubtotal();
  const shippingCost = subtotal >= 500 ? 0 : 60;
  const total = subtotal + shippingCost - discount;

  const [step, setStep] = useState<Step>("cart");
  const [paymentMethod] = useState<"razorpay">("razorpay");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [razorpayStatus, setRazorpayStatus] = useState<"loading" | "ready" | "error">("loading");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [showCouponList, setShowCouponList] = useState(false);
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
  const [loadingCoupons, setLoadingCoupons] = useState(false);

  
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [address, setAddress] = useState<AddressForm>(EMPTY_ADDRESS);
  const [addressErrors, setAddressErrors] = useState<Partial<AddressForm>>({});
  const [savingAddress, setSavingAddress] = useState(false);

  
  const [guestForm, setGuestForm] = useState({ name: "", email: "", phone: "", password: "", confirmPassword: "" });

  
  useEffect(() => {
    if (items.length === 0 && !placedOrderId) router.replace("/cart");
  }, [items, placedOrderId, router]);


  useEffect(() => {
    if (typeof window !== "undefined" && window.Razorpay) {
      setRazorpayStatus("ready");
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => setRazorpayStatus("ready");
    script.onerror = () => setRazorpayStatus("error");
    document.head.appendChild(script);
    return () => {
      if (script.parentNode) script.parentNode.removeChild(script);
    };
  }, []);

  
  useEffect(() => {
    if (!user) return;
    axios
      .get<{ data: SavedAddress[] }>("/api/auth/addresses")
      .then((r) => {
        const addrs = r.data.data ?? [];
        setSavedAddresses(addrs);
        const def = addrs.find((a) => a.isDefault) ?? addrs[0];
        if (def) setSelectedAddressId(def._id);
      })
      .catch(() => null);
  }, [user]);

  
  useEffect(() => {
    if (user && !address.fullName) {
      setAddress((a) => ({
        ...a,
        fullName: user.name ?? "",
        phone: user.phone ?? "",
      }));
    }
  }, [user, address.fullName]);

  const validateAddress = (addr: AddressForm) => {
    const errs: Partial<AddressForm> = {};
    if (!addr.fullName.trim()) errs.fullName = "Required";
    if (!addr.phone.match(/^[6-9]\d{9}$/))
      errs.phone = "Enter a valid 10-digit mobile number";
    if (!addr.addressLine1.trim()) errs.addressLine1 = "Required";
    if (!addr.city.trim()) errs.city = "Required";
    if (!addr.state.trim()) errs.state = "Required";
    if (!addr.pincode.match(/^\d{6}$/))
      errs.pincode = "Enter a valid 6-digit pincode";
    setAddressErrors(errs);
    return !Object.keys(errs).length;
  };

  const getSelectedAddress = (): AddressForm => {
    if (showNewAddressForm || !selectedAddressId) return address;
    const saved = savedAddresses.find((a) => a._id === selectedAddressId);
    return saved ?? address;
  };

  
  const handleCartNext = () => {
    if (items.length === 0) return;
    setStep("address");
  };

  const handleAddressNext = async () => {
    if (showNewAddressForm || savedAddresses.length === 0) {
      if (!validateAddress(address)) return;

      
      if (user) {
        setSavingAddress(true);
        try {
          const res = await axios.post<{ data: SavedAddress[] }>(
            "/api/auth/addresses",
            {
              ...address,
              isDefault: savedAddresses.length === 0,
            },
          );
          const newAddrs = res.data.data ?? [];
          setSavedAddresses(newAddrs);
          const newest = newAddrs[newAddrs.length - 1];
          if (newest) setSelectedAddressId(newest._id);
          setShowNewAddressForm(false);
        } catch {
          toast.error("Failed to save address");
          return;
        } finally {
          setSavingAddress(false);
        }
      }
    }

    
    setStep(user ? "payment" : "account");
  };

  const handleAccountNext = async () => {
    if (!user) {
      try {
        await register({
          name: guestForm.name || address.fullName,
          email: guestForm.email,
          phone: guestForm.phone || address.phone,
          password: guestForm.password,
          confirmPassword: guestForm.confirmPassword,
        });
        setStep("payment");
      } catch {
        
      }
    } else {
      setStep("payment");
    }
  };

  const placeOrder = async (extraPaymentFields?: Record<string, string>) => {
    setIsPlacingOrder(true);
    try {
      const shippingAddress = getSelectedAddress();
      const res = await axios.post<{
        data: { _id: string; orderNumber: string };
      }>("/api/orders", {
        shippingAddress,
        billingAddress: shippingAddress,
        paymentMethod,
        items: items.map((i) => ({
          product: i.productId,
          name: i.name,
          image: i.image,
          quantity: i.quantity,
          price: i.price,
          variant: i.variant,
          sku: i.productId,
        })),
        ...(couponCode && discount > 0
          ? { couponCode, discount }
          : {}),
        ...extraPaymentFields,
      });

      const order = res.data.data;
      setPlacedOrderId(order._id);
      clearCart();
      setStep("confirm");
    } catch (err) {
      toast.error(
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? "Failed to place order")
          : "Failed to place order",
      );
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handlePayment = async () => {
    setPaymentError(null);
    if (typeof window === "undefined" || !window.Razorpay) {
      const msg =
        razorpayStatus === "error"
          ? "We couldn't load the payment provider. Please check your internet connection or disable any ad/script blockers and try again."
          : "The payment provider is still loading. Please wait a moment and try again.";
      setPaymentError(msg);
      toast.error(msg);
      return;
    }
    try {
      const shippingAddress = getSelectedAddress();
      const orderRes = await axios.post<{ data: { _id: string } }>(
        "/api/orders",
        {
          shippingAddress,
          billingAddress: shippingAddress,
          paymentMethod: "razorpay",
          items: items.map((i) => ({
            product: i.productId,
            name: i.name,
            image: i.image,
            quantity: i.quantity,
            price: i.price,
            variant: i.variant,
            sku: i.productId,
          })),
          ...(couponCode && discount > 0
            ? { couponCode, discount }
            : {}),
        },
      );
      const internalOrderId = orderRes.data.data._id;

      const rzRes = await axios.post<{
        data: {
          razorpayOrderId: string;
          amount: number;
          currency: string;
          keyId: string;
        };
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
          name: shippingAddress.fullName,
          contact: shippingAddress.phone,
          email: user?.email ?? guestForm.email,
        },
        // Explicitly enable all payment methods so UPI collect/intent/QR
        // show up alongside cards, wallets and net banking.
        method: {
          upi: true,
          card: true,
          netbanking: true,
          wallet: true,
          paylater: true,
          emi: true,
        },
        config: {
          display: {
            preferences: { show_default_blocks: true },
          },
        },
        notes: { internalOrderId },
        theme: { color: "#E84672" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
          try {
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
          } catch (verifyErr) {
            const msg = axios.isAxiosError(verifyErr)
              ? verifyErr.response?.data?.message ?? "Payment verification failed"
              : "Payment verification failed";
            setPaymentError(msg);
            toast.error(msg);
          }
        },
        modal: {
          ondismiss: () => {
            setPaymentError("Payment cancelled. You can retry anytime.");
            toast.info("Payment cancelled");
          },
          escape: true,
          confirm_close: true,
        },
      };

      try {
        const rz = new window.Razorpay(rzOptions);
        rz.on("payment.failed", (resp) => {
          const msg =
            resp.error?.description ||
            resp.error?.reason ||
            "Payment failed. Please try a different method.";
          setPaymentError(msg);
          toast.error(msg);
        });
        rz.open();
      } catch (openErr) {
        const msg =
          openErr instanceof Error
            ? openErr.message
            : "Unable to open payment window. Please refresh and try again.";
        setPaymentError(msg);
        toast.error(msg);
      }
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? "Payment initiation failed")
        : "Payment initiation failed";
      setPaymentError(msg);
      toast.error(msg);
    }
  };

  const loadAvailableCoupons = async () => {
    setLoadingCoupons(true);
    try {
      const res = await axios.get<{ data: AvailableCoupon[] }>(
        "/api/coupons/available",
      );
      setAvailableCoupons(res.data.data ?? []);
    } catch {
      setAvailableCoupons([]);
    } finally {
      setLoadingCoupons(false);
    }
  };

  const openCouponList = () => {
    setShowCouponList(true);
    if (availableCoupons.length === 0) loadAvailableCoupons();
  };

  const applyCouponCode = async (rawCode: string) => {
    const code = rawCode.trim().toUpperCase();
    if (!code) {
      setCouponError("Enter a coupon code");
      return;
    }
    if (subtotal <= 0) {
      setCouponError("Add items to your cart first");
      return;
    }
    setApplyingCoupon(true);
    setCouponError(null);
    try {
      const res = await axios.post<{
        data: { code: string; discount: number };
      }>("/api/coupons/validate", {
        code,
        orderTotal: subtotal,
      });
      const { code: validatedCode, discount: amt } = res.data.data;
      applyCoupon(validatedCode, amt);
      setCouponInput("");
      setShowCouponList(false);
      toast.success(`Coupon ${validatedCode} applied`);
    } catch (err) {
      const msg = axios.isAxiosError(err)
        ? (err.response?.data?.message ?? "Invalid coupon code")
        : "Invalid coupon code";
      setCouponError(msg);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    removeCoupon();
    setCouponError(null);
    toast.success("Coupon removed");
  };

  const goBack = () => {
    const stepKeys = STEPS.map((s) => s.key);
    const currentIdx = stepKeys.indexOf(step);
    if (currentIdx > 0) {
      let prevStep = stepKeys[currentIdx - 1];
      
      if (prevStep === "account" && user) prevStep = "address";
      setStep(prevStep);
    }
  };

  
  const visibleSteps = STEPS.filter((s) => !(s.key === "account" && user));
  const currentStepIndex = visibleSteps.findIndex((s) => s.key === step);

  return (
    <div className="container-wide py-10 max-w-5xl">
      <h1 className="text-3xl font-bold text-neutral-900 mb-8">Checkout</h1>

      
      <div className="flex items-center gap-2 mb-10 overflow-x-auto pb-2">
        {visibleSteps.map((s, i) => (
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
              {i < currentStepIndex ? (
                <RiCheckLine size={14} />
              ) : (
                <span>{i + 1}</span>
              )}
              {s.label}
            </div>
            {i < visibleSteps.length - 1 && (
              <div
                className={`h-px w-8 ${i < currentStepIndex ? "bg-[#E84672]" : "bg-neutral-200"}`}
              />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            
            {step === "cart" && (
              <motion.div
                key="cart"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-2xl p-6 border border-neutral-100">
                  <h2 className="text-xl font-bold mb-5">
                    Review Your Cart ({items.length}{" "}
                    {items.length === 1 ? "item" : "items"})
                  </h2>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div
                        key={`${item.productId}-${item.variant?.value}`}
                        className="flex gap-4 py-3 border-b border-neutral-50 last:border-0"
                      >
                        <div className="w-20 h-20 rounded-xl bg-[#F7F6F0] overflow-hidden shrink-0">
                          {item.image ? (
                            <Image
                              src={normalizeImageUrl(item.image)}
                              alt={item.name}
                              width={80}
                              height={80}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl text-neutral-300">
                              🌿
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-semibold text-neutral-800 line-clamp-2">
                            {item.name}
                          </h3>
                          {item.variant && (
                            <p className="text-xs text-neutral-400 mt-0.5">
                              {item.variant.name}: {item.variant.value}
                            </p>
                          )}
                          <p className="text-xs text-neutral-400 mt-0.5">
                            {formatCurrency(item.price)} / {item.unit}
                          </p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    item.quantity - 1,
                                    item.variant,
                                  )
                                }
                                className="w-7 h-7 rounded-lg bg-[#F7F6F0] hover:bg-[#EBE8D8] flex items-center justify-center text-neutral-600 transition-colors"
                              >
                                <RiSubtractLine size={14} />
                              </button>
                              <span className="w-8 text-center text-sm font-semibold">
                                {item.quantity}
                              </span>
                              <button
                                onClick={() =>
                                  updateQuantity(
                                    item.productId,
                                    item.quantity + 1,
                                    item.variant,
                                  )
                                }
                                disabled={item.quantity >= item.stock}
                                className="w-7 h-7 rounded-lg bg-[#F7F6F0] hover:bg-[#EBE8D8] flex items-center justify-center text-neutral-600 transition-colors disabled:opacity-40"
                              >
                                <RiAddLine size={14} />
                              </button>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-neutral-900">
                                {formatCurrency(item.price * item.quantity)}
                              </span>
                              <button
                                onClick={() =>
                                  removeItem(item.productId, item.variant)
                                }
                                className="p-1.5 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                              >
                                <RiDeleteBinLine size={16} />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Button
                    fullWidth
                    size="lg"
                    className="mt-6"
                    rightIcon={<RiArrowRightLine />}
                    onClick={handleCartNext}
                  >
                    Continue to Address
                  </Button>
                </div>
              </motion.div>
            )}

            
            {step === "address" && (
              <motion.div
                key="address"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-2xl p-6 border border-neutral-100">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Delivery Address</h2>
                    <button
                      onClick={goBack}
                      className="text-sm text-neutral-500 hover:text-[#E84672] flex items-center gap-1 transition-colors"
                    >
                      <RiArrowLeftLine size={14} /> Back
                    </button>
                  </div>

                  
                  {user && savedAddresses.length > 0 && !showNewAddressForm && (
                    <div className="space-y-3 mb-5">
                      {savedAddresses.map((addr) => (
                        <label
                          key={addr._id}
                          className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            selectedAddressId === addr._id
                              ? "border-[#E84672] bg-[#FFF1F3]"
                              : "border-neutral-200 hover:border-neutral-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name="address"
                            checked={selectedAddressId === addr._id}
                            onChange={() => setSelectedAddressId(addr._id)}
                            className="mt-1 accent-[#E84672]"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-neutral-800 text-sm">
                                {addr.fullName}
                              </span>
                              {addr.isDefault && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-[#F7F6F0] text-[#7A6E42] font-medium">
                                  Default
                                </span>
                              )}
                              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 capitalize">
                                {addr.label}
                              </span>
                            </div>
                            <p className="text-sm text-neutral-500 mt-1 leading-relaxed">
                              {addr.addressLine1}
                              {addr.addressLine2 &&
                                `, ${addr.addressLine2}`}
                              <br />
                              {addr.city}, {addr.state} — {addr.pincode}
                            </p>
                            <p className="text-xs text-neutral-400 mt-1">
                              Phone: {addr.phone}
                            </p>
                          </div>
                        </label>
                      ))}

                      <button
                        onClick={() => {
                          setShowNewAddressForm(true);
                          setAddress({
                            ...EMPTY_ADDRESS,
                            fullName: user?.name ?? "",
                            phone: user?.phone ?? "",
                          });
                        }}
                        className="flex items-center gap-2 text-sm font-medium text-[#E84672] hover:text-[#C9305A] transition-colors py-2"
                      >
                        <RiAddCircleLine size={16} /> Add New Address
                      </button>
                    </div>
                  )}

                  
                  {(showNewAddressForm ||
                    !user ||
                    savedAddresses.length === 0) && (
                    <>
                      {showNewAddressForm && (
                        <button
                          onClick={() => setShowNewAddressForm(false)}
                          className="text-sm text-neutral-500 hover:text-[#E84672] flex items-center gap-1 mb-4 transition-colors"
                        >
                          <RiArrowLeftLine size={14} /> Use saved address
                        </button>
                      )}
                      <div className="mb-4">
                        <LocationPicker
                          initialValue={{
                            addressLine1: address.addressLine1,
                            city: address.city,
                            state: address.state,
                            pincode: address.pincode,
                            coordinates: address.coordinates,
                            formattedAddress: address.formattedAddress,
                          }}
                          onChange={(v: LocationPickerValue) =>
                            setAddress((a) => ({
                              ...a,
                              addressLine1: v.addressLine1 || a.addressLine1,
                              addressLine2: v.addressLine2 ?? a.addressLine2,
                              city: v.city || a.city,
                              state: v.state || a.state,
                              pincode: v.pincode || a.pincode,
                              coordinates: v.coordinates ?? a.coordinates,
                              formattedAddress: v.formattedAddress ?? a.formattedAddress,
                            }))
                          }
                        />
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Input
                          label="Full Name"
                          value={address.fullName}
                          onChange={(e) =>
                            setAddress((a) => ({
                              ...a,
                              fullName: e.target.value,
                            }))
                          }
                          error={addressErrors.fullName}
                          required
                        />
                        <Input
                          label="Phone Number"
                          value={address.phone}
                          onChange={(e) =>
                            setAddress((a) => ({
                              ...a,
                              phone: e.target.value,
                            }))
                          }
                          error={addressErrors.phone}
                          placeholder="10-digit mobile"
                          required
                        />
                        <div className="sm:col-span-2">
                          <Input
                            label="Address Line 1"
                            value={address.addressLine1}
                            onChange={(e) =>
                              setAddress((a) => ({
                                ...a,
                                addressLine1: e.target.value,
                              }))
                            }
                            error={addressErrors.addressLine1}
                            placeholder="Flat/House No., Building, Street"
                            required
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <Input
                            label="Address Line 2"
                            value={address.addressLine2}
                            onChange={(e) =>
                              setAddress((a) => ({
                                ...a,
                                addressLine2: e.target.value,
                              }))
                            }
                            placeholder="Locality, Landmark (optional)"
                          />
                        </div>
                        <Input
                          label="City"
                          value={address.city}
                          onChange={(e) =>
                            setAddress((a) => ({
                              ...a,
                              city: e.target.value,
                            }))
                          }
                          error={addressErrors.city}
                          required
                        />
                        <Input
                          label="State"
                          value={address.state}
                          onChange={(e) =>
                            setAddress((a) => ({
                              ...a,
                              state: e.target.value,
                            }))
                          }
                          error={addressErrors.state}
                          required
                        />
                        <Input
                          label="Pincode"
                          value={address.pincode}
                          onChange={(e) =>
                            setAddress((a) => ({
                              ...a,
                              pincode: e.target.value,
                            }))
                          }
                          error={addressErrors.pincode}
                          placeholder="6-digit pincode"
                          required
                          maxLength={6}
                        />
                        <div>
                          <label className="block text-sm font-medium text-neutral-700 mb-1">
                            Address Type
                          </label>
                          <div className="flex gap-2">
                            {["home", "work", "other"].map((l) => (
                              <button
                                key={l}
                                onClick={() =>
                                  setAddress((a) => ({ ...a, label: l }))
                                }
                                className={`px-4 py-2 rounded-xl border text-sm font-medium capitalize transition-all ${
                                  address.label === l
                                    ? "border-[#E84672] bg-[#FFF1F3] text-[#E84672]"
                                    : "border-neutral-200 text-neutral-600 hover:border-neutral-300"
                                }`}
                              >
                                {l}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}

                  <Button
                    fullWidth
                    size="lg"
                    className="mt-6"
                    rightIcon={<RiArrowRightLine />}
                    onClick={handleAddressNext}
                    isLoading={savingAddress}
                  >
                    Continue to {user ? "Payment" : "Account"}
                  </Button>
                </div>
              </motion.div>
            )}

            
            {step === "account" && !user && (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-2xl p-6 border border-neutral-100">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-xl font-bold">Create Your Account</h2>
                    <button
                      onClick={goBack}
                      className="text-sm text-neutral-500 hover:text-[#E84672] flex items-center gap-1 transition-colors"
                    >
                      <RiArrowLeftLine size={14} /> Back
                    </button>
                  </div>
                  <p className="text-sm text-neutral-500 mb-6">
                    Save your details and track your order easily. Takes only 30
                    seconds!
                  </p>
                  <div className="space-y-4">
                    <Input
                      label="Email"
                      type="email"
                      value={guestForm.email}
                      onChange={(e) =>
                        setGuestForm((f) => ({ ...f, email: e.target.value }))
                      }
                      required
                    />
                    <Input
                      label="Password"
                      type="password"
                      value={guestForm.password}
                      onChange={(e) =>
                        setGuestForm((f) => ({
                          ...f,
                          password: e.target.value,
                        }))
                      }
                      placeholder="Min. 8 characters"
                      required
                    />
                    <Input
                      label="Confirm Password"
                      type="password"
                      value={guestForm.confirmPassword}
                      onChange={(e) =>
                        setGuestForm((f) => ({
                          ...f,
                          confirmPassword: e.target.value,
                        }))
                      }
                      required
                    />
                  </div>
                  <p className="text-xs text-neutral-400 mt-4">
                    Your cart will be saved to your account and you can track
                    this order anytime.
                  </p>
                  <Button
                    fullWidth
                    size="lg"
                    className="mt-5"
                    isLoading={authLoading}
                    rightIcon={<RiArrowRightLine />}
                    onClick={handleAccountNext}
                  >
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

            
            {step === "payment" && (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="bg-white rounded-2xl p-6 border border-neutral-100">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold">Payment Method</h2>
                    <button
                      onClick={goBack}
                      className="text-sm text-neutral-500 hover:text-[#E84672] flex items-center gap-1 transition-colors"
                    >
                      <RiArrowLeftLine size={14} /> Back
                    </button>
                  </div>

                  
                  <div className="bg-[#F7F6F0] rounded-xl p-4 mb-5">
                    <div className="flex items-center gap-2 text-sm mb-2">
                      <RiMapPinLine className="text-[#E84672]" size={14} />
                      <span className="font-semibold text-neutral-700">
                        Delivering to
                      </span>
                      <button
                        onClick={() => setStep("address")}
                        className="ml-auto text-xs text-[#E84672] hover:text-[#C9305A] flex items-center gap-1 transition-colors"
                      >
                        <RiEditLine size={12} /> Change
                      </button>
                    </div>
                    {(() => {
                      const addr = getSelectedAddress();
                      return (
                        <p className="text-sm text-neutral-600">
                          {addr.fullName}, {addr.addressLine1}, {addr.city},{" "}
                          {addr.state} — {addr.pincode}
                        </p>
                      );
                    })()}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-4 p-4 rounded-2xl border-2 border-[#E84672] bg-[#FFF1F3]">
                      <div className="w-5 h-5 rounded-full border-2 border-[#E84672] flex items-center justify-center mt-0.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#E84672]" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-neutral-800">Pay Online</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-[#E84672] text-white font-medium">Secure</span>
                        </div>
                        <p className="text-sm text-neutral-500 mt-0.5">
                          Credit/Debit card, UPI, Net Banking, Wallets
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-5 text-xs text-neutral-400">
                    <RiLockLine size={14} /> All transactions are encrypted and
                    secure
                  </div>

                  {razorpayStatus === "loading" && (
                    <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm font-medium text-amber-700">
                      Loading secure payment provider…
                    </div>
                  )}
                  {razorpayStatus === "error" && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600">
                      We couldn't load the payment provider. Disable any
                      ad/script blocker, check your connection, and refresh
                      this page.
                    </div>
                  )}
                  {paymentError && (
                    <div
                      role="alert"
                      className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-600"
                    >
                      {paymentError}
                    </div>
                  )}

                  <Button
                    fullWidth
                    size="lg"
                    className="mt-6"
                    disabled={razorpayStatus !== "ready"}
                    isLoading={isPlacingOrder}
                    onClick={handlePayment}
                    rightIcon={<RiArrowRightLine />}
                  >
{razorpayStatus === "ready"
                      ? `Pay ${formatCurrency(total)}`
                      : razorpayStatus === "loading"
                        ? "Preparing payment…"
                        : "Payment unavailable"}
                  </Button>
                </div>
              </motion.div>
            )}

            
            {step === "confirm" && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="bg-white rounded-2xl p-10 border border-neutral-100 text-center">
                  <div className="w-20 h-20 rounded-full bg-[#FFF1F3] flex items-center justify-center mx-auto mb-5">
                    <RiCheckLine size={36} className="text-[#E84672]" />
                  </div>
                  <h2 className="text-2xl font-bold text-neutral-900 mb-2">
                    Order Placed!
                  </h2>
                  <p className="text-neutral-500 mb-6">
                    Thank you for your order. You&apos;ll receive a confirmation
                    email shortly.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    {placedOrderId && (
                      <Button
                        onClick={() =>
                          router.push(`/orders/${placedOrderId}`)
                        }
                      >
                        Track Order
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      onClick={() => router.push("/products")}
                    >
                      Continue Shopping
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        
        {step !== "confirm" && (
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-5 border border-neutral-100 sticky top-24">
              <h3 className="font-bold text-neutral-900 mb-4">
                Order Summary
              </h3>
              <div className="space-y-3 max-h-64 overflow-y-auto mb-4">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variant?.value}`}
                    className="flex gap-3 text-sm"
                  >
                    <div className="w-12 h-12 rounded-lg bg-[#F7F6F0] overflow-hidden shrink-0">
                      {item.image ? (
                        <Image
                          src={normalizeImageUrl(item.image)}
                          alt={item.name}
                          width={48}
                          height={48}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm text-neutral-300">
                          🌿
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-neutral-600 line-clamp-1">
                        {item.name}
                      </p>
                      <p className="text-xs text-neutral-400">
                        × {item.quantity}
                      </p>
                    </div>
                    <span className="font-medium text-neutral-800 shrink-0">
                      {formatCurrency(item.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="border-t border-[#EBE8D8] pt-3 mb-3">
                {couponCode ? (
                  <div className="flex items-center justify-between rounded-xl border border-green-200 bg-green-50 px-3 py-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-green-100">
                        <RiCoupon3Line size={14} className="text-green-700" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-green-800 truncate">
                          {couponCode}
                        </p>
                        <p className="text-[0.68rem] text-green-700">
                          −{formatCurrency(discount)} applied
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="p-1 rounded-lg hover:bg-green-100 text-green-700 transition-colors"
                      title="Remove coupon"
                    >
                      <RiCloseLine size={14} />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <RiCoupon3Line
                          size={14}
                          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300"
                        />
                        <input
                          type="text"
                          value={couponInput}
                          onChange={(e) => {
                            setCouponInput(e.target.value.toUpperCase());
                            if (couponError) setCouponError(null);
                          }}
                          placeholder="Coupon code"
                          className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm font-medium text-neutral-700 outline-none placeholder:text-neutral-400 focus:border-[#E84672] focus:ring-2 focus:ring-[#E84672]/10"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => applyCouponCode(couponInput)}
                        disabled={applyingCoupon || !couponInput.trim()}
                        className="rounded-xl bg-[#E84672] px-3 py-2 text-xs font-bold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {applyingCoupon ? "…" : "Apply"}
                      </button>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={openCouponList}
                        className="inline-flex items-center gap-1 text-[0.72rem] font-semibold text-[#E84672] hover:text-[#C9305A] transition-colors"
                      >
                        <RiPriceTag3Line size={11} />
                        View available coupons
                      </button>
                      {couponError && (
                        <span className="text-[0.72rem] font-medium text-red-500">
                          {couponError}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-[#EBE8D8] pt-3 space-y-2 text-sm">
                <div className="flex justify-between text-neutral-500">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-500">
                  <span>Shipping</span>
                  <span
                    className={
                      shippingCost === 0 ? "text-green-600 font-medium" : ""
                    }
                  >
                    {shippingCost === 0
                      ? "FREE"
                      : formatCurrency(shippingCost)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-neutral-900 text-base pt-1">
                  <span>Total</span>
                  <span className="text-[#E84672]">
                    {formatCurrency(total)}
                  </span>
                </div>
              </div>

              {subtotal > 0 && subtotal < 500 && (
                <div className="bg-[#FFF9E8] rounded-xl p-3 text-xs text-amber-700 border border-amber-200 mt-3">
                  Add {formatCurrency(500 - subtotal)} more for free shipping!
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showCouponList && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCouponList(false)}
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          >
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            >
              <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#FFF1F3]">
                    <RiCoupon3Line size={15} className="text-[#E84672]" />
                  </div>
                  <div>
                    <h3 className="text-[0.95rem] font-bold text-neutral-800">
                      Available coupons
                    </h3>
                    <p className="text-[0.72rem] text-neutral-400">
                      Tap any coupon to apply it to this order
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCouponList(false)}
                  className="rounded-lg p-1.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
                >
                  <RiCloseLine size={18} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-4">
                {loadingCoupons ? (
                  <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-20 animate-pulse rounded-2xl bg-neutral-100"
                      />
                    ))}
                  </div>
                ) : availableCoupons.length === 0 ? (
                  <div className="py-10 text-center">
                    <RiCoupon3Line
                      size={32}
                      className="mx-auto mb-3 text-neutral-300"
                    />
                    <p className="text-sm text-neutral-500">
                      No coupons available right now. Check back later!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {availableCoupons.map((c) => {
                      const min = c.minOrderValue ?? 0;
                      const eligible = subtotal >= min;
                      const expiry = new Date(c.validUntil);
                      const discountLabel =
                        c.discountType === "percentage"
                          ? `${c.discountValue}% off${c.maxDiscountAmount ? ` up to ${formatCurrency(c.maxDiscountAmount)}` : ""}`
                          : `${formatCurrency(c.discountValue)} off`;
                      return (
                        <div
                          key={c._id}
                          className={`rounded-2xl border p-4 transition-colors ${
                            eligible
                              ? "border-neutral-200 bg-white hover:border-[#E84672] hover:bg-[#FFF9FA]"
                              : "border-neutral-100 bg-neutral-50 opacity-75"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span
                                  className="inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-0.5 text-[0.72rem] font-black tracking-wider"
                                  style={{
                                    borderColor: "#E84672",
                                    color: "#E84672",
                                    backgroundColor: "#FFF1F3",
                                  }}
                                >
                                  {c.code}
                                </span>
                                <span className="text-[0.72rem] font-semibold text-green-700">
                                  {discountLabel}
                                </span>
                              </div>
                              {c.description && (
                                <p className="mb-1 text-[0.78rem] text-neutral-600 line-clamp-2">
                                  {c.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[0.7rem] text-neutral-400">
                                {min > 0 && (
                                  <span>
                                    Min order {formatCurrency(min)}
                                  </span>
                                )}
                                <span>
                                  Expires{" "}
                                  {expiry.toLocaleDateString("en-IN", {
                                    day: "numeric",
                                    month: "short",
                                    year: "numeric",
                                  })}
                                </span>
                              </div>
                              {!eligible && min > 0 && (
                                <p className="mt-1.5 text-[0.7rem] font-semibold text-amber-600">
                                  Add {formatCurrency(min - subtotal)} more to
                                  use this coupon
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => applyCouponCode(c.code)}
                              disabled={!eligible || applyingCoupon}
                              className="shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-colors disabled:cursor-not-allowed"
                              style={{
                                backgroundColor: eligible ? "#E84672" : "#e5e5e5",
                                color: eligible ? "#fff" : "#9ca3af",
                              }}
                            >
                              Apply
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
