import { Metadata } from "next";
import { notFound } from "next/navigation";
import connectDB from "@/lib/db";
import Category from "@/modules/products/category.model";
import Product from "@/modules/products/product.model";
import { ProductCard } from "@/components/products/ProductCard";
import { normalizeImageUrl } from "@/utils/helpers";
import { getCollectionPageJsonLd, getBreadcrumbJsonLd, siteConfig } from "@/config/site";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  await connectDB();
  const { slug } = await params;
  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) return { title: "Category Not Found" };

  const title = `${category.name} — Buy Premium ${category.name} Online | LotusMart`;
  const description =
    category.description ||
    `Shop premium quality ${category.name.toLowerCase()} at LotusMart. FSSAI certified, farm-fresh, and delivered across India. Free delivery on orders above ₹499.`;
  const categoryUrl = `${siteConfig.url}/categories/${category.slug}`;

  return {
    title,
    description,
    keywords: [
      category.name,
      `buy ${category.name.toLowerCase()} online`,
      `${category.name.toLowerCase()} online India`,
      `premium ${category.name.toLowerCase()}`,
      "LotusMart",
    ],
    alternates: {
      canonical: categoryUrl,
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: categoryUrl,
      siteName: siteConfig.name,
      images: category.image
        ? [{ url: normalizeImageUrl(category.image), width: 1200, height: 630, alt: category.name }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: category.image ? [normalizeImageUrl(category.image)] : [],
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  await connectDB();
  const { slug } = await params;

  const category = await Category.findOne({ slug, isActive: true }).lean();
  if (!category) notFound();

  const descendantIds = new Set<string>([category._id.toString()]);
  let frontier: typeof category._id[] = [category._id];
  while (frontier.length) {
    const kids = await Category.find({ parent: { $in: frontier }, isActive: true })
      .select("_id")
      .lean();
    const next: typeof frontier = [];
    for (const k of kids) {
      const s = k._id.toString();
      if (!descendantIds.has(s)) {
        descendantIds.add(s);
        next.push(k._id);
      }
    }
    frontier = next;
  }

  const categoryIds = Array.from(descendantIds);

  const products = await Product.find({
    isActive: true,
    $or: [
      { category: { $in: categoryIds } },
      { subcategory: { $in: categoryIds } },
      { subcategory: { $in: [category.name, category.slug] } },
    ],
  })
    .sort({ isFeatured: -1, createdAt: -1 })
    .limit(48)
    .lean();

  const categoryUrl = `${siteConfig.url}/categories/${category.slug}`;

  const collectionJsonLd = getCollectionPageJsonLd({
    name: category.name,
    description: category.description,
    url: categoryUrl,
    products: products.map((p) => ({
      name: p.name,
      url: `${siteConfig.url}/products/${p._id}`,
      image: p.images?.[0],
      price: p.price,
    })),
  });

  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: "Home", url: siteConfig.url },
    { name: "Categories", url: `${siteConfig.url}/products` },
    { name: category.name, url: categoryUrl },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="container-wide py-10">

        <div className="mb-8">
          {category.image && (
            <div className="relative h-40 md:h-56 rounded-2xl overflow-hidden mb-6">

              <img src={normalizeImageUrl(category.image)} alt={category.name} className="w-full h-full object-cover" />
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
            <div className="text-neutral-300 mb-4 flex justify-center"><svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg></div>
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
    </>
  );
}
