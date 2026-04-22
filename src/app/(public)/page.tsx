import { Suspense } from "react";
import { HeroSection } from "@/components/shared/HeroSection";
import { CategoryGrid } from "@/components/products/CategoryGrid";
import { FeaturedProducts } from "@/components/products/FeaturedProducts";
import { WhyChooseUs } from "@/components/shared/WhyChooseUs";
import { BannerStrip } from "@/components/shared/BannerStrip";
import { FAQSection } from "@/components/shared/FAQSection";
import { ProductGridSkeleton } from "@/components/ui/Skeleton";
import connectDB from "@/lib/db";
import Banner from "@/modules/auth/banner.model";
import SiteConfig from "@/modules/settings/site-config.model";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "LotusMart — Premium Spices, Dry Fruits & Gift Boxes | Buy Online India",
  description:
    "Shop the finest quality spices, dry fruits, and curated gift boxes at LotusMart. FSSAI certified, farm-fresh whole spices, organic masalas, almonds, cashews, pistachios, and beautifully packed gift hampers. Free delivery across India on orders above ₹499.",
  alternates: {
    canonical: "https://lotusmart.in",
  },
};

type ColorScheme = "amber" | "olive" | "rose" | "emerald" | "sky";

interface BannerRecord {
  _id: string;
  image: string;
  title: string;
  subtitle?: string;
  link?: string;
  position: string;
  isActive: boolean;
  sortOrder: number;
  colorScheme?: ColorScheme;
}

interface HeroSlide {
  image: string;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaLink: string;
  colorScheme?: ColorScheme;
}

function bannersToSlides(banners: BannerRecord[]): HeroSlide[] {
  return banners
    .filter((b) => b?.image)
    .map((b) => ({
      image: b.image,
      title: b.title ?? "",
      subtitle: b.subtitle ?? "",
      ctaText: "",
      ctaLink: b.link ?? "/products",
      colorScheme: b.colorScheme,
    }));
}

async function loadLandingData() {
  try {
    await connectDB();
    const [heroBanners, promoBanners, faqDoc, whyDoc] = await Promise.all([
      Banner.find({ position: "hero", isActive: true })
        .sort({ sortOrder: 1 })
        .lean<BannerRecord[]>(),
      Banner.find({ position: "sidebar", isActive: true })
        .sort({ sortOrder: 1 })
        .lean<BannerRecord[]>(),
      SiteConfig.findOne({ key: "faq" }).lean<{ value?: { items?: unknown[] } }>(),
      SiteConfig.findOne({ key: "why_choose_us" }).lean<{
        value?: { items?: unknown[] };
      }>(),
    ]);
    return {
      heroBanners: heroBanners ?? [],
      promoBanners: promoBanners ?? [],
      faqItems: (faqDoc?.value?.items as unknown[]) ?? [],
      whyItems: (whyDoc?.value?.items as unknown[]) ?? [],
    };
  } catch {
    return { heroBanners: [], promoBanners: [], faqItems: [], whyItems: [] };
  }
}

export default async function HomePage() {
  const { heroBanners, promoBanners, faqItems, whyItems } = await loadLandingData();

  const heroSlides = bannersToSlides(heroBanners);
  const promoSlides = bannersToSlides(promoBanners);

  const primaryPromo = promoSlides[0];

  return (
    <>
      <HeroSection settings={{ slides: heroSlides }} />

      <CategoryGrid />

      <Suspense fallback={<ProductGridSkeleton />}>
        <FeaturedProducts />
      </Suspense>

      <BannerStrip
        settings={
          primaryPromo
            ? {
                image: primaryPromo.image,
                title: primaryPromo.title,
                subtitle: primaryPromo.subtitle,
                link: primaryPromo.ctaLink,
              }
            : undefined
        }
      />

      <WhyChooseUs
        settings={{
          items: whyItems as { icon: string; title: string; description: string }[],
        }}
      />

      <FAQSection
        settings={{
          items: (faqItems as { question?: string; answer?: string }[])
            .map((i) => ({
              q: i.question ?? "",
              a: i.answer ?? "",
            }))
            .filter((i) => i.q && i.a),
        }}
      />
    </>
  );
}
