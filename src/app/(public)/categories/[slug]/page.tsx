import { Metadata } from "next";
import { notFound } from "next/navigation";
import connectDB from "@/lib/db";
import Category from "@/modules/products/category.model";
import Product from "@/modules/products/product.model";
import { ProductCard } from "@/components/products/ProductCard";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await connectDB();
  const { slug } = await params;
  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) return { title: "Category Not Found" };
  return {
    title: `${category.name} — LotusMart`,
    description: category.description ?? `Shop ${category.name} at LotusMart — premium quality, fast delivery.`,
  };
}

export default async function CategoryPage({ params }: PageProps) {
  await connectDB();
  const { slug } = await params;

  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) notFound();

  const products = await Product.find({ category: category._id, isActive: true })
    .sort({ isFeatured: -1, createdAt: -1 })
    .limit(48)
    .lean();

  return (
    <div className="container-wide py-10">
      {/* Category header */}
      <div className="mb-8">
        {category.image && (
          <div className="relative h-40 md:h-56 rounded-2xl overflow-hidden mb-6">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <div className="absolute bottom-6 left-6">
              <h1 className="text-3xl font-bold text-white">{category.name}</h1>
              {category.description && (
                <p className="text-white/80 text-sm mt-1 max-w-md">{category.description}</p>
              )}
            </div>
          </div>
        )}
        {!category.image && (
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">{category.name}</h1>
            {category.description && (
              <p className="text-neutral-500 mt-2 max-w-xl">{category.description}</p>
            )}
          </div>
        )}
        <p className="text-sm text-neutral-400 mt-2">{products.length} product{products.length !== 1 ? "s" : ""}</p>
      </div>

      {products.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">🌿</div>
          <p className="text-neutral-500 text-lg">No products in this category yet.</p>
          <p className="text-neutral-400 text-sm mt-1">Check back soon!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {products.map((product) => (
            <ProductCard
              key={product._id.toString()}
              product={{
                _id: product._id.toString(),
                name: product.name,
                slug: product.slug,
                images: product.images,
                price: product.price,
                compareAtPrice: product.compareAtPrice,
                stock: product.stock,
                unit: product.unit,
                isFeatured: product.isFeatured,
                ratings: product.ratings,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
