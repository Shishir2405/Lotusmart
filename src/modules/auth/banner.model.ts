import mongoose, { Schema, Document, Model } from "mongoose";
import type { IBanner, BannerPosition } from "@/types";


export interface IBannerDocument extends Omit<IBanner, "_id">, Document {}


const BannerSchema = new Schema<IBannerDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    subtitle: { type: String, trim: true, maxlength: 300 },
    image: { type: String, required: true },
    link: { type: String, trim: true },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
    position: {
      type: String,
      enum: ["hero", "sidebar", "category"] satisfies BannerPosition[],
      required: true,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);


BannerSchema.index({ position: 1, isActive: 1, sortOrder: 1 });


const Banner: Model<IBannerDocument> =
  mongoose.models.Banner ||
  mongoose.model<IBannerDocument>("Banner", BannerSchema);

export default Banner;
