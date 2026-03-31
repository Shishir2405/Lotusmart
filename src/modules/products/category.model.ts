import mongoose, { Schema, Document, Model } from "mongoose";
import slugify from "slugify";
import type { ICategory } from "@/types";


export interface ICategoryDocument extends Omit<ICategory, "_id">, Document {}


const CategorySchema = new Schema<ICategoryDocument>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    description: { type: String, maxlength: 500 },
    image: { type: String },
    parent: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);


CategorySchema.index({ parent: 1 });
CategorySchema.index({ isActive: 1, sortOrder: 1 });


CategorySchema.virtual("children", {
  ref: "Category",
  localField: "_id",
  foreignField: "parent",
});


CategorySchema.pre("save", async function () {
  if (this.isModified("name") || !this.slug) {
    const base = slugify(this.name, { lower: true, strict: true });

    let candidate = base;
    let attempt = 0;
    const CategoryModel = this.constructor as Model<ICategoryDocument>;

    while (
      await CategoryModel.exists({
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


const Category: Model<ICategoryDocument> =
  mongoose.models.Category ||
  mongoose.model<ICategoryDocument>("Category", CategorySchema);

export default Category;
