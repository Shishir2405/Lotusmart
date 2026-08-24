import { notFound, permanentRedirect } from "next/navigation";
import { isValidObjectId } from "mongoose";
import connectDB from "@/lib/db";
import Product from "@/modules/products/product.model";
import Category from "@/modules/products/category.model";
import { ProductDetail } from "@/components/products/ProductDetail";
import { getProductJsonLd, getBreadcrumbJsonLd, siteConfig } from "@/config/site";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ id: string }>;
}

// Canonical lookup is by Mongo id. Legacy /products/<slug> links are 301-ed to
// the id URL by the page component below.
async function getProductById(id: string) {
  try {
    if (!isValidObjectId(id)) return null;
    await connectDB();
    const product = await Product.findOne({
      _id: id,
      isActive: true,
      showOnWebsite: { $ne: false },
    })
      .populate({ path: "category", model: Category, select: "name slug" })
      .lean();
    return product ? JSON.parse(JSON.stringify(product)) : null;
  } catch (err) {
    console.error("[ProductDetail] Failed to load product", id, err);
    return null;
  }
}

// Resolve an old slug URL to its product id so we can 301 to /products/<id>.
async function resolveSlugToId(slug: string): Promise<string | null> {
  try {
    await connectDB();
    const normalized = decodeURIComponent(slug).trim().toLowerCase();
    const product = await Product.findOne({
      slug: normalized,
      isActive: true,
      showOnWebsite: { $ne: false },
    })
      .select("_id")
      .lean();
    return product ? String(product._id) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = await getProductById(id);
  if (!product) return { title: "Product Not Found" };

  const title = product.metaTitle || `${product.name} — Buy Online at LotusMart`;
  const description =
    product.metaDescription ||
    product.shortDescription ||
    product.description?.slice(0, 160) ||
    `Buy ${product.name} online at LotusMart. Premium quality, fast delivery across India.`;
  const productUrl = `${siteConfig.url}/products/${product._id}`;
  const image = product.images?.[0];

  return {
    title,
    description,
    keywords: [
      product.name,
      `buy ${product.name} online`,
      product.category?.name,
      ...(product.tags ?? []),
      "LotusMart",
    ].filter(Boolean),
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: productUrl,
      siteName: siteConfig.name,
      images: image
        ? [{ url: image, width: 800, height: 800, alt: product.name }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { id } = await params;
  const product = await getProductById(id);

  if (!product) {
    // An old /products/<slug> link → 301 to the canonical id URL when resolvable.
    if (!isValidObjectId(id)) {
      const resolvedId = await resolveSlugToId(id);
      if (resolvedId) permanentRedirect(`/products/${resolvedId}`);
    }
    notFound();
  }

  const productUrl = `${siteConfig.url}/products/${product._id}`;

  const productJsonLd = getProductJsonLd({
    name: product.name,
    description: product.shortDescription || product.description?.slice(0, 300) || "",
    image: product.images?.[0] || "",
    price: product.price,
    currency: "INR",
    sku: product.sku,
    availability: product.stock > 0 ? "InStock" : "OutOfStock",
    ratingValue: product.ratings?.average,
    reviewCount: product.ratings?.count,
    url: productUrl,
  });

  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: "Home", url: siteConfig.url },
    { name: "Products", url: `${siteConfig.url}/products` },
    ...(product.category
      ? [{ name: product.category.name, url: `${siteConfig.url}/categories/${product.category.slug}` }]
      : []),
    { name: product.name, url: productUrl },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductDetail product={product} />
    </>
  );
}
