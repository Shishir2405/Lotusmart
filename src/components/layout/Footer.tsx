"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Variants } from "framer-motion";
import {
  RiInstagramLine,
  RiFacebookCircleLine,
  RiTwitterXLine,
  RiWhatsappLine,
  RiYoutubeLine,
  RiMailLine,
  RiPhoneLine,
  RiMapPinLine,
  RiArrowRightLine,
  RiLeafLine,
  RiShieldCheckLine,
  RiLockLine,
  RiHeartFill,
} from "react-icons/ri";
import { useContactInfo } from "@/hooks/useContactInfo";
import axios from "axios";


const staticLinks = {
  "Quick Links": [
    { label: "About Us", href: "/about" },
    { label: "Contact Us", href: "/contact" },
    { label: "Track Order", href: "/orders" },
    { label: "All Products", href: "/products" },
    { label: "Watch & Buy", href: "/reels" },
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

const socialConfig = [
  { key: "instagram", icon: RiInstagramLine, label: "Instagram", hoverBg: "#E1306C" },
  { key: "facebook", icon: RiFacebookCircleLine, label: "Facebook", hoverBg: "#1877F2" },
  { key: "twitter", icon: RiTwitterXLine, label: "Twitter / X", hoverBg: "#000000" },
  { key: "youtube", icon: RiYoutubeLine, label: "YouTube", hoverBg: "#FF0000" },
  { key: "whatsapp", icon: RiWhatsappLine, label: "WhatsApp", hoverBg: "#25D366" },
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
  const { contact } = useContactInfo();
  const [shopLinks, setShopLinks] = useState([
    { label: "All Products", href: "/products" },
  ]);

  useEffect(() => {
    axios
      .get<{ data: { name: string; slug: string }[] }>("/api/categories")
      .then((r) => {
        const cats = (r.data.data ?? []).map((c) => ({
          label: c.name,
          href: `/categories/${c.slug}`,
        }));
        setShopLinks([
          { label: "All Products", href: "/products" },
          ...cats,
          { label: "New Arrivals", href: "/products?sortBy=newest" },
        ]);
      })
      .catch(() => null);
  }, []);

  const footerContactItems = contact
    ? [
        { icon: RiMailLine, text: contact.email, href: `mailto:${contact.email}` },
        { icon: RiPhoneLine, text: contact.phone, href: `tel:${contact.phone.replace(/[^+\d]/g, "")}` },
        { icon: RiMapPinLine, text: contact.address, href: "#" },
      ]
    : [];

  const socials = socialConfig
    .map(({ key, icon, label, hoverBg }) => ({
      icon,
      href: contact?.socialLinks?.[key as keyof typeof contact.socialLinks],
      label,
      hoverBg,
    }))
    .filter(({ href }) => href && href.trim() !== "" && href !== "#");

  return (
    <footer style={{ backgroundColor: "#1c1914" }}>
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
              {footerContactItems.map(({ icon: Icon, text, href }) => (
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

          
          {Object.entries({ Shop: shopLinks, ...staticLinks }).map(([title, links]) => (
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


        <div
          className="mx-auto flex w-full max-w-[1400px] items-center justify-center px-6 pb-5 md:px-8 lg:px-12"
          style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: 14 }}
        >
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease: smoothEase }}
            className="flex items-center gap-2 text-xs"
            style={{ color: "#9C8F62" }}
          >
            <span>Made with</span>


            <span className="relative inline-flex h-5 w-5 items-center justify-center">
              <motion.span
                aria-hidden
                className="absolute inset-0 rounded-full"
                style={{
                  border: "1px dashed rgba(232, 70, 114, 0.55)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 4, ease: "linear", repeat: Infinity }}
              />
              <motion.span
                aria-hidden
                className="absolute"
                style={{
                  width: 4,
                  height: 4,
                  borderRadius: 9999,
                  backgroundColor: "#E84672",
                  top: -1,
                  left: "50%",
                  marginLeft: -2,
                  boxShadow: "0 0 6px rgba(232, 70, 114, 0.85)",
                }}
                animate={{ rotate: 360 }}
                transition={{ duration: 3, ease: "linear", repeat: Infinity }}
              />
              <motion.span
                className="relative inline-flex"
                animate={{ scale: [1, 1.25, 1, 1.18, 1] }}
                transition={{
                  duration: 1.2,
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 0.2,
                }}
              >
                <RiHeartFill size={12} style={{ color: "#E84672" }} />
              </motion.span>
            </span>

            <span>by</span>
            <motion.a
              href="https://positiveway.in"
              target="_blank"
              rel="noopener noreferrer"
              whileHover={{ color: "#E84672" }}
              transition={{ duration: 0.2 }}
              className="font-semibold tracking-wide"
              style={{ color: "#D4CFB3" }}
            >
              Positiveway Solutions Pvt Ltd
            </motion.a>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
