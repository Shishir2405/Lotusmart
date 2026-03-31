import mongoose, { Schema, Document, Model } from "mongoose";
import type { ICart, ICartItem } from "@/types";

// ──────────────────────────────────────────────
// Document interface
// ──────────────────────────────────────────────
export interface ICartDocument extends Omit<ICart, "_id">, Document {
  /** Add a product (or increment its quantity if already in cart) */
  addItem(item: {
    product: string;
    quantity: number;
    variant?: string;
    price: number;
  }): Promise<ICartDocument>;

  /** Remove a product from the cart */
  removeItem(productId: string, variant?: string): Promise<ICartDocument>;

  /** Update the quantity of an existing cart item */
  updateQuantity(
    productId: string,
    quantity: number,
    variant?: string,
  ): Promise<ICartDocument>;

  /** Calculate the cart total (sum of price * quantity minus discount) */
  getTotal(): number;
}

// ──────────────────────────────────────────────
// Sub-schema
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// Main schema
// ──────────────────────────────────────────────
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

// ──────────────────────────────────────────────
// Indexes
// ──────────────────────────────────────────────
CartSchema.index({ user: 1 }, { unique: true, sparse: true });
CartSchema.index({ deviceId: 1 }, { unique: true, sparse: true });

// ──────────────────────────────────────────────
// Instance methods
// ──────────────────────────────────────────────

/**
 * Add a product to the cart. If the same product + variant already exists,
 * increment the quantity instead of duplicating.
 */
CartSchema.methods.addItem = async function (
  this: ICartDocument,
  item: { product: string; quantity: number; variant?: string; price: number },
): Promise<ICartDocument> {
  const existing = this.items.find(
    (i) => i.product.toString() === item.product && i.variant === item.variant,
  );

  if (existing) {
    existing.quantity += item.quantity;
    existing.price = item.price; // update to latest price
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

/**
 * Remove a product (and optionally a specific variant) from the cart.
 */
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

/**
 * Update the quantity for an existing cart item.
 * Removes the item when quantity <= 0.
 */
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

/**
 * Calculate the cart total (subtotal minus discount).
 */
CartSchema.methods.getTotal = function (this: ICartDocument): number {
  const subtotal = this.items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  return Math.max(subtotal - this.discount, 0);
};

// ──────────────────────────────────────────────
// Export
// ──────────────────────────────────────────────
const Cart: Model<ICartDocument> =
  mongoose.models.Cart || mongoose.model<ICartDocument>("Cart", CartSchema);

export default Cart;
