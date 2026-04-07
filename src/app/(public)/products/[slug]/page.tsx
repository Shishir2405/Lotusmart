import { notFound } from "next/navigation";
import connectDB from "@/lib/db";
import Product from "@/modules/products/product.model";
import { ProductDetail } from "@/components/products/ProductDetail";
import { getProductJsonLd, getBreadcrumbJsonLd, siteConfig } from "@/config/site";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

async function getProduct(slug: string) {
  try {
    await connectDB();
    const product = await Product.findOne({ slug, isActive: true })
      .populate("category", "name slug")
      .lean();
    return product ? JSON.parse(JSON.stringify(product)) : null;
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Product Not Found" };

  const title = product.metaTitle || `${product.name} — Buy Online at LotusMart`;
  const description =
    product.metaDescription ||
    product.shortDescription ||
    product.description?.slice(0, 160) ||
    `Buy ${product.name} online at LotusMart. Premium quality, fast delivery across India.`;
  const productUrl = `${siteConfig.url}/products/${product.slug}`;
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
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const productUrl = `${siteConfig.url}/products/${product.slug}`;

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
