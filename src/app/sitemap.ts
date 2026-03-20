import type { MetadataRoute } from "next";
import connectDB from "@/lib/db";
import Product from "@/modules/products/product.model";
import Category from "@/modules/products/category.model";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages = [
    { url: APP_URL, changeFrequency: "daily" as const, priority: 1.0 },
    { url: `${APP_URL}/products`, changeFrequency: "daily" as const, priority: 0.9 },
    { url: `${APP_URL}/about`, changeFrequency: "monthly" as const, priority: 0.5 },
    { url: `${APP_URL}/contact`, changeFrequency: "monthly" as const, priority: 0.4 },
  ];

  try {
    await connectDB();

    const [products, categories] = await Promise.all([
      Product.find({ isActive: true }).select("slug updatedAt").lean(),
      Category.find({ isActive: true }).select("slug updatedAt").lean(),
    ]);

    const productPages = products.map((p) => ({
      url: `${APP_URL}/products/${p.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
      lastModified: p.updatedAt,
    }));

    const categoryPages = categories.map((c) => ({
      url: `${APP_URL}/categories/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
      lastModified: c.updatedAt,
    }));

    return [...staticPages, ...productPages, ...categoryPages];
  } catch {
    return staticPages;
  }
}
