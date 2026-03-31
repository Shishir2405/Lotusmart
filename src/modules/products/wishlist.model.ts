import mongoose, { Schema, Document, Model } from "mongoose";
import type { IWishlist, IWishlistItem } from "@/types";

// ──────────────────────────────────────────────
// Document interface
// ──────────────────────────────────────────────
export interface IWishlistDocument extends Omit<IWishlist, "_id">, Document {}

// ──────────────────────────────────────────────
// Sub-schema
// ──────────────────────────────────────────────
const WishlistItemSchema = new Schema<IWishlistItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    addedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

// ──────────────────────────────────────────────
// Main schema
// ──────────────────────────────────────────────
const WishlistSchema = new Schema<IWishlistDocument>(
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
    items: { type: [WishlistItemSchema], default: [] },
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
WishlistSchema.index({ user: 1 }, { unique: true, sparse: true });
WishlistSchema.index({ deviceId: 1 }, { unique: true, sparse: true });

// ──────────────────────────────────────────────
// Export
// ──────────────────────────────────────────────
const Wishlist: Model<IWishlistDocument> =
  mongoose.models.Wishlist ||
  mongoose.model<IWishlistDocument>("Wishlist", WishlistSchema);

export default Wishlist;
