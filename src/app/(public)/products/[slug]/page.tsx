import { notFound } from "next/navigation";
import connectDB from "@/lib/db";
import Product from "@/modules/products/product.model";
import { ProductDetail } from "@/components/products/ProductDetail";
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
  return {
    title: `${product.name} — LotusMart`,
    description: product.shortDescription ?? product.description?.slice(0, 160),
    openGraph: {
      images: product.images?.[0] ? [{ url: product.images[0] }] : [],
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();
  return <ProductDetail product={product} />;
}
