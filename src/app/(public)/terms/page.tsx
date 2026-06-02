import Link from "next/link";
import { RiHomeLine, RiFileTextLine, RiCalendarLine } from "react-icons/ri";
import type { Metadata } from "next";
import { getContactInfo } from "@/lib/get-contact-info";
import { PolicyEmptyState } from "@/components/shared/PolicyEmptyState";

export const metadata: Metadata = {
  title: "Terms & Conditions — LotusMart",
  description:
    "Read the LotusMart Terms & Conditions to understand the rules and guidelines for using our platform.",
  alternates: {
    canonical: "https://lotusmart.in/terms",
  },
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
  const [data, contactInfo] = await Promise.all([getTermsData(), getContactInfo()]);

  const title = data?.title || "Terms & Conditions";
  const content = data?.content || null;
  const lastUpdated = data?.lastUpdated || null;

  return (
    <section className="min-h-screen bg-[#FFFDF7]">
      
      <div
        className="w-full py-12 md:py-16"
        style={{
          background: "linear-gradient(135deg, #FFF8F0 0%, #FDEEF2 50%, #E8EDDD 100%)",
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
            <span style={{ color: "#78716c" }}>Terms & Conditions</span>
          </nav>

          
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
              pageLabel="Terms & Conditions"
              contactEmail={contactInfo?.email}
            />
          )}
        </div>
      </div>
    </section>
  );
}
