import mongoose, { Schema, Document, Model } from "mongoose";
import type { ICart, ICartItem } from "@/types";


export interface ICartDocument extends Omit<ICart, "_id">, Document {
  
  addItem(item: {
    product: string;
    quantity: number;
    variant?: string;
    price: number;
  }): Promise<ICartDocument>;

  
  removeItem(productId: string, variant?: string): Promise<ICartDocument>;

  
  updateQuantity(
    productId: string,
    quantity: number,
    variant?: string,
  ): Promise<ICartDocument>;

  
  getTotal(): number;
}


const CartItemSchema = new Schema<ICartItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    quantity: { type: Number, required: true, min: 1, default: 1 },
    variant: { type: String },
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);


const CartSchema = new Schema<ICartDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      sparse: true,
    },
    deviceId: {
      type: String,
      sparse: true,
    },
    items: { type: [CartItemSchema], default: [] },
    couponCode: { type: String, trim: true },
    discount: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);


CartSchema.index({ user: 1 }, { unique: true, sparse: true });
CartSchema.index({ deviceId: 1 }, { unique: true, sparse: true });


CartSchema.methods.addItem = async function (
  this: ICartDocument,
  item: { product: string; quantity: number; variant?: string; price: number },
): Promise<ICartDocument> {
  const existing = this.items.find(
    (i) => i.product.toString() === item.product && i.variant === item.variant,
  );

  if (existing) {
    existing.quantity += item.quantity;
    existing.price = item.price; 
  } else {
    this.items.push({
      product: new mongoose.Types.ObjectId(item.product) as any,
      quantity: item.quantity,
      variant: item.variant,
      price: item.price,
    });
  }

  return this.save();
};


CartSchema.methods.removeItem = async function (
  this: ICartDocument,
  productId: string,
  variant?: string,
): Promise<ICartDocument> {
  this.items = this.items.filter(
    (i) =>
      !(i.product.toString() === productId && i.variant === variant),
  ) as typeof this.items;

  return this.save();
};


CartSchema.methods.updateQuantity = async function (
  this: ICartDocument,
  productId: string,
  quantity: number,
  variant?: string,
): Promise<ICartDocument> {
  if (quantity <= 0) {
    return this.removeItem(productId, variant);
  }

  const item = this.items.find(
    (i) => i.product.toString() === productId && i.variant === variant,
  );

  if (item) {
    item.quantity = quantity;
  }

  return this.save();
};


CartSchema.methods.getTotal = function (this: ICartDocument): number {
  const subtotal = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  return Math.max(subtotal - this.discount, 0);
};


const Cart: Model<ICartDocument> =
  mongoose.models.Cart || mongoose.model<ICartDocument>("Cart", CartSchema);

export default Cart;
