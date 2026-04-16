import Link from "next/link";
import {
  RiHomeLine,
  RiRefund2Line,
  RiCheckboxCircleLine,
  RiMailLine,
  RiArrowRightLine,
} from "react-icons/ri";
import type { Metadata } from "next";
import { getContactInfo } from "@/lib/get-contact-info";

export const metadata: Metadata = {
  title: "Returns — LotusMart | How to Return an Order",
  description:
    "Start a return in 3 simple steps. LotusMart offers a 7-day return window with free pickup and full refund within 3-5 business days.",
  alternates: {
    canonical: "https://lotusmart.in/returns",
  },
};

export default async function ReturnsPage() {
  const contactInfo = await getContactInfo();

  const steps = [
    {
      n: 1,
      title: "Reach out within 7 days",
      desc: "Contact our support team within 7 days of delivery with your order number and the reason for return.",
    },
    {
      n: 2,
      title: "We arrange free pickup",
      desc: "Once your return is approved, we schedule a free pickup from your address — no shipping charges on your side.",
    },
    {
      n: 3,
      title: "Refund within 3-5 days",
      desc: "After we inspect the returned product, your refund is credited to the original payment method within 3-5 business days.",
    },
  ];

  const eligibility = [
    "Request raised within 7 days of delivery",
    "Product is in its original, unopened packaging (unless damaged or defective)",
    "Product has not been used or consumed beyond a reasonable inspection",
    "Order number and proof of purchase are available",
  ];

  const nonReturnable = [
    "Custom or personalised gift hampers",
    "Products with broken seals that have been consumed",
    "Items purchased during clearance or final sale",
  ];

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
              className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 mt-1"
              style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}
            >
              <RiRefund2Line size={20} style={{ color: "#16A34A" }} />
            </div>
            <div>
              <h1 className="text-[clamp(1.6rem,3.5vw,2.4rem)] font-black leading-[1.1] tracking-[-0.03em] text-neutral-900">
                Hassle-free returns, on us
              </h1>
              <p
                className="text-[0.88rem] leading-relaxed font-medium max-w-2xl mt-3"
                style={{ color: "#a8a29e" }}
              >
                Not happy with your order? We&apos;ll make it right. Start a
                return in 3 simple steps and get your refund within a week.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 md:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
          {[
            { stat: "7 Days", label: "Return window from delivery" },
            { stat: "3-5 Days", label: "Refund processing time" },
            { stat: "Free", label: "Return pickup on us" },
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
          className="rounded-2xl bg-white p-6 md:p-10 mb-8"
          style={{ border: "1px solid #EBE8D8" }}
        >
          <h2 className="text-xl font-bold text-neutral-800 mb-6">
            How to return an order
          </h2>
          <div className="space-y-5">
            {steps.map((step) => (
              <div key={step.n} className="flex gap-4">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black text-white"
                  style={{ backgroundColor: "#E84672" }}
                >
                  {step.n}
                </div>
                <div>
                  <h3 className="text-base font-bold text-neutral-800">
                    {step.title}
                  </h3>
                  <p
                    className="text-[0.88rem] leading-[1.75] font-medium mt-1"
                    style={{ color: "#78716c" }}
                  >
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div
            className="rounded-2xl bg-white p-6"
            style={{ border: "1px solid #EBE8D8" }}
          >
            <h3 className="text-base font-bold text-neutral-800 mb-3">
              Eligible for return
            </h3>
            <ul className="space-y-2.5">
              {eligibility.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <RiCheckboxCircleLine
                    className="mt-0.5 shrink-0"
                    size={16}
                    style={{ color: "#16A34A" }}
                  />
                  <span
                    className="text-[0.85rem] leading-[1.6] font-medium"
                    style={{ color: "#57534e" }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div
            className="rounded-2xl bg-white p-6"
            style={{ border: "1px solid #EBE8D8" }}
          >
            <h3 className="text-base font-bold text-neutral-800 mb-3">
              Not eligible for return
            </h3>
            <ul className="space-y-2.5">
              {nonReturnable.map((item) => (
                <li key={item} className="flex items-start gap-2">
                  <span
                    className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: "#DC2626" }}
                  />
                  <span
                    className="text-[0.85rem] leading-[1.6] font-medium"
                    style={{ color: "#57534e" }}
                  >
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div
          className="rounded-2xl p-6 md:p-8"
          style={{
            background:
              "linear-gradient(135deg, #FFF8F0 0%, #FFF1F3 100%)",
            border: "1px solid #F0EDE6",
          }}
        >
          <h3 className="text-lg font-bold text-neutral-800 mb-2">
            Ready to start a return?
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
