import { Suspense } from "react";
import { HeroSection } from "@/components/shared/HeroSection";
import { CategoryGrid } from "@/components/products/CategoryGrid";
import { FeaturedProducts } from "@/components/products/FeaturedProducts";
import { WhyChooseUs } from "@/components/shared/WhyChooseUs";
import { BannerStrip } from "@/components/shared/BannerStrip";
import { FAQSection } from "@/components/shared/FAQSection";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LotusMart — Premium Spices, Dry Fruits & Gift Boxes",
  description:
    "Shop the finest quality spices, dry fruits, and curated gift boxes at LotusMart. Fresh, authentic, and delivered to your door.",
};

export default function HomePage() {
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
