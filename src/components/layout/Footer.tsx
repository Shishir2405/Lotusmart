"use client";

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
  Support: [
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
    <footer style={{ backgroundColor: "#2A2518", color: "#D4CFB3" }}>
      {/* Main footer content */}
      <div className="container-wide" style={{ paddingTop: "4rem", paddingBottom: "4rem" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
            gap: "2.5rem",
          }}
          className="footer-grid"
        >
          {/* Brand column */}
          <div className="footer-brand" style={{ gridColumn: "span 1" }}>
            <Link
              href="/"
              style={{ display: "inline-block", marginBottom: "1rem", textDecoration: "none" }}
            >
              <span style={{ fontSize: "1.75rem", fontWeight: 700, color: "#FFF9E8" }}>
                Lotus<span style={{ color: "#E84672" }}>Mart</span>
              </span>
            </Link>

            <p
              style={{
                fontSize: "0.875rem",
                lineHeight: 1.7,
                color: "#B8AE86",
                marginBottom: "1.5rem",
                maxWidth: "18rem",
              }}
            >
              Premium quality spices, dry fruits, and thoughtful gift boxes — sourced from the
              finest farms and delivered to your doorstep.
            </p>

            {/* Contact info */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <a
                href="mailto:hello@lotusmart.com"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  fontSize: "0.875rem",
                  color: "#D4CFB3",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E84672")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#D4CFB3")}
              >
                <RiMailLine size={15} style={{ color: "#E84672", flexShrink: 0 }} />
                hello@lotusmart.com
              </a>
              <a
                href="tel:+919876543210"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.625rem",
                  fontSize: "0.875rem",
                  color: "#D4CFB3",
                  textDecoration: "none",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#E84672")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#D4CFB3")}
              >
                <RiPhoneLine size={15} style={{ color: "#E84672", flexShrink: 0 }} />
                +91 98765 43210
              </a>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.625rem",
                  fontSize: "0.875rem",
                  color: "#D4CFB3",
                }}
              >
                <RiMapPinLine
                  size={15}
                  style={{ color: "#E84672", flexShrink: 0, marginTop: "2px" }}
                />
                <span>123 Spice Lane, Mumbai, Maharashtra 400001</span>
              </div>
            </div>

            {/* Social icons */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.625rem",
                marginTop: "1.5rem",
              }}
            >
              {socials.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  style={{
                    width: "2.25rem",
                    height: "2.25rem",
                    borderRadius: "0.625rem",
                    backgroundColor: "#4D4529",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#D4CFB3",
                    textDecoration: "none",
                    transition: "background-color 0.2s, color 0.2s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = "#E84672";
                    e.currentTarget.style.color = "#ffffff";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = "#4D4529";
                    e.currentTarget.style.color = "#D4CFB3";
                  }}
                >
                  <Icon size={17} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4
                style={{
                  fontWeight: 600,
                  color: "#FFF9E8",
                  marginBottom: "1.25rem",
                  fontSize: "0.75rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                {title}
              </h4>
              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.625rem",
                }}
              >
                {links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      style={{
                        fontSize: "0.875rem",
                        color: "#B8AE86",
                        textDecoration: "none",
                        transition: "color 0.2s",
                        display: "inline-block",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#E84672")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "#B8AE86")}
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
        <div
          style={{
            marginTop: "3rem",
            paddingTop: "2rem",
            borderTop: "1px solid #4D4529",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "1.5rem",
            }}
          >
            <div>
              <h4
                style={{
                  fontWeight: 600,
                  color: "#FFF9E8",
                  marginBottom: "0.25rem",
                  fontSize: "1rem",
                }}
              >
                Join the LotusMart family
              </h4>
              <p style={{ fontSize: "0.875rem", color: "#B8AE86", margin: 0 }}>
                Get exclusive deals, new arrivals, and recipes straight to your inbox.
              </p>
            </div>
            <form
              style={{ display: "flex", gap: "0.5rem", width: "100%", maxWidth: "420px" }}
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Enter your email"
                style={{
                  flex: 1,
                  padding: "0.625rem 1rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "#4D4529",
                  border: "1px solid #615834",
                  color: "#FFF9E8",
                  fontSize: "0.875rem",
                  outline: "none",
                  minWidth: 0,
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#E84672")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#615834")}
              />
              <button
                type="submit"
                style={{
                  padding: "0.625rem 1.25rem",
                  borderRadius: "0.75rem",
                  backgroundColor: "#E84672",
                  color: "#ffffff",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  border: "none",
                  cursor: "pointer",
                  flexShrink: 0,
                  transition: "background-color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#C9305A")}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#E84672")}
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div
        style={{ borderTop: "1px solid #4D4529", paddingTop: "1.25rem", paddingBottom: "1.25rem" }}
      >
        <div
          className="container-wide"
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "0.75rem",
            fontSize: "0.75rem",
            color: "#9C8F62",
          }}
        >
          <p style={{ margin: 0 }}>© {new Date().getFullYear()} LotusMart. All rights reserved.</p>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
              🔒 Secure payments
            </span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span>100% Authentic products</span>
            <span style={{ opacity: 0.4 }}>|</span>
            <span>FSSAI Licensed</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
