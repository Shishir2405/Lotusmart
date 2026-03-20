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
    <section style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
      <div className="container-wide">
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            marginBottom: "2.5rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <h2
              style={{
                fontSize: "clamp(1.75rem, 3vw, 2.25rem)",
                fontWeight: 700,
                color: "#1c1917",
                marginBottom: "0.375rem",
              }}
            >
              Featured Products
            </h2>
            <p style={{ color: "#78716c", fontSize: "1rem", margin: 0 }}>
              Handpicked favourites this season
            </p>
          </div>
          <a
            href="/products?featured=true"
            style={{
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#E84672",
              textDecoration: "none",
            }}
          >
            View all →
          </a>
        </div>

        {/* Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "1rem",
          }}
          className="product-grid"
        >
          {products.map((p: Parameters<typeof ProductCard>[0]["product"]) => (
            <ProductCard key={p._id as string} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
