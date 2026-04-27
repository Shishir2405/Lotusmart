import type { Metadata } from "next";
import { getFAQPageJsonLd } from "@/config/site";

const defaultFaqs = [
  {
    question: "Are all your products 100% natural with no additives?",
    answer: "Yes, every product we sell is free from artificial colours, flavours, preservatives, and fillers. We source directly from farms and small-batch processors.",
  },
  {
    question: "How do you ensure freshness across all products?",
    answer: "We operate on a tight rotation — products are replenished in small batches weekly. Whole spices are vacuum-sealed within 48 hours of packing.",
  },
  {
    question: "Do you offer organic-certified variants?",
    answer: "Yes. Our Organic Range carries full FSSAI organic certification. These are grown without synthetic pesticides, fertilisers, or GMOs.",
  },
  {
    question: "What is the delivery timeframe and cost?",
    answer: "Standard delivery takes 2-5 business days across India. Online (prepaid) orders ship free. Cash on Delivery orders carry a flat ₹100 handling fee.",
  },
  {
    question: "Do you ship to all pin codes in India?",
    answer: "We cover 19,000+ pin codes through our logistics partners. You can check your pin code eligibility at checkout.",
  },
  {
    question: "What is your return and refund policy?",
    answer: "We offer a no-questions-asked 7-day return window from the date of delivery. Full refund within 3-5 business days.",
  },
  {
    question: "What if my product arrives damaged or tampered?",
    answer: "Report it within 48 hours with a photo and we will send a replacement at no cost, typically within 2 days.",
  },
  {
    question: "Do you offer bulk or corporate orders?",
    answer: "Absolutely. We offer custom pricing for bulk orders and corporate gifting. Contact us for a personalized quote.",
  },
];

export const metadata: Metadata = {
  title: "FAQs — LotusMart | Shipping, Returns, Products & More",
  description:
    "Find answers to frequently asked questions about LotusMart — shipping times, return policy, product quality, organic certification, bulk orders, and more.",
  keywords: [
    "LotusMart FAQ",
    "LotusMart shipping",
    "LotusMart returns",
    "LotusMart delivery time",
    "organic spices FAQ",
    "dry fruits delivery India",
  ],
  alternates: {
    canonical: "https://lotusmart.in/faqs",
  },
};

export default function FAQsLayout({ children }: { children: React.ReactNode }) {
  const faqJsonLd = getFAQPageJsonLd(defaultFaqs);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      {children}
    </>
  );
}
