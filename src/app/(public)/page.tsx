import { Suspense } from "react";
import { HeroSection } from "@/components/shared/HeroSection";
import { CategoryGrid } from "@/components/products/CategoryGrid";
import { FeaturedProducts } from "@/components/products/FeaturedProducts";
import { WhyChooseUs } from "@/components/shared/WhyChooseUs";
import { BannerStrip } from "@/components/shared/BannerStrip";
import { FAQSection } from "@/components/shared/FAQSection";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import { DynamicLandingSections } from "@/components/shared/DynamicLandingSections";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LotusMart — Premium Spices, Dry Fruits & Gift Boxes | Buy Online India",
  description:
    "Shop the finest quality spices, dry fruits, and curated gift boxes at LotusMart. FSSAI certified, farm-fresh whole spices, organic masalas, almonds, cashews, pistachios, and beautifully packed gift hampers. Free delivery across India on orders above ₹499.",
  alternates: {
    canonical: "https://lotusmart.in",
  },
};

async function getLandingSections() {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(`${baseUrl}/api/landing-sections`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data ?? null;
  } catch {
    return null;
  }
}

export default async function HomePage() {
  const sections = await getLandingSections();

  
  if (!sections || sections.length === 0) {
    return (
      <>
        <HeroSection />
        <CategoryGrid />
        <Suspense fallback={<ProductGridSkeleton />}>
          <FeaturedProducts />
        </Suspense>
        <BannerStrip />
        <WhyChooseUs />
        <FAQSection />
      </>
    );
  }

  
  return (
    <>
      
      {sections.map((section: any) => {
        switch (section.type) {
          case "hero_banners":
            return <HeroSection key={section._id} settings={section.settings} />;
          case "category_grid":
            return <CategoryGrid key={section._id} />;
          case "featured_products":
            return (
              <Suspense key={section._id} fallback={<ProductGridSkeleton />}>
                <FeaturedProducts />
              </Suspense>
            );
          case "product_carousel":
            return (
              <Suspense key={section._id} fallback={<ProductGridSkeleton />}>
                <DynamicLandingSections section={section} />
              </Suspense>
            );
          case "custom_products":
            return (
              <Suspense key={section._id} fallback={<ProductGridSkeleton />}>
                <DynamicLandingSections section={section} />
              </Suspense>
            );
          case "banner_strip":
            return <BannerStrip key={section._id} settings={section.settings} />;
          case "why_choose_us":
            return <WhyChooseUs key={section._id} settings={section.settings} />;
          case "faq":
            return <FAQSection key={section._id} />;
          case "newsletter":
            return (
              <DynamicLandingSections key={section._id} section={section} />
            );
          case "custom_html":
            return (
              <DynamicLandingSections key={section._id} section={section} />
            );
          default:
            return (
              <DynamicLandingSections key={section._id} section={section} />
            );
        }
      })}
    </>
  );
}
