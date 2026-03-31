import mongoose, { Schema, Document, Model } from "mongoose";


export const SECTION_TYPES = [
  "hero_banners",
  "category_grid",
  "featured_products",
  "product_carousel",
  "banner_strip",
  "why_choose_us",
  "faq",
  "newsletter",
  "custom_products",
  "custom_html",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export interface ILandingSection {
  title: string;
  subtitle?: string;
  type: SectionType;
  isActive: boolean;
  sortOrder: number;
  products?: mongoose.Types.ObjectId[];
  categories?: mongoose.Types.ObjectId[];
  settings?: Record<string, unknown>;
}

export interface ILandingSectionDocument extends ILandingSection, Document {}

const LandingSectionSchema = new Schema<ILandingSectionDocument>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    type: {
      type: String,
      required: true,
      enum: SECTION_TYPES,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    products: [
      {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    categories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    settings: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  { timestamps: true },
);

LandingSectionSchema.index({ isActive: 1, sortOrder: 1 });

const LandingSection: Model<ILandingSectionDocument> =
  mongoose.models.LandingSection ||
  mongoose.model<ILandingSectionDocument>("LandingSection", LandingSectionSchema);

export default LandingSection;
