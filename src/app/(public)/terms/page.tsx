import Link from "next/link";
import { RiHomeLine, RiFileTextLine, RiCalendarLine } from "react-icons/ri";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms & Conditions — LotusMart",
  description:
    "Read the LotusMart Terms & Conditions to understand the rules and guidelines for using our platform.",
};

async function getTermsData() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/site-config?key=terms`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.value ?? null;
  } catch {
    return null;
  }
}

export default async function TermsPage() {
  const data = await getTermsData();

  const title = data?.title || "Terms & Conditions";
  const content = data?.content || null;
  const lastUpdated = data?.lastUpdated || null;

  return (
    <section className="min-h-screen bg-[#FFFDF7]">
      {/* Hero Banner */}
      <div
        className="w-full py-12 md:py-16"
        style={{
          background: "linear-gradient(135deg, #FFF8F0 0%, #FDEEF2 50%, #E8EDDD 100%)",
          borderBottom: "1px solid #EBE8D8",
        }}
      >
        <div className="max-w-4xl mx-auto px-6">
          {/* Breadcrumb */}
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
            <span style={{ color: "#78716c" }}>Terms & Conditions</span>
          </nav>

          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-8" style={{ backgroundColor: "#E84672" }} />
            <span
              className="text-[0.6rem] font-black tracking-[0.28em] uppercase"
              style={{ color: "#B59F6B" }}
            >
              Legal
            </span>
          </div>
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
              style={{ backgroundColor: "#FFF1F3", border: "1px solid #FECDD3" }}
            >
              <RiFileTextLine size={20} style={{ color: "#E84672" }} />
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
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10 md:py-14">
        <div
          className="rounded-2xl bg-white p-6 md:p-10"
          style={{ border: "1px solid #EBE8D8" }}
        >
          {content ? (
            <div
              className="prose prose-neutral max-w-none
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
            <div className="space-y-8">
              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  1. Acceptance of Terms
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  By accessing and using the LotusMart website and services, you acknowledge that you have read, understood,
                  and agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms,
                  please do not use our services.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  2. Account Registration
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  To place orders on LotusMart, you may need to create an account. You are responsible for maintaining
                  the confidentiality of your account credentials and for all activities that occur under your account.
                  You must provide accurate, current, and complete information during registration.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  3. Products & Pricing
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  All product descriptions, images, and prices are provided in good faith and are subject to change without
                  prior notice. We make every effort to ensure accuracy, but errors may occasionally occur. In such cases,
                  we reserve the right to cancel orders and issue full refunds. All prices are displayed in Indian Rupees (INR)
                  and are inclusive of applicable taxes unless stated otherwise.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  4. Orders & Payment
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  By placing an order, you make an offer to purchase the selected products. We reserve the right to accept
                  or decline any order. Payment can be made via UPI, credit/debit cards, net banking, or cash on delivery
                  where available. All online payments are processed securely through our payment gateway partner.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  5. Shipping & Delivery
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  We aim to deliver all orders within the estimated delivery timeframe. Delivery timelines are estimates
                  and may vary depending on your location and other factors. Please refer to our{" "}
                  <Link href="/shipping-policy" className="underline underline-offset-2" style={{ color: "#E84672" }}>
                    Shipping Policy
                  </Link>{" "}
                  for detailed information.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  6. Returns & Refunds
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  We offer a 7-day return window from the date of delivery. For complete details, please review our{" "}
                  <Link href="/refund-policy" className="underline underline-offset-2" style={{ color: "#E84672" }}>
                    Refund & Return Policy
                  </Link>.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  7. Intellectual Property
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  All content on the LotusMart website, including text, graphics, logos, images, and software, is the
                  property of LotusMart and is protected by applicable intellectual property laws. You may not reproduce,
                  distribute, or use any content without our prior written consent.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  8. Contact Information
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  If you have any questions about these Terms & Conditions, please{" "}
                  <Link href="/contact" className="underline underline-offset-2" style={{ color: "#E84672" }}>
                    contact us
                  </Link>{" "}
                  or email us at{" "}
                  <a href="mailto:support@lotusmart.in" className="underline underline-offset-2" style={{ color: "#E84672" }}>
                    support@lotusmart.in
                  </a>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
