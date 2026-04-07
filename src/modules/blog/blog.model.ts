import mongoose, { Schema, Document, Model } from "mongoose";
import slugify from "slugify";
import type { IBlog } from "@/types";

export interface IBlogDocument extends Omit<IBlog, "_id">, Document {}

const BlogSchema = new Schema<IBlogDocument>(
  {
    title: { type: String, required: true, trim: true, maxlength: 300 },
    slug: { type: String, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, required: true, maxlength: 500 },
    content: { type: String, required: true },
    coverImage: { type: String, default: "" },
    author: { type: String, required: true, trim: true },
    tags: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    viewCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    metaTitle: { type: String, maxlength: 100 },
    metaDescription: { type: String, maxlength: 300 },
    publishedAt: { type: Date },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
);

BlogSchema.index({ status: 1, isActive: 1, publishedAt: -1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ title: "text", excerpt: "text", content: "text" });

BlogSchema.pre("save", async function () {
  if (this.isModified("title") || !this.slug) {
    const base = slugify(this.title, { lower: true, strict: true });
    let candidate = base;
    let attempt = 0;
    const BlogModel = this.constructor as Model<IBlogDocument>;

    while (
      await BlogModel.exists({
        slug: candidate,
        _id: { $ne: this._id },
      })
    ) {
      attempt++;
      candidate = `${base}-${attempt}`;
    }
    this.slug = candidate;
  }

  if (
    this.isModified("status") &&
    this.status === "published" &&
    !this.publishedAt
  ) {
    this.publishedAt = new Date();
  }
});

const Blog: Model<IBlogDocument> =
  mongoose.models.Blog ||
  mongoose.model<IBlogDocument>("Blog", BlogSchema);

export default Blog;
