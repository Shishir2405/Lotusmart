import Link from "next/link";
import { RiHomeLine, RiRefund2Line, RiCalendarLine } from "react-icons/ri";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Refund & Return Policy — LotusMart",
  description:
    "Learn about LotusMart's refund and return policy. We offer hassle-free returns within 7 days of delivery.",
};

async function getRefundData() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/site-config?key=refund`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.value ?? null;
  } catch {
    return null;
  }
}

export default async function RefundPolicyPage() {
  const data = await getRefundData();

  const title = data?.title || "Refund & Return Policy";
  const content = data?.content || null;
  const lastUpdated = data?.lastUpdated || null;

  return (
    <section className="min-h-screen bg-[#FFFDF7]">
      
      <div
        className="w-full py-12 md:py-16"
        style={{
          background: "linear-gradient(135deg, #FFF8F0 0%, #F0FDF4 50%, #E8EDDD 100%)",
          borderBottom: "1px solid #EBE8D8",
        }}
      >
        <div className="max-w-4xl mx-auto px-6">
          
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
            <span style={{ color: "#78716c" }}>Refund & Return Policy</span>
          </nav>

          
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-8" style={{ backgroundColor: "#E84672" }} />
            <span
              className="text-[0.6rem] font-black tracking-[0.28em] uppercase"
              style={{ color: "#B59F6B" }}
            >
              Policy
            </span>
          </div>
          <div className="flex items-start gap-4 mb-4">
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
              style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}
            >
              <RiRefund2Line size={20} style={{ color: "#16A34A" }} />
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
            We want you to be completely satisfied with your purchase. If
            something is not right, our hassle-free refund process makes it easy
            to return or exchange your order.
          </p>
        </div>
      </div>

      
      <div className="max-w-4xl mx-auto px-6 py-10 md:py-14">
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { stat: "7 Days", label: "Return window from delivery" },
            { stat: "3-5 Days", label: "Refund processing time" },
            { stat: "Free", label: "Return shipping on us" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl p-4 text-center bg-white"
              style={{ border: "1px solid #EBE8D8" }}
            >
              <p
                className="text-xl font-black tracking-tight mb-1"
                style={{ color: "#E84672" }}
              >
                {item.stat}
              </p>
              <p
                className="text-[0.78rem] font-medium"
                style={{ color: "#a8a29e" }}
              >
                {item.label}
              </p>
            </div>
          ))}
        </div>

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
                  1. Return Window
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  We offer a no-questions-asked 7-day return window from the date of delivery. If you are not satisfied
                  with your purchase for any reason, simply reach out to our support team and we will arrange a pickup
                  at no extra cost to you.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  2. Eligibility for Returns
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium mb-3" style={{ color: "#78716c" }}>
                  To be eligible for a return, the following conditions must be met:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li className="text-[0.88rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>The return request is raised within 7 days of delivery</li>
                  <li className="text-[0.88rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>The product is in its original, unopened packaging (unless the product is damaged or defective)</li>
                  <li className="text-[0.88rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>The product has not been used or consumed beyond a reasonable inspection</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  3. Damaged or Defective Products
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  If your product arrives damaged, tampered, or defective, please report it within 48 hours of delivery
                  with a photograph. We will send a free replacement within 2 business days, or issue a full refund
                  as per your preference. Your trust matters more to us than the cost of a replacement.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  4. Refund Process
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  Once we receive and inspect the returned product, we will process your refund within 3-5 business days.
                  Refunds will be credited to the original payment method. For Cash on Delivery orders, refunds will
                  be processed via bank transfer to the account details you provide.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  5. Non-Returnable Items
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium mb-3" style={{ color: "#78716c" }}>
                  The following items are not eligible for returns:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li className="text-[0.88rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>Custom or personalised gift hampers</li>
                  <li className="text-[0.88rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>Products with broken seals that have been consumed</li>
                  <li className="text-[0.88rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>Items purchased during clearance or final sale</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  6. How to Initiate a Return
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  To initiate a return, contact our support team via email at{" "}
                  <a href="mailto:support@lotusmart.in" className="underline underline-offset-2" style={{ color: "#E84672" }}>
                    support@lotusmart.in
                  </a>{" "}
                  or through the{" "}
                  <Link href="/contact" className="underline underline-offset-2" style={{ color: "#E84672" }}>
                    Contact Us
                  </Link>{" "}
                  page with your order number and reason for return. Our team will guide you through the process.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
