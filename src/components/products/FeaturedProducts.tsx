import { ProductCard } from "./ProductCard";
import connectDB from "@/lib/db";
import Product from "@/modules/products/product.model";

async function getFeaturedProducts() {
  try {
    await connectDB();
    const products = await Product.find({ isActive: true, isFeatured: true })
      .populate("category", "name slug")
      .sort({ "ratings.count": -1 })
      .limit(8)
      .lean();
    return JSON.parse(JSON.stringify(products));
  } catch {
    return [];
  }
}

export async function FeaturedProducts() {
  const products = await getFeaturedProducts();

  if (!products.length) return null;

  return (
    <section className="container-wide py-12">
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-neutral-900 mb-1">Featured Products</h2>
          <p className="text-neutral-500">Handpicked favourites this season</p>
        </div>
        <a
          href="/products?featured=true"
          className="text-sm font-semibold text-[#E84672] hover:underline underline-offset-2 hidden sm:block"
        >
          View all →
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {products.map((p: Parameters<typeof ProductCard>[0]["product"]) => (
          <ProductCard key={p._id as string} product={p} />
        ))}
      </div>
    </section>
  );
}
