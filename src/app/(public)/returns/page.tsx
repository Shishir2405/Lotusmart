import Link from "next/link";
import {
  RiHomeLine,
  RiRefund2Line,
  RiMailLine,
  RiArrowRightLine,
} from "react-icons/ri";
import type { Metadata } from "next";
import { getContactInfo } from "@/lib/get-contact-info";
import { PolicyEmptyState } from "@/components/shared/PolicyEmptyState";

export const metadata: Metadata = {
  title: "Returns — LotusMart | How to Return an Order",
  description:
    "Start a return. Contact LotusMart support to initiate a return and receive a refund.",
  alternates: {
    canonical: "https://lotusmart.in/returns",
  },
};

async function getRefundData() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/site-config?key=refund`,
      { next: { revalidate: 300 } },
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.value ?? null;
  } catch {
    return null;
  }
}

export default async function ReturnsPage() {
  const [contactInfo, refundData] = await Promise.all([
    getContactInfo(),
    getRefundData(),
  ]);
  const content: string | null = refundData?.content || null;

  return (
    <section className="min-h-screen bg-[#FFFDF7]">
      <div
        className="w-full py-12 md:py-16"
        style={{
          background:
            "linear-gradient(135deg, #FFF8F0 0%, #F0FDF4 50%, #E8EDDD 100%)",
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
            <span style={{ color: "#78716c" }}>Returns</span>
          </nav>

          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-8" style={{ backgroundColor: "#E84672" }} />
            <span
              className="text-[0.6rem] font-black tracking-[0.28em] uppercase"
              style={{ color: "#B59F6B" }}
            >
              Returns & Refunds
            </span>
          </div>
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 mt-1"
              style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}
            >
              <RiRefund2Line size={20} style={{ color: "#16A34A" }} />
            </div>
            <div>
              <h1 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-black leading-[1.1] tracking-[-0.03em] text-neutral-900">
                {refundData?.title || "Returns"}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container-narrow py-10 md:py-14">
        <div
          className="rounded-2xl bg-white p-6 md:p-10 mb-8"
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
              pageLabel="Return Policy"
              contactEmail={contactInfo?.email}
            />
          )}
        </div>

        <div
          className="rounded-2xl p-6 md:p-8"
          style={{
            background: "linear-gradient(135deg, #FFF8F0 0%, #FFF1F3 100%)",
            border: "1px solid #F0EDE6",
          }}
        >
          <h3 className="text-lg font-bold text-neutral-800 mb-2">
            Start a return
          </h3>
          <p
            className="text-[0.88rem] leading-relaxed font-medium mb-5"
            style={{ color: "#78716c" }}
          >
            Send us your order number and reason for return — our team will
            take it from there.
          </p>
          <div className="flex flex-wrap gap-3">
            {contactInfo?.email && (
              <a
                href={`mailto:${contactInfo.email}?subject=Return%20Request`}
                className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:shadow-md transition-shadow"
                style={{ backgroundColor: "#E84672" }}
              >
                <RiMailLine size={15} />
                Email support
              </a>
            )}
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-neutral-700 hover:border-[#E84672] hover:text-[#E84672] transition-colors"
            >
              Contact us
              <RiArrowRightLine size={15} />
            </Link>
            <Link
              href="/refund-policy"
              className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-neutral-500 hover:text-neutral-800 transition-colors"
            >
              Read full policy
              <RiArrowRightLine size={15} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
