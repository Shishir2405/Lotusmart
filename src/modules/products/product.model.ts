import mongoose, { Schema, Document, Model } from "mongoose";
import slugify from "slugify";
import type {
  IProduct,
  IProductVariant,
  IProductVariantOption,
  ProductUnit,
} from "@/types";

// ──────────────────────────────────────────────
// Document interface
// ──────────────────────────────────────────────
export interface IProductDocument extends Omit<IProduct, "_id">, Document {
  /** Virtual: true when stock > 0 */
  isInStock: boolean;
  /** Virtual: percentage discount (0 when no compareAtPrice) */
  discountPercentage: number;
}

// ──────────────────────────────────────────────
// Sub-schemas
// ──────────────────────────────────────────────
const VariantOptionSchema = new Schema<IProductVariantOption>(
  {
    name: { type: String, required: true, trim: true },
    value: { type: String, required: true, trim: true },
    priceAdjustment: { type: Number, default: 0 },
    stock: { type: Number, default: 0, min: 0 },
  },
  { _id: false },
);

const VariantSchema = new Schema<IProductVariant>(
  {
    name: { type: String, required: true, trim: true },
    options: { type: [VariantOptionSchema], default: [] },
  },
  { _id: false },
);

// ──────────────────────────────────────────────
// Main schema
// ──────────────────────────────────────────────
const ProductSchema = new Schema<IProductDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 500 },
    images: { type: [String], default: [] },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
      index: true,
    },
    subcategory: { type: String, trim: true },
    price: { type: Number, required: true, min: 0 },
    compareAtPrice: { type: Number, min: 0 },
    costPrice: { type: Number, min: 0 },
    sku: { type: String, required: true, unique: true, trim: true },
    barcode: { type: String, trim: true },
    weight: { type: Number, min: 0 },
    unit: {
      type: String,
      enum: ["kg", "g", "pieces", "pack"] satisfies ProductUnit[],
      default: "pieces",
    },
    stock: { type: Number, required: true, default: 0, min: 0 },
    lowStockThreshold: { type: Number, default: 5, min: 0 },
    isActive: { type: Boolean, default: true },
    isFeatured: { type: Boolean, default: false },
    tags: { type: [String], default: [] },
    variants: { type: [VariantSchema], default: [] },
    ratings: {
      average: { type: Number, default: 0, min: 0, max: 5 },
      count: { type: Number, default: 0, min: 0 },
    },
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
// Text index for full-text search
ProductSchema.index(
  { name: "text", description: "text", tags: "text" },
  { weights: { name: 10, tags: 5, description: 1 } },
);

// Compound indexes for common queries
ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ isActive: 1, price: 1 });
ProductSchema.index({ isFeatured: 1, isActive: 1 });

// ──────────────────────────────────────────────
// Virtuals
// ──────────────────────────────────────────────
ProductSchema.virtual("isInStock").get(function (this: IProductDocument) {
  return this.stock > 0;
});

ProductSchema.virtual("discountPercentage").get(function (
  this: IProductDocument,
) {
  if (!this.compareAtPrice || this.compareAtPrice <= this.price) return 0;
  return Math.round(
    ((this.compareAtPrice - this.price) / this.compareAtPrice) * 100,
  );
});

// ──────────────────────────────────────────────
// Pre-save hook: auto-generate slug from name
// ──────────────────────────────────────────────
ProductSchema.pre("save", async function () {
  if (this.isModified("name") || !this.slug) {
    const base = slugify(this.name, { lower: true, strict: true });

    // Ensure uniqueness by appending a short suffix when needed
    let candidate = base;
    let attempt = 0;
    const ProductModel = this.constructor as Model<IProductDocument>;

    while (
      await ProductModel.exists({
        slug: candidate,
        _id: { $ne: this._id },
      })
    ) {
      attempt++;
      candidate = `${base}-${attempt}`;
    }

    this.slug = candidate;
  }
});

// ──────────────────────────────────────────────
// Export
// ──────────────────────────────────────────────
const Product: Model<IProductDocument> =
  mongoose.models.Product ||
  mongoose.model<IProductDocument>("Product", ProductSchema);

export default Product;
