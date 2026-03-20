import Link from "next/link";
import {
  RiInstagramLine,
  RiFacebookCircleLine,
  RiTwitterXLine,
  RiWhatsappLine,
  RiMailLine,
  RiPhoneLine,
  RiMapPinLine,
} from "react-icons/ri";

const footerLinks = {
  Shop: [
    { label: "All Products", href: "/products" },
    { label: "Spices", href: "/categories/spices" },
    { label: "Dry Fruits", href: "/categories/dry-fruits" },
    { label: "Gift Boxes", href: "/categories/gift-boxes" },
    { label: "New Arrivals", href: "/products?sortBy=newest" },
    { label: "Best Sellers", href: "/products?sortBy=popular" },
  ],
  "Quick Links": [
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Track Order", href: "/orders" },
    { label: "Bulk Orders", href: "/bulk-orders" },
    { label: "Blog", href: "/blog" },
  ],
  "Support": [
    { label: "FAQs", href: "/faqs" },
    { label: "Returns & Refunds", href: "/returns" },
    { label: "Shipping Policy", href: "/shipping-policy" },
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms of Service", href: "/terms" },
  ],
};

const socials = [
  { icon: RiInstagramLine, href: "#", label: "Instagram" },
  { icon: RiFacebookCircleLine, href: "#", label: "Facebook" },
  { icon: RiTwitterXLine, href: "#", label: "Twitter / X" },
  { icon: RiWhatsappLine, href: "#", label: "WhatsApp" },
];

export function Footer() {
  return (
    <footer className="bg-[#2A2518] text-[#D4CFB3]">
      {/* Main footer content */}
      <div className="container-wide py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="inline-block mb-4">
              <span className="text-3xl font-bold text-[#FFF9E8]">
                Lotus<span className="text-[#E84672]">Mart</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-[#B8AE86] mb-6 max-w-xs">
              Premium quality spices, dry fruits, and thoughtful gift boxes — sourced from the finest farms and delivered to your doorstep.
            </p>

            {/* Contact */}
            <div className="space-y-2.5">
              <a href="mailto:hello@lotusmart.com" className="flex items-center gap-2.5 text-sm hover:text-[#E84672] transition-colors">
                <RiMailLine size={16} className="text-[#E84672] shrink-0" />
                hello@lotusmart.com
              </a>
              <a href="tel:+919876543210" className="flex items-center gap-2.5 text-sm hover:text-[#E84672] transition-colors">
                <RiPhoneLine size={16} className="text-[#E84672] shrink-0" />
                +91 98765 43210
              </a>
              <div className="flex items-start gap-2.5 text-sm">
                <RiMapPinLine size={16} className="text-[#E84672] shrink-0 mt-0.5" />
                <span>123 Spice Lane, Mumbai, Maharashtra 400001</span>
              </div>
            </div>

            {/* Socials */}
            <div className="flex items-center gap-3 mt-6">
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 rounded-xl bg-[#4D4529] flex items-center justify-center text-[#D4CFB3] hover:bg-[#E84672] hover:text-white transition-all duration-200"
                >
                  <Icon size={18} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="font-semibold text-[#FFF9E8] mb-4 text-sm tracking-wide uppercase">
                {title}
              </h4>
              <ul className="space-y-2.5">
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#B8AE86] hover:text-[#E84672] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Newsletter */}
        <div className="mt-12 pt-8 border-t border-[#4D4529]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h4 className="font-semibold text-[#FFF9E8] mb-1">Join the LotusMart family</h4>
              <p className="text-sm text-[#B8AE86]">Get exclusive deals, new arrivals, and recipes straight to your inbox.</p>
            </div>
            <form className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 md:w-64 px-4 py-2.5 rounded-xl bg-[#4D4529] border border-[#615834] text-[#FFF9E8] placeholder:text-[#9C8F62] text-sm outline-none focus:border-[#E84672] transition-colors"
              />
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#E84672] text-white text-sm font-medium hover:bg-[#C9305A] transition-colors shrink-0"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-[#4D4529] py-5">
        <div className="container-wide flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#9C8F62]">
          <p>© {new Date().getFullYear()} LotusMart. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">🔒 Secure payments</span>
            <span>|</span>
            <span>100% Authentic products</span>
            <span>|</span>
            <span>FSSAI Licensed</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
