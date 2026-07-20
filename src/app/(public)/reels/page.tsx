import type { Metadata } from "next";
import { ReelsGallery } from "@/components/shared/WatchAndBuy";

export const metadata: Metadata = {
  title: "Watch & Buy Reels — Shop Spices & Dry Fruits on Video | LotusMart",
  description:
    "Watch short LotusMart reels — recipes, unboxings and kitchen tips — and shop the exact spices, dry fruits and gift boxes featured in every clip.",
  keywords: [
    "LotusMart reels",
    "shoppable videos",
    "watch and buy",
    "spice recipe videos",
    "dry fruits video shopping",
  ],
  alternates: {
    canonical: "https://lotusmart.in/reels",
  },
  openGraph: {
    title: "Watch & Buy Reels — LotusMart",
    description:
      "Short, shoppable videos featuring LotusMart spices, dry fruits and gift boxes.",
    url: "https://lotusmart.in/reels",
    type: "website",
  },
};

export default function ReelsPage() {
  return <ReelsGallery />;
}
