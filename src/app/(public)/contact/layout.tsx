import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us — LotusMart | Get in Touch for Orders, Queries & Support",
  description:
    "Reach out to LotusMart for order inquiries, product questions, bulk orders, corporate gifting, or general support. Available Monday to Saturday, 9 AM to 7 PM.",
  keywords: [
    "contact LotusMart",
    "LotusMart support",
    "LotusMart customer service",
    "bulk order inquiry",
    "corporate gifting India",
  ],
  alternates: {
    canonical: "https://lotusmart.in/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return children;
}
