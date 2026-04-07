import Link from "next/link";
import { RiHomeLine, RiShieldCheckLine, RiCalendarLine } from "react-icons/ri";
import type { Metadata } from "next";
import { getContactInfo } from "@/lib/get-contact-info";

export const metadata: Metadata = {
  title: "Privacy Policy — LotusMart",
  description:
    "Learn how LotusMart collects, uses, and protects your personal information. Your privacy matters to us.",
  alternates: {
    canonical: "https://lotusmart.in/privacy-policy",
  },
};

async function getPrivacyData() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/site-config?key=privacy`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data?.value ?? null;
  } catch {
    return null;
  }
}

export default async function PrivacyPolicyPage() {
  const [data, contactInfo] = await Promise.all([getPrivacyData(), getContactInfo()]);

  const title = data?.title || "Privacy Policy";
  const content = data?.content || null;
  const lastUpdated = data?.lastUpdated || null;

  return (
    <section className="min-h-screen bg-[#FFFDF7]">
      
      <div
        className="w-full py-12 md:py-16"
        style={{
          background: "linear-gradient(135deg, #FFF8F0 0%, #EFF6FF 50%, #E8EDDD 100%)",
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
            <span style={{ color: "#78716c" }}>Privacy Policy</span>
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
              style={{ backgroundColor: "#EFF6FF", border: "1px solid #BFDBFE" }}
            >
              <RiShieldCheckLine size={20} style={{ color: "#2563EB" }} />
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
            At LotusMart, your privacy is important to us. This policy explains
            how we collect, use, and safeguard your personal information when
            you use our services.
          </p>
        </div>
      </div>

      
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
                  1. Information We Collect
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  We collect information you provide directly when you create an account, place an order, or contact us.
                  This includes your name, email address, phone number, shipping address, and payment details. We also
                  automatically collect certain information such as your IP address, browser type, device information,
                  and browsing activity on our website through cookies and similar technologies.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  2. How We Use Your Information
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium mb-3" style={{ color: "#78716c" }}>
                  We use the information we collect to:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li className="text-[0.88rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>Process and fulfill your orders</li>
                  <li className="text-[0.88rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>Communicate order updates and delivery status</li>
                  <li className="text-[0.88rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>Send promotional offers and newsletters (with your consent)</li>
                  <li className="text-[0.88rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>Improve our website, products, and customer experience</li>
                  <li className="text-[0.88rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>Prevent fraud and ensure security</li>
                  <li className="text-[0.88rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>Comply with legal obligations</li>
                </ul>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  3. Information Sharing
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  We do not sell your personal information to third parties. We may share your information with trusted
                  service providers who assist us in operating our business, such as payment processors, shipping partners,
                  and analytics providers. These partners are contractually obligated to protect your data and use it
                  only for the purposes we specify.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  4. Data Security
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  We implement industry-standard security measures to protect your personal information, including
                  SSL encryption, secure payment gateways, and regular security audits. However, no method of
                  transmission over the internet is 100% secure, and we cannot guarantee absolute security.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  5. Cookies
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  We use cookies and similar tracking technologies to enhance your browsing experience, remember your
                  preferences, and analyze site traffic. You can manage cookie preferences through your browser settings.
                  Disabling cookies may affect certain features of our website.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  6. Your Rights
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  You have the right to access, correct, or delete your personal information at any time. You may also
                  opt out of marketing communications by clicking the unsubscribe link in any email or contacting us
                  directly.{contactInfo && (<>{" "}To exercise any of these rights, please reach out to us at{" "}
                  <a href={`mailto:${contactInfo.email}`} className="underline underline-offset-2" style={{ color: "#E84672" }}>
                    {contactInfo.email}
                  </a>.</>)}
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  7. Changes to This Policy
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  We may update this Privacy Policy from time to time. Any changes will be posted on this page with
                  an updated revision date. We encourage you to review this policy periodically to stay informed about
                  how we are protecting your information.
                </p>
              </div>

              <div>
                <h2 className="text-xl font-bold text-neutral-800 mb-3 pb-2" style={{ borderBottom: "1px solid #F0EDE6" }}>
                  8. Contact Us
                </h2>
                <p className="text-[0.9rem] leading-[1.85] font-medium" style={{ color: "#78716c" }}>
                  If you have any questions or concerns about this Privacy Policy, please{" "}
                  <Link href="/contact" className="underline underline-offset-2" style={{ color: "#E84672" }}>
                    contact us
                  </Link>
                  {contactInfo && (<>{" "}or email us at{" "}
                  <a href={`mailto:${contactInfo.email}`} className="underline underline-offset-2" style={{ color: "#E84672" }}>
                    {contactInfo.email}
                  </a></>)}.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
