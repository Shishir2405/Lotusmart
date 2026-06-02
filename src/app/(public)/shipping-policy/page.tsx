import Link from "next/link";
import { RiHomeLine, RiTruckLine, RiCalendarLine } from "react-icons/ri";
import type { Metadata } from "next";
import { getContactInfo } from "@/lib/get-contact-info";
import { PolicyEmptyState } from "@/components/shared/PolicyEmptyState";

export const metadata: Metadata = {
  title: "Shipping Policy — LotusMart | Free Delivery on Orders Above ₹499",
  description:
    "Learn about LotusMart's shipping policy. Free delivery on orders above ₹499, 2-5 day delivery across 19,000+ pin codes in India. Same-day dispatch available.",
  alternates: {
    canonical: "https://lotusmart.in/shipping-policy",
  },
};

async function getShippingData() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/site-config?key=shipping`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.value ?? null;
  } catch {
    return null;
  }
}

export default async function ShippingPolicyPage() {
  const [data, contactInfo] = await Promise.all([getShippingData(), getContactInfo()]);

  const title = data?.title || "Shipping Policy";
  const content = data?.content || null;
  const lastUpdated = data?.lastUpdated || null;

  return (
    <section className="min-h-screen bg-[#FFFDF7]">
      
      <div
        className="w-full py-12 md:py-16"
        style={{
          background: "linear-gradient(135deg, #FFF8F0 0%, #FFFBEB 50%, #E8EDDD 100%)",
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
            <span style={{ color: "#78716c" }}>Shipping Policy</span>
          </nav>

          
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-8" style={{ backgroundColor: "#E84672" }} />
            <span
              className="text-[0.6rem] font-black tracking-[0.28em] uppercase"
              style={{ color: "#B59F6B" }}
            >
              Delivery
            </span>
          </div>
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
              style={{ backgroundColor: "#FFFBEB", border: "1px solid #FDE68A" }}
            >
              <RiTruckLine size={20} style={{ color: "#D97706" }} />
            </div>
            <div>
              <h1 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-black leading-[1.1] tracking-[-0.03em] text-neutral-900">
                {title}
              </h1>
              {lastUpdated && (
                <p
                  className="flex items-center gap-1.5 text-[0.78rem] font-medium mt-2"
                  style={{ color: "#a8a29e" }}
                >
                  <RiCalendarLine size={13} />
                  Last updated: {new Date(lastUpdated).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </p>
              )}
            </div>
          </div>
          <p
            className="text-[0.88rem] leading-relaxed font-medium max-w-2xl"
            style={{ color: "#a8a29e" }}
          >
            We are committed to delivering your favourite spices, dry fruits,
            and gift boxes quickly and safely to your doorstep, anywhere in
            India.
          </p>
        </div>
      </div>

      
      <div className="container-narrow py-10 md:py-14">
        <div
          className="rounded-2xl bg-white p-6 md:p-10"
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
              pageLabel="Shipping Policy"
              contactEmail={contactInfo?.email}
            />
          )}
        </div>
      </div>
    </section>
  );
}
