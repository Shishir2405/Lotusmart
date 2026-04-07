import type { Metadata } from "next";
import { getBreadcrumbJsonLd, siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Shop All Products — Premium Spices, Dry Fruits & Gifts | LotusMart",
  description:
    "Browse 200+ premium quality spices, dry fruits, nuts, seeds, and curated gift boxes at LotusMart. FSSAI certified, farm-fresh, and delivered across India. Free shipping above ₹499.",
  keywords: [
    "buy spices online India",
    "premium dry fruits online",
    "organic spices",
    "gift boxes online",
    "almonds cashews online",
    "LotusMart products",
  ],
  alternates: {
    canonical: "https://lotusmart.in/products",
  },
  openGraph: {
    type: "website",
    title: "Shop All Products — LotusMart",
    description: "Browse premium spices, dry fruits, nuts, seeds, and curated gift boxes. Free delivery above ₹499.",
    url: "https://lotusmart.in/products",
  },
};

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  const breadcrumbJsonLd = getBreadcrumbJsonLd([
    { name: "Home", url: siteConfig.url },
    { name: "Products", url: `${siteConfig.url}/products` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {children}
    </>
  );
}
