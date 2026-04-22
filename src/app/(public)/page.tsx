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

const baseUrl = () =>
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? null;
  } catch {
    return null;
  }
}

function bannersToSlides(banners: BannerRecord[] | null): HeroSlide[] {
  if (!banners) return [];
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

export default async function HomePage() {
  const [heroBanners, promoBanners, faqConfig, whyConfig] = await Promise.all([
    fetchJson<BannerRecord[]>(`${baseUrl()}/api/banners?position=hero`),
    fetchJson<BannerRecord[]>(`${baseUrl()}/api/banners?position=sidebar`),
    fetchJson<{ value: { items?: unknown[] } | null }>(
      `${baseUrl()}/api/site-config?key=faq`,
    ),
    fetchJson<{ value: { items?: unknown[] } | null }>(
      `${baseUrl()}/api/site-config?key=why_choose_us`,
    ),
  ]);

  const heroSlides = bannersToSlides(heroBanners);
  const promoSlides = bannersToSlides(promoBanners);
  const faqItems = faqConfig?.value?.items ?? [];
  const whyItems = whyConfig?.value?.items ?? [];

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
