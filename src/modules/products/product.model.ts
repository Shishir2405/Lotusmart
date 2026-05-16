import mongoose, { Schema, Document, Model } from "mongoose";
import slugify from "slugify";
import type {
  IProduct,
  IProductVariant,
  IProductVariantOption,
  IBulkPricing,
  INutritionInfo,
  IProductDimensions,
  ProductUnit,
  ProductType,
} from "@/types";


export interface IProductDocument extends Omit<IProduct, "_id">, Document {
  
  isInStock: boolean;
  
  discountPercentage: number;
}


const BulkPricingSchema = new Schema<IBulkPricing>(
  {
    minQty: { type: Number, required: true, min: 1 },
    maxQty: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    unit: {
      type: String,
      enum: ["kg", "g", "pieces", "pack", "ml", "L", "box"] satisfies ProductUnit[],
      required: true,
    },
  },
  { _id: false },
);

const NutritionInfoSchema = new Schema<INutritionInfo>(
  {
    servingSize: { type: String, trim: true },
    calories: { type: Number, min: 0 },
    totalFat: { type: Number, min: 0 },
    saturatedFat: { type: Number, min: 0 },
    transFat: { type: Number, min: 0 },
    cholesterol: { type: Number, min: 0 },
    sodium: { type: Number, min: 0 },
    totalCarbs: { type: Number, min: 0 },
    dietaryFiber: { type: Number, min: 0 },
    sugars: { type: Number, min: 0 },
    protein: { type: Number, min: 0 },
    vitamins: { type: Map, of: String },
    minerals: { type: Map, of: String },
  },
  { _id: false },
);

const DimensionsSchema = new Schema<IProductDimensions>(
  {
    length: { type: Number, min: 0 },
    width: { type: Number, min: 0 },
    height: { type: Number, min: 0 },
    unit: { type: String, enum: ["cm", "in"], default: "cm" },
  },
  { _id: false },
);

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


const ProductSchema = new Schema<IProductDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true },
    shortDescription: { type: String, maxlength: 500 },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
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
      enum: ["kg", "g", "pieces", "pack", "ml", "L", "box"] satisfies ProductUnit[],
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

    
    brand: { type: String, trim: true },
    manufacturer: { type: String, trim: true },
    countryOfOrigin: { type: String, trim: true, default: "India" },
    hsn: { type: String, trim: true },
    gstRate: { type: Number, enum: [0, 5, 12, 18, 28] },
    pricePerKg: { type: Number, min: 0 },
    pricePerGram: { type: Number, min: 0 },
    pricePerUnit: { type: Number, min: 0 },
    bulkPricing: { type: [BulkPricingSchema], default: [] },
    shelfLife: { type: String, trim: true },
    bestBefore: { type: Date },
    nutritionInfo: { type: NutritionInfoSchema },
    ingredients: { type: String },
    allergens: { type: [String], default: [] },
    certifications: { type: [String], default: [] },
    fssaiLicense: { type: String, trim: true },
    isOrganic: { type: Boolean, default: false },
    isVegan: { type: Boolean, default: false },
    isGlutenFree: { type: Boolean, default: false },
    productType: {
      type: String,
      enum: [
        "spice",
        "dry_fruit",
        "gifting",
        "herb",
        "honey",
        "superfood",
        "nuts",
        "seeds",
        "dates",
        "dried_fruit",
        "mix",
        "combo",
      ] satisfies ProductType[],
      index: true,
    },
    dimensions: { type: DimensionsSchema },
    shippingWeight: { type: Number, min: 0 },
    minOrderQuantity: { type: Number, min: 1, default: 1 },
    maxOrderQuantity: { type: Number, min: 1 },
    returnPolicy: { type: String, trim: true },
    warranty: { type: String, trim: true },
    videoUrl: { type: String, trim: true },
    metaTitle: { type: String, trim: true, maxlength: 70 },
    metaDescription: { type: String, trim: true, maxlength: 160 },
    lastPriceUpdate: { type: Date, index: true },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);


ProductSchema.index(
  { name: "text", description: "text", tags: "text" },
  { weights: { name: 10, tags: 5, description: 1 } },
);


ProductSchema.index({ category: 1, isActive: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ isActive: 1, price: 1 });
ProductSchema.index({ isFeatured: 1, isActive: 1 });


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


ProductSchema.pre("save", async function () {
  if (this.isModified("name") || !this.slug) {
    const base = slugify(this.name, { lower: true, strict: true });

    
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


const Product: Model<IProductDocument> =
  mongoose.models.Product ||
  mongoose.model<IProductDocument>("Product", ProductSchema);

export default Product;
