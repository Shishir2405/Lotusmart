import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — LotusMart | Tips, Recipes & Spice Guides",
  description:
    "Read the LotusMart blog for expert tips on spices, dry fruits, healthy recipes, gifting ideas, and more. Stay informed about premium Indian ingredients.",
  keywords: [
    "LotusMart blog",
    "spice guides",
    "dry fruit recipes",
    "Indian spices tips",
    "healthy cooking blog",
    "gift hamper ideas",
  ],
  alternates: {
    canonical: "https://lotusmart.in/blog",
  },
  openGraph: {
    type: "website",
    title: "LotusMart Blog — Tips, Recipes & Spice Guides",
    description: "Expert tips on spices, dry fruits, healthy recipes, and gifting ideas from LotusMart.",
    url: "https://lotusmart.in/blog",
  },
};

export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return children;
}
