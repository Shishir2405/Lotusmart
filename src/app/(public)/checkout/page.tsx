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
} from "react-icons/ri";
import { useCartStore } from "@/store/cart.store";
import { useAuthStore } from "@/store/auth.store";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { formatCurrency, normalizeImageUrl } from "@/utils/helpers";
import axios from "axios";
import toast from "@/components/ui/toast";

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
}

interface SavedAddress extends AddressForm {
  _id: string;
  isDefault: boolean;
}

const STEPS: { key: Step; label: string }[] = [
  { key: "cart", label: "Cart Review" },
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
  const user = useAuthStore((s) => s.user);
  const { register, isLoading: authLoading } = useAuth();

  const subtotal = getSubtotal();
  const shippingCost = subtotal >= 500 ? 0 : 60;
  const total = subtotal + shippingCost - discount;

  const [step, setStep] = useState<Step>("cart");
  const [paymentMethod] = useState<"razorpay">("razorpay");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);

  
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
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    document.head.appendChild(script);
    return () => {
      document.head.removeChild(script);
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
        theme: { color: "#E84672" },
        handler: async (response: {
          razorpay_order_id: string;
          razorpay_payment_id: string;
          razorpay_signature: string;
        }) => {
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
        axios.isAxiosError(err)
          ? (err.response?.data?.message ?? "Payment initiation failed")
          : "Payment initiation failed",
      );
    }
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

                  <Button
                    fullWidth
                    size="lg"
                    className="mt-6"
                    isLoading={isPlacingOrder}
                    onClick={handlePayment}
                    rightIcon={<RiArrowRightLine />}
                  >
{`Pay ${formatCurrency(total)}`}
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
    </div>
  );
}
