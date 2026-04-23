import mongoose, { Schema, Document, Model } from "mongoose";
import type {
  IOrder,
  IOrderItem,
  IAddress,
  PaymentMethod,
  PaymentStatus,
  OrderStatus,
  AddressLabel,
} from "@/types";


export interface IOrderDocument extends Omit<IOrder, "_id">, Document {
  
  isDelivered: boolean;
  
  isPaid: boolean;
}


const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    name: { type: String, required: true },
    image: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    variant: { type: String },
  },
  { _id: false },
);

const AddressSubSchema = new Schema<IAddress>(
  {
    fullName: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    addressLine1: { type: String, required: true, trim: true },
    addressLine2: { type: String, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    isDefault: { type: Boolean, default: false },
    label: {
      type: String,
      enum: ["home", "work", "other"] satisfies AddressLabel[],
      default: "home",
    },
  },
  { _id: false },
);


const OrderSchema = new Schema<IOrderDocument>(
  {
    orderNumber: { type: String, unique: true },
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    items: { type: [OrderItemSchema], required: true },
    shippingAddress: { type: AddressSubSchema, required: true },
    billingAddress: { type: AddressSubSchema },
    paymentMethod: {
      type: String,
      enum: ["razorpay", "cod"] satisfies PaymentMethod[],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"] satisfies PaymentStatus[],
      default: "pending",
    },
    orderStatus: {
      type: String,
      enum: [
        "placed",
        "confirmed",
        "processing",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ] satisfies OrderStatus[],
      default: "placed",
      index: true,
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    razorpaySignature: { type: String },
    subtotal: { type: Number, required: true, min: 0 },
    shippingCost: { type: Number, required: true, default: 0, min: 0 },
    tax: { type: Number, required: true, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    notes: { type: String, maxlength: 1000 },
    trackingNumber: { type: String },
    shipmozoOrderId: { type: String },
    shipmozoReferenceId: { type: String },
    awbNumber: { type: String },
    courierCompany: { type: String },
    estimatedDelivery: { type: Date },
    deliveredAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String, maxlength: 500 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);


OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ user: 1, createdAt: -1 });


OrderSchema.virtual("isDelivered").get(function (this: IOrderDocument) {
  return this.orderStatus === "delivered";
});

OrderSchema.virtual("isPaid").get(function (this: IOrderDocument) {
  return this.paymentStatus === "paid";
});


OrderSchema.pre("save", async function () {
  if (!this.orderNumber) {
    const datePart = new Date()
      .toISOString()
      .slice(2, 10)
      .replace(/-/g, ""); 
    const randomPart = Math.random()
      .toString(36)
      .substring(2, 8)
      .toUpperCase(); 
    this.orderNumber = `LM-${datePart}-${randomPart}`;
  }
});


const Order: Model<IOrderDocument> =
  mongoose.models.Order ||
  mongoose.model<IOrderDocument>("Order", OrderSchema);

export default Order;
