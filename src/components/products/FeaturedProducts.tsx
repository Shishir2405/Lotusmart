import connectDB from "@/lib/db";
import Product from "@/modules/products/product.model";
import type { ProductCardData } from "./ProductCard";
import { FeaturedProductsClient } from "./FeaturedProductsClient";


async function getFeaturedProducts() {
  try {
    await connectDB();
    const products = await Product.find({
      isActive: true,
      isFeatured: true,
      // Grocery-only products (app, Indore) never surface on the website.
      showOnWebsite: { $ne: false },
    })
      .populate("category", "name slug")
      .sort({ "ratings.count": -1 })
      .limit(8)
      .lean();
    return JSON.parse(JSON.stringify(products)) as ProductCardData[];
  } catch {
    return [] as ProductCardData[];
  }
}
export async function FeaturedProducts() {
  const products = await getFeaturedProducts();
  if (!products.length) return null;

  return <FeaturedProductsClient products={products} />;
}
