import Link from "next/link";
import { RiHomeLine, RiTruckLine, RiCalendarLine } from "react-icons/ri";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Shipping Policy — LotusMart",
  description:
    "Learn about LotusMart's shipping policy, delivery timelines, and free shipping threshold. We deliver across India.",
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
  const data = await getShippingData();

  const title = data?.title || "Shipping Policy";
  const content = data?.content || null;
  const lastUpdated = data?.lastUpdated || null;

  return (
    <section className="min-h-screen bg-[#FFFDF7]">
      {/* Hero Banner */}
      <div
        className="w-full py-12 md:py-16"
        style={{
          background: "linear-gradient(135deg, #FFF8F0 0%, #FFFBEB 50%, #E8EDDD 100%)",
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
            <span style={{ color: "#78716c" }}>Shipping Policy</span>
          </nav>

          {/* Header */}
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

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-10 md:py-14">
        {/* Shipping Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { stat: "2-5 Days", label: "Standard delivery across India" },
            { stat: "19,000+", label: "Pin codes covered" },
            { stat: "Free", label: "Shipping above Rs.499" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl p-4 text-center bg-white"
              style={{ border: "1px solid #EBE8D8" }}
            >
              <p
                className="text-xl font-black tracking-tight mb-1"
                style={{ color: "#D97706" }}
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
                  1. Delivery Coverage
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  We deliver across India, covering 19,000+ pin codes through our trusted logistics partners.
                  You can check if your pin code is serviceable at checkout before placing your order.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  2. Delivery Timelines
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium mb-3" style={{ color: "#78716c" }}>
                  Estimated delivery times from the date of order confirmation:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li className="text-[0.88rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}><strong className="text-neutral-700">Metro cities</strong> (Mumbai, Delhi, Bangalore, Chennai, Hyderabad, Kolkata): 2-3 business days</li>
                  <li className="text-[0.88rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}><strong className="text-neutral-700">Tier-2 cities:</strong> 3-4 business days</li>
                  <li className="text-[0.88rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}><strong className="text-neutral-700">Other locations:</strong> 4-5 business days</li>
                  <li className="text-[0.88rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}><strong className="text-neutral-700">Remote areas:</strong> 5-7 business days</li>
                </ul>
                <p className="text-[0.9rem] leading-[1.85] font-medium mt-3" style={{ color: "#78716c" }}>
                  Please note these are estimated timelines and may vary during festive seasons, adverse weather conditions,
                  or due to unforeseen circumstances.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  3. Shipping Charges
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium mb-3" style={{ color: "#78716c" }}>
                  We offer competitive shipping rates:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li className="text-[0.88rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}><strong className="text-neutral-700">Free shipping</strong> on all orders above Rs.499</li>
                  <li className="text-[0.88rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}><strong className="text-neutral-700">Standard shipping:</strong> Rs.49 for orders below Rs.499</li>
                  <li className="text-[0.88rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}><strong className="text-neutral-700">Express shipping:</strong> Rs.99 (delivery within 2 business days for metro cities)</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  4. Order Tracking
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  Once your order is dispatched, you will receive an SMS and email notification with a tracking link.
                  You can also track your order in real time from the My Orders section of your account. If you face
                  any issues with tracking, please do not hesitate to{" "}
                  <Link href="/contact" className="underline underline-offset-2" style={{ color: "#E84672" }}>
                    contact us
                  </Link>.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  5. Packaging
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  All products are carefully packed to ensure they reach you in perfect condition. Spices are vacuum-sealed
                  within 48 hours of packing. Dry fruits are stored in food-grade, airtight packaging. Gift boxes are
                  wrapped with protective layers to prevent damage during transit.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  6. Delivery Issues
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  If your order is delayed, damaged during transit, or you face any delivery-related issues, please
                  contact us within 48 hours of the expected delivery date. We will work with our logistics partner
                  to resolve the issue promptly. You can reach us at{" "}
                  <a href="mailto:support@lotusmart.in" className="underline underline-offset-2" style={{ color: "#E84672" }}>
                    support@lotusmart.in
                  </a>{" "}
                  or call{" "}
                  <a href="tel:+919876543210" className="underline underline-offset-2" style={{ color: "#E84672" }}>
                    +91-9876543210
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
