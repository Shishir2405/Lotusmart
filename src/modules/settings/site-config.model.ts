import mongoose, { Schema, Document, Model } from "mongoose";


export interface ISiteConfig {
  key: string;
  value: Record<string, unknown>;
  updatedBy?: mongoose.Types.ObjectId;
}

export interface ISiteConfigDocument extends ISiteConfig, Document {}

const SiteConfigSchema = new Schema<ISiteConfigDocument>(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    value: {
      type: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true },
);

const SiteConfig: Model<ISiteConfigDocument> =
  mongoose.models.SiteConfig ||
  mongoose.model<ISiteConfigDocument>("SiteConfig", SiteConfigSchema);

export default SiteConfig;


export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
}

export interface ContactConfig {
  email: string;
  phone: string;
  whatsapp?: string;
  address: string;
  mapEmbedUrl?: string;
  socialLinks: {
    instagram?: string;
    facebook?: string;
    twitter?: string;
    youtube?: string;
    whatsapp?: string;
  };
  businessHours?: string;
}

export interface PageContent {
  title: string;
  content: string; 
  lastUpdated: string;
}

export type SiteConfigKey =
  | "faq"
  | "contact"
  | "terms"
  | "privacy"
  | "refund"
  | "shipping"
  | "about";
