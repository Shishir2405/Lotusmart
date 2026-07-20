import mongoose, { Schema, Document, Model } from "mongoose";
import type { ObjectId, Ref, Timestamps, IProduct } from "@/types";

/**
 * "Watch & Buy" reel — a short vertical shoppable video that links out to one
 * or more products. Ordered manually via `order` (ascending), newest-first as
 * the tie-breaker.
 */
export interface IReel extends Timestamps {
  _id: ObjectId;
  title: string;
  videoUrl: string;
  thumbnailUrl: string;
  caption?: string;
  products: Ref<IProduct>[];
  order: number;
  isActive: boolean;
  views: number;
  likes: number;
}

export interface IReelDocument extends Omit<IReel, "_id">, Document {}

const ReelSchema = new Schema<IReelDocument>(
  {
    title: { type: String, required: true, trim: true },
    videoUrl: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    caption: { type: String, trim: true },
    products: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    order: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0, min: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

ReelSchema.index({ isActive: 1, order: 1, createdAt: -1 });

const Reel: Model<IReelDocument> =
  mongoose.models.Reel || mongoose.model<IReelDocument>("Reel", ReelSchema);

export default Reel;
