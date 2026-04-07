import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Search Products — LotusMart",
  description:
    "Search for premium spices, dry fruits, gift boxes, and more at LotusMart. Find exactly what you need with instant results.",
  alternates: {
    canonical: "https://lotusmart.in/search",
  },
  robots: {
    index: false,
    follow: true,
  },
};

export default function SearchLayout({ children }: { children: React.ReactNode }) {
  return children;
}
