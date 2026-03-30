import Link from "next/link";
import {
  RiHomeLine,
  RiLeafLine,
  RiHeartLine,
  RiAwardLine,
  RiShieldCheckLine,
  RiTruckLine,
  RiCalendarLine,
  RiTeamLine,
  RiArrowRightLine,
} from "react-icons/ri";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us — LotusMart",
  description:
    "Discover the LotusMart story. We bring you premium quality spices, dry fruits, and curated gift boxes sourced directly from Indian farms.",
};

async function getAboutData() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/site-config?key=about`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.value ?? null;
  } catch {
    return null;
  }
}

const values = [
  {
    icon: RiLeafLine,
    title: "100% Natural",
    desc: "No artificial colours, flavours, or preservatives. What you see on the label is exactly what is inside.",
    color: "#5C6B3C",
    bg: "#E8EDDD",
    border: "#C5D1A8",
  },
  {
    icon: RiAwardLine,
    title: "Premium Quality",
    desc: "We stock only extra bold, AA-grade selections. Every product is handpicked and quality-checked before shipping.",
    color: "#B59F6B",
    bg: "#F5F0E1",
    border: "#D4C99A",
  },
  {
    icon: RiShieldCheckLine,
    title: "FSSAI Certified",
    desc: "All products meet the highest food safety standards. Each batch is lab-tested to ensure purity and authenticity.",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
  },
  {
    icon: RiTruckLine,
    title: "Farm to Door",
    desc: "We source directly from farms and small-batch processors, cutting middlemen to bring you the freshest products.",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
  },
  {
    icon: RiHeartLine,
    title: "Customer First",
    desc: "Hassle-free 7-day returns, responsive support, and a genuine commitment to your satisfaction every single time.",
    color: "#E84672",
    bg: "#FFF1F3",
    border: "#FECDD3",
  },
  {
    icon: RiTeamLine,
    title: "Community Driven",
    desc: "We work closely with farming communities across India, supporting sustainable practices and fair trade.",
    color: "#5C6B3C",
    bg: "#E8EDDD",
    border: "#C5D1A8",
  },
];

const milestones = [
  { year: "2017", event: "LotusMart founded with a mission to bring authentic Indian spices online" },
  { year: "2019", event: "Expanded to dry fruits, nuts, and seeds category" },
  { year: "2020", event: "Launched gifting range with curated gift boxes and hampers" },
  { year: "2022", event: "Crossed 50,000 orders delivered across India" },
  { year: "2023", event: "Introduced organic certified product line" },
  { year: "2024", event: "Expanded to 19,000+ pin codes with same-day dispatch" },
];

export default async function AboutPage() {
  const data = await getAboutData();

  const title = data?.title || "Our Story";
  const content = data?.content || null;
  const lastUpdated = data?.lastUpdated || null;

  return (
    <section className="min-h-screen bg-[#FFFDF7]">
      {/* Hero Banner */}
      <div
        className="w-full py-12 md:py-16"
        style={{
          background: "linear-gradient(135deg, #FFF8F0 0%, #E8EDDD 40%, #FDEEF2 70%, #F5F0E1 100%)",
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
            <span style={{ color: "#78716c" }}>About Us</span>
          </nav>

          {/* Header */}
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
            {title === "Our Story" ? (
              <>
                Bringing India&apos;s Finest to{" "}
                <span style={{ color: "#E84672" }}>Your Kitchen</span>
              </>
            ) : (
              title
            )}
          </h1>
          <p
            className="text-[0.95rem] leading-[1.85] font-medium max-w-2xl"
            style={{ color: "#78716c" }}
          >
            LotusMart was born from a simple belief: every kitchen deserves
            access to the freshest, most authentic spices and dry fruits India
            has to offer — without compromise on quality, purity, or
            convenience.
          </p>
          {lastUpdated && (
            <p
              className="flex items-center gap-1.5 text-[0.78rem] font-medium mt-4"
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

      <div className="max-w-4xl mx-auto px-6 py-10 md:py-14">
        {/* Brand Story - from API or default */}
        {content ? (
          <div
            className="rounded-2xl bg-white p-6 md:p-10 mb-14"
            style={{ border: "1px solid #EBE8D8" }}
          >
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
          </div>
        ) : (
          <div
            className="rounded-2xl bg-white p-6 md:p-10 mb-14"
            style={{ border: "1px solid #EBE8D8" }}
          >
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  How It All Started
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  It started with a kitchen conversation. A family recipe that
                  called for kashmiri chilli — but the packet from the store
                  tasted nothing like the real thing. That moment of
                  disappointment sparked a question: why is it so hard to find
                  genuinely pure, premium spices?
                </p>
                <p className="text-[0.9rem] leading-[1.85] font-medium mt-3" style={{ color: "#78716c" }}>
                  We set out to fix that. We travelled to spice farms in Kerala,
                  Rajasthan, and Kashmir. We visited dry fruit orchards in
                  Afghanistan and California. We met farmers, tasters, and
                  processors who care about quality as deeply as we do. And we
                  built LotusMart to bring their products directly to your
                  kitchen.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  What We Stand For
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  At LotusMart, purity is not a marketing word — it is a
                  non-negotiable standard. Every product on our shelves is free
                  from adulterants, artificial colours, and fillers. We do not
                  stock it if it does not meet our grade. We believe food should
                  be honest, and we have built a brand around that belief.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  Our Promise to You
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  When you shop with LotusMart, you are not just buying a
                  product. You are choosing transparency, supporting fair-trade
                  farming, and getting ingredients that make a real difference in
                  your cooking. From our farm partners to your table, every step
                  is handled with care.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Stats */}
        <div
          className="grid grid-cols-2 lg:grid-cols-4 rounded-2xl overflow-hidden mb-14"
          style={{ border: "1px solid #EBE8D8" }}
        >
          {[
            { value: "50K+", label: "Orders Delivered" },
            { value: "4.9", label: "Customer Rating" },
            { value: "200+", label: "Products" },
            { value: "7 yr", label: "In Business" },
          ].map((s, i) => (
            <div
              key={s.label}
              className="flex flex-col items-center justify-center px-5 py-6 bg-white"
              style={{
                borderRight: i < 3 ? "1px solid #EBE8D8" : "none",
              }}
            >
              <span
                className="text-[2rem] font-black leading-none tracking-tight mb-1"
                style={{ color: "#E84672" }}
              >
                {s.value}
              </span>
              <span
                className="text-[0.7rem] font-bold tracking-widest uppercase"
                style={{ color: "#B59F6B" }}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>

        {/* Our Values */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-8" style={{ backgroundColor: "#E84672" }} />
            <span
              className="text-[0.6rem] font-black tracking-[0.28em] uppercase"
              style={{ color: "#B59F6B" }}
            >
              Our Values
            </span>
          </div>
          <h2 className="text-[clamp(1.4rem,3vw,2rem)] font-black leading-[1.1] tracking-[-0.02em] text-neutral-900 mb-8">
            What Makes Us{" "}
            <span style={{ color: "#E84672" }}>Different</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {values.map((v) => (
              <div
                key={v.title}
                className="flex items-start gap-4 p-5 rounded-2xl bg-white"
                style={{ border: `1px solid ${v.border}` }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: v.bg, border: `1px solid ${v.border}` }}
                >
                  <v.icon size={18} style={{ color: v.color }} />
                </div>
                <div>
                  <h3 className="text-[0.95rem] font-bold text-neutral-800 mb-1">
                    {v.title}
                  </h3>
                  <p
                    className="text-[0.82rem] leading-relaxed font-medium"
                    style={{ color: "#78716c" }}
                  >
                    {v.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-14">
          <div className="flex items-center gap-3 mb-3">
            <span className="h-px w-8" style={{ backgroundColor: "#E84672" }} />
            <span
              className="text-[0.6rem] font-black tracking-[0.28em] uppercase"
              style={{ color: "#B59F6B" }}
            >
              Our Journey
            </span>
          </div>
          <h2 className="text-[clamp(1.4rem,3vw,2rem)] font-black leading-[1.1] tracking-[-0.02em] text-neutral-900 mb-8">
            Milestones Along the{" "}
            <span style={{ color: "#E84672" }}>Way</span>
          </h2>

          <div
            className="rounded-2xl bg-white p-6 md:p-8"
            style={{ border: "1px solid #EBE8D8" }}
          >
            <div className="relative">
              {/* Vertical line */}
              <div
                className="absolute left-[22px] top-2 bottom-2 w-px"
                style={{ backgroundColor: "#EBE8D8" }}
              />

              <div className="space-y-6">
                {milestones.map((m, i) => (
                  <div key={m.year} className="flex items-start gap-5 relative">
                    <div
                      className="w-[45px] h-[45px] rounded-xl flex items-center justify-center flex-shrink-0 z-10"
                      style={{
                        backgroundColor: i === milestones.length - 1 ? "#FFF1F3" : "#F7F6F0",
                        border: `1px solid ${i === milestones.length - 1 ? "#FECDD3" : "#EBE8D8"}`,
                      }}
                    >
                      <span
                        className="text-[0.68rem] font-black"
                        style={{
                          color: i === milestones.length - 1 ? "#E84672" : "#78716c",
                        }}
                      >
                        {m.year}
                      </span>
                    </div>
                    <div className="pt-2.5">
                      <p className="text-[0.88rem] font-semibold text-neutral-700">
                        {m.event}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div
          className="rounded-2xl px-8 py-10 text-center"
          style={{
            backgroundColor: "#FFF1F3",
            border: "1px solid #FECDD3",
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-[1.4rem] font-black tracking-tight" style={{ color: "#1c1917" }}>
              Lotus
            </span>
            <span className="text-[1.4rem] font-black tracking-tight" style={{ color: "#E84672" }}>
              Mart
            </span>
          </div>
          <h3 className="text-lg font-bold text-neutral-800 mb-2">
            Ready to taste the difference?
          </h3>
          <p
            className="text-[0.85rem] font-medium mb-6 max-w-md mx-auto"
            style={{ color: "#78716c" }}
          >
            Explore our collection of premium spices, dry fruits, and curated
            gift boxes — all delivered to your doorstep.
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
