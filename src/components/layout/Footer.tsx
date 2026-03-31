"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  RiInstagramLine,
  RiFacebookCircleLine,
  RiTwitterXLine,
  RiWhatsappLine,
  RiMailLine,
  RiPhoneLine,
  RiMapPinLine,
  RiArrowRightLine,
  RiLeafLine,
  RiShieldCheckLine,
  RiLockLine,
  RiCheckLine,
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
  { icon: RiInstagramLine, href: "#", label: "Instagram", hoverBg: "#E1306C" },
  { icon: RiFacebookCircleLine, href: "#", label: "Facebook", hoverBg: "#1877F2" },
  { icon: RiTwitterXLine, href: "#", label: "Twitter / X", hoverBg: "#000000" },
  { icon: RiWhatsappLine, href: "#", label: "WhatsApp", hoverBg: "#25D366" },
];

const trustBadges = [
  { icon: RiLockLine, label: "Secure Payments" },
  { icon: RiLeafLine, label: "100% Authentic" },
  { icon: RiShieldCheckLine, label: "FSSAI Licensed" },
];

const smoothEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: smoothEase } },
};


function FooterLinkItem({ href, label }: { href: string; label: string }) {
  return (
    <li>
      <Link href={href}>
        <motion.span
          whileHover={{ x: 4, color: "#E84672" }}
          transition={{ duration: 0.15 }}
          className="inline-flex cursor-pointer items-center gap-1.5 text-sm transition-colors"
          style={{ color: "#B8AE86" }}
        >
          <motion.span
            initial={{ opacity: 0, width: 0 }}
            whileHover={{ opacity: 1, width: "auto" }}
            transition={{ duration: 0.15 }}
            style={{ overflow: "hidden" }}
          >
            <RiArrowRightLine size={11} style={{ color: "#E84672" }} />
          </motion.span>
          {label}
        </motion.span>
      </Link>
    </li>
  );
}


export function Footer() {
  const [email, setEmail] = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const [focused, setFocused] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes("@")) {
      setSubscribed(true);
      setEmail("");
    }
  };

  return (
    <footer style={{ backgroundColor: "#1c1914" }}>
      
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #2A2518 0%, #4D4529 50%, #615834 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        
        <div
          className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full opacity-10"
          style={{ border: "2px solid #FFE08A" }}
        />
        <div
          className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full opacity-10"
          style={{ border: "2px solid #FFE08A" }}
        />

        <div className="mx-auto w-full max-w-[1400px] px-6 py-10 md:px-8 lg:px-12">
          <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-center">
            <div className="max-w-sm">
              <span
                className="mb-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.65rem] font-bold tracking-widest uppercase"
                style={{
                  backgroundColor: "rgba(255,224,138,0.15)",
                  color: "#FFE08A",
                  border: "1px solid rgba(255,224,138,0.2)",
                }}
              >
                <RiLeafLine size={10} /> Newsletter
              </span>
              <h3 className="mb-1.5 text-xl leading-tight font-bold text-white">
                Join the LotusMart Family
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "#B8AE86" }}>
                Exclusive deals, new arrivals, and seasonal recipes straight to your inbox.
              </p>
            </div>

            <div className="w-full lg:w-auto lg:min-w-[400px]">
              <AnimatePresence mode="wait">
                {subscribed ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center gap-3 rounded-2xl px-5 py-4"
                    style={{
                      backgroundColor: "rgba(34,197,94,0.12)",
                      border: "1px solid rgba(34,197,94,0.25)",
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full"
                      style={{ backgroundColor: "#22c55e" }}
                    >
                      <RiCheckLine size={16} color="#fff" />
                    </motion.div>
                    <div>
                      <p className="text-sm font-semibold text-white">You are in.</p>
                      <p className="text-xs" style={{ color: "#B8AE86" }}>
                        Watch your inbox for good things.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.form key="form" onSubmit={handleSubscribe} className="flex gap-2">
                    <motion.div
                      animate={{ borderColor: focused ? "#E84672" : "#615834" }}
                      className="flex flex-1 items-center rounded-2xl px-4 py-2.5 transition-colors"
                      style={{ backgroundColor: "#2A2518", border: "1.5px solid #615834" }}
                    >
                      <RiMailLine
                        size={15}
                        style={{ color: "#9C8F62", flexShrink: 0, marginRight: "0.5rem" }}
                      />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        placeholder="Enter your email address"
                        className="min-w-0 flex-1 border-none bg-transparent text-sm outline-none"
                        style={{ color: "#FFF9E8", fontSize: "0.875rem" }}
                      />
                    </motion.div>
                    <motion.button
                      type="submit"
                      whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(232,70,114,0.3)" }}
                      whileTap={{ scale: 0.97 }}
                      className="flex-shrink-0 cursor-pointer rounded-2xl border-none px-5 py-2.5 text-sm font-semibold text-white"
                      style={{ backgroundColor: "#E84672" }}
                    >
                      Subscribe
                    </motion.button>
                  </motion.form>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </motion.div>

      
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="mx-auto w-full max-w-[1400px] px-6 py-14 md:px-8 lg:px-12"
      >
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
          
          <motion.div variants={itemVariants}>
            
            <Link href="/">
              <motion.span
                whileHover={{ opacity: 0.9 }}
                className="mb-4 inline-flex cursor-pointer items-center gap-0.5"
              >
                <span
                  className="text-[1.5rem] font-black tracking-tight"
                  style={{ color: "#FFF9E8" }}
                >
                  Lotus
                </span>
                <span
                  className="text-[1.5rem] font-black tracking-tight"
                  style={{ color: "#E84672" }}
                >
                  Mart
                </span>
              </motion.span>
            </Link>

            <p className="mb-6 max-w-xs text-sm leading-relaxed" style={{ color: "#9C8F62" }}>
              Premium quality spices, dry fruits, and thoughtful gift boxes — sourced from the
              finest farms across India and delivered to your doorstep.
            </p>

            
            <div className="mb-6 flex flex-col gap-3">
              {[
                {
                  icon: RiMailLine,
                  text: "hello@lotusmart.com",
                  href: "mailto:hello@lotusmart.com",
                },
                { icon: RiPhoneLine, text: "+91 98765 43210", href: "tel:+919876543210" },
                { icon: RiMapPinLine, text: "123 Spice Lane, Mumbai 400001", href: "#" },
              ].map(({ icon: Icon, text, href }) => (
                <Link key={text} href={href}>
                  <motion.span
                    whileHover={{ color: "#E84672", x: 2 }}
                    transition={{ duration: 0.15 }}
                    className="inline-flex cursor-pointer items-start gap-2.5 text-sm"
                    style={{ color: "#9C8F62" }}
                  >
                    <Icon size={14} style={{ color: "#E84672", flexShrink: 0, marginTop: 2 }} />
                    {text}
                  </motion.span>
                </Link>
              ))}
            </div>

            
            <div className="flex items-center gap-2">
              {socials.map(({ icon: Icon, href, label, hoverBg }, i) => (
                <motion.a
                  key={label}
                  href={href}
                  aria-label={label}
                  initial={{ opacity: 0, scale: 0 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.07, type: "spring", stiffness: 300 }}
                  whileHover={{ backgroundColor: hoverBg, color: "#ffffff", y: -3, scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl transition-colors"
                  style={{ backgroundColor: "#2A2518", color: "#D4CFB3" }}
                >
                  <Icon size={17} />
                </motion.a>
              ))}
            </div>
          </motion.div>

          
          {Object.entries(footerLinks).map(([title, links]) => (
            <motion.div key={title} variants={itemVariants}>
              <h4
                className="mb-5 text-[0.7rem] font-bold tracking-widest uppercase"
                style={{ color: "#FFE08A" }}
              >
                {title}
              </h4>
              <ul
                className="flex flex-col gap-3"
                style={{ listStyle: "none", padding: 0, margin: 0 }}
              >
                {links.map((link) => (
                  <FooterLinkItem key={link.href} href={link.href} label={link.label} />
                ))}
              </ul>
            </motion.div>
          ))}
        </div>
      </motion.div>

      
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="mx-auto flex w-full max-w-[1400px] flex-col items-center justify-between gap-4 px-6 py-5 sm:flex-row md:px-8 lg:px-12">
          <p className="text-xs" style={{ color: "#615834" }}>
            © {new Date().getFullYear()} LotusMart. All rights reserved.
          </p>

          
          <div className="flex items-center gap-5">
            {trustBadges.map(({ icon: Icon, label }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 6 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.4 }}
                className="flex items-center gap-1.5 text-xs"
                style={{ color: "#615834" }}
              >
                <Icon size={12} style={{ color: "#9C8F62" }} />
                {label}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
