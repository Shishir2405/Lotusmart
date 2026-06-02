import Link from "next/link";
import {
  RiHomeLine,
  RiCalendarLine,
  RiArrowRightLine,
} from "react-icons/ri";
import type { Metadata } from "next";
import { PolicyEmptyState } from "@/components/shared/PolicyEmptyState";
import { getContactInfo } from "@/lib/get-contact-info";

export const metadata: Metadata = {
  title: "About Us — LotusMart",
  description:
    "Learn more about LotusMart.",
  alternates: {
    canonical: "https://lotusmart.in/about",
  },
};

async function getAboutData() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/site-config?key=about`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.value ?? null;
  } catch {
    return null;
  }
}

export default async function AboutPage() {
  const [data, contactInfo] = await Promise.all([getAboutData(), getContactInfo()]);

  const title = data?.title || "About Us";
  const content: string | null = data?.content || null;
  const lastUpdated = data?.lastUpdated || null;

  return (
    <section className="min-h-screen bg-[#FFFDF7]">
      <div
        className="w-full py-12 md:py-16"
        style={{
          background:
            "linear-gradient(135deg, #FFF8F0 0%, #E8EDDD 40%, #FDEEF2 70%, #F5F0E1 100%)",
          borderBottom: "1px solid #EBE8D8",
        }}
      >
        <div className="container-narrow">
          <nav
            className="flex items-center gap-2 text-[0.78rem] font-medium mb-8"
            style={{ color: "#B8AE86" }}
          >
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-[#E84672] transition-colors"
            >
              <RiHomeLine size={13} />
              Home
            </Link>
            <span>/</span>
            <span style={{ color: "#78716c" }}>About Us</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-8" style={{ backgroundColor: "#E84672" }} />
            <span
              className="text-[0.6rem] font-black tracking-[0.28em] uppercase"
              style={{ color: "#B59F6B" }}
            >
              About LotusMart
            </span>
          </div>
          <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-black leading-[1.05] tracking-[-0.03em] text-neutral-900 mb-5">
            {title}
          </h1>
          {lastUpdated && (
            <p
              className="flex items-center gap-1.5 text-[0.78rem] font-medium mt-4"
              style={{ color: "#a8a29e" }}
            >
              <RiCalendarLine size={13} />
              Last updated:{" "}
              {new Date(lastUpdated).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>

      <div className="container-narrow py-10 md:py-14">
        <div
          className="rounded-2xl bg-white p-6 md:p-10 mb-10"
          style={{ border: "1px solid #EBE8D8" }}
        >
          {content ? (
            <div
              className="prose prose-neutral max-w-none break-words
                prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-neutral-800
                prose-h2:text-xl prose-h2:mt-8 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-[#F0EDE6]
                prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3
                prose-p:text-[0.9rem] prose-p:leading-[1.85] prose-p:text-neutral-600 prose-p:font-medium
                prose-li:text-[0.88rem] prose-li:leading-[1.85] prose-li:text-neutral-600 prose-li:font-medium
                prose-strong:text-neutral-700 prose-strong:font-bold
                prose-a:text-[#E84672] prose-a:no-underline hover:prose-a:underline
                prose-ul:my-4 prose-ol:my-4
              "
              dangerouslySetInnerHTML={{ __html: content }}
            />
          ) : (
            <PolicyEmptyState
              pageLabel="About Us"
              contactEmail={contactInfo?.email}
            />
          )}
        </div>

        <div
          className="rounded-2xl px-8 py-10 text-center"
          style={{
            backgroundColor: "#FFF1F3",
            border: "1px solid #FECDD3",
          }}
        >
          <h3 className="text-lg font-bold text-neutral-800 mb-2">
            Ready to explore?
          </h3>
          <p
            className="text-[0.85rem] font-medium mb-6 max-w-md mx-auto"
            style={{ color: "#78716c" }}
          >
            Browse our collection or get in touch — we&apos;re happy to help.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[0.85rem] font-semibold text-white"
              style={{ backgroundColor: "#E84672" }}
            >
              Shop Now <RiArrowRightLine size={14} />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[0.85rem] font-semibold"
              style={{
                backgroundColor: "#fff",
                color: "#E84672",
                border: "1px solid #FECDD3",
              }}
            >
              Get in Touch
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
