"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiAddLine, RiSubtractLine, RiArrowRightLine,
  RiLeafLine, RiTruckLine, RiShieldCheckLine,
  RiPhoneLine, RiQuestionLine, RiMailLine,
} from "react-icons/ri";

const faqs = [
  {
    category: "Products",
    icon: RiLeafLine,
    color: "#16A34A",
    colorLight: "#F0FDF4",
    colorBorder: "#BBF7D0",
    questions: [
      {
        q: "Are all your products 100% natural with no additives?",
        a: "Yes, every product we sell is free from artificial colours, flavours, preservatives, and fillers. We source directly from farms and small-batch processors who share our no-compromise philosophy. What's on the label is exactly what's inside.",
      },
      {
        q: "How do you ensure freshness across all products?",
        a: "We operate on a tight rotation — products are replenished in small batches weekly. Whole spices are vacuum-sealed within 48 hours of packing. Dry fruits are stored in climate-controlled facilities to preserve texture and nutrition.",
      },
      {
        q: "Do you offer organic-certified variants?",
        a: "Yes. Our Organic Range carries full FSSAI organic certification. These are grown without synthetic pesticides, fertilisers, or GMOs — verified at the source. Look for the green 'Certified' badge on product pages.",
      },
    ],
  },
  {
    category: "Shipping",
    icon: RiTruckLine,
    color: "#D97706",
    colorLight: "#FFFBEB",
    colorBorder: "#FDE68A",
    questions: [
      {
        q: "What is the delivery timeframe and cost?",
        a: "Standard delivery takes 2–5 business days across India. Online (prepaid) orders ship free. Cash on Delivery orders carry a flat ₹100 handling fee. Metro cities typically receive orders within 2 days.",
      },
      {
        q: "Do you ship to all pin codes in India?",
        a: "We cover 19,000+ pin codes through our logistics partners. You can check your pin code eligibility at checkout before placing an order — no surprises at the last step.",
      },
      {
        q: "Can I track my order in real time?",
        a: "Yes. Once dispatched you'll receive an SMS and email with a tracking link. You can also track directly from the 'My Orders' section of your account at any time.",
      },
    ],
  },
  {
    category: "Returns",
    icon: RiShieldCheckLine,
    color: "#E84672",
    colorLight: "#FFF1F3",
    colorBorder: "#FECDD3",
    questions: [
      {
        q: "What is your return and refund policy?",
        a: "We offer a no-questions-asked 7-day return window from the date of delivery. If you're unsatisfied for any reason, reach out and we'll arrange a pickup and full refund within 3–5 business days.",
      },
      {
        q: "What if my product arrives damaged or tampered?",
        a: "Report it within 48 hours with a photo and we'll send a replacement at no cost, typically within 2 days. Your trust is more important than the cost of a replacement.",
      },
    ],
  },
];

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

function AccordionItem({
  q, a, isOpen, onToggle, accentColor, accentLight, index,
}: {
  q: string; a: string; isOpen: boolean; onToggle: () => void;
  accentColor: string; accentLight: string; index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.04, duration: 0.38, ease }}
      className="group cursor-pointer"
      style={{ borderBottom: "1px solid #F0EDE6" }}
      onClick={onToggle}
    >
      
      <div className="flex items-start gap-3 py-4 pr-1">
        <p
          className="flex-1 text-[0.83rem] font-semibold leading-snug transition-colors duration-200"
          style={{ color: isOpen ? "#1c1917" : "#78716c" }}
        >
          {q}
        </p>

        <motion.div
          animate={{
            backgroundColor: isOpen ? accentColor : "#F7F6F0",
          }}
          transition={{ duration: 0.2 }}
          className="mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ border: isOpen ? "none" : "1px solid #EBE8D8" }}
        >
          {isOpen
            ? <RiSubtractLine size={11} color="#fff" />
            : <RiAddLine size={11} style={{ color: "#B8AE86" }} />
          }
        </motion.div>
      </div>

      
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease }}
            className="overflow-hidden"
          >
            <motion.div
              initial={{ y: -4 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.25 }}
              className="pb-4 pr-9"
            >
              <div
                className="w-8 h-0.5 rounded-full mb-3"
                style={{ backgroundColor: accentColor, opacity: 0.4 }}
              />
              <p className="text-[0.78rem] leading-[1.88] font-medium" style={{ color: "#78716c" }}>
                {a}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

interface FAQSectionProps {
  title?: string;
  subtitle?: string;
  settings?: Record<string, unknown>;
}

export function FAQSection({ title, subtitle, settings }: FAQSectionProps = {}) {
  const [openKey, setOpenKey] = useState<string>("0-0");
  const [activeCategory, setActiveCategory] = useState(0);

  const toggle = (key: string) => setOpenKey(openKey === key ? "" : key);

  // Homepage shows a short teaser only; the full list lives on /faqs.
  const HOME_FAQ_LIMIT = 3;
  const adminItems = Array.isArray(settings?.items)
    ? (settings!.items as { q: string; a: string }[])
        .filter(
          (i) => i && typeof i.q === "string" && typeof i.a === "string" && i.q.trim() && i.a.trim(),
        )
        .slice(0, HOME_FAQ_LIMIT)
    : [];

  const data = adminItems.length > 0
    ? [
        {
          category: title?.trim() || "Questions",
          icon: RiQuestionLine,
          color: "#E84672",
          colorLight: "#FFF1F3",
          colorBorder: "#FECDD3",
          questions: adminItems,
        },
      ]
    : faqs;

  const activeData = data[activeCategory] ?? data[0];

  return (
    <section className="relative overflow-hidden py-16 lg:py-24 bg-white">

      
      <div className="absolute top-0 left-0 right-0 h-px" style={{ backgroundColor: "#EBE8D8" }} />

      <div className="w-full max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12">

        
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px w-8" style={{ backgroundColor: "#E84672" }} />
              <span className="text-[0.55rem] font-black tracking-[0.28em] uppercase" style={{ color: "#C8BF9A" }}>
                Got Questions
              </span>
            </div>
            <h2 className="text-[clamp(1.9rem,3.8vw,3rem)] font-black leading-[0.96] tracking-[-0.04em] text-neutral-900">
              {title?.trim() ? (
                title
              ) : (
                <>
                  Frequently{" "}
                  <span style={{ color: "#E84672" }}>Asked.</span>
                </>
              )}
            </h2>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5, ease }}
            className="max-w-xs text-[0.78rem] leading-[1.85] font-medium"
            style={{ color: "#a8a29e" }}
          >
            Can't find what you're looking for?<br />
            Our support team is available Mon–Sat, 9AM–7PM.
          </motion.p>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-[200px_1fr] gap-8 lg:gap-14">

          
          <motion.div
            initial={{ opacity: 0, x: -14 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, ease }}
            className="flex flex-row lg:flex-col gap-1.5"
          >
            {data.map((cat, i) => {
              const isActive = activeCategory === i;
              return (
                <motion.button
                  key={cat.category}
                  onClick={() => { setActiveCategory(i); setOpenKey(`${i}-0`); }}
                  whileHover={{ x: isActive ? 0 : 2 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-left cursor-pointer w-full transition-colors"
                  style={{
                    backgroundColor: isActive ? cat.colorLight : "transparent",
                    border: isActive ? `1px solid ${cat.colorBorder}` : "1px solid transparent",
                  }}
                >
                  <span
                    className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors"
                    style={{
                      backgroundColor: isActive ? cat.color : "#F7F6F0",
                    }}
                  >
                    <cat.icon size={12} style={{ color: isActive ? "#fff" : "#C8BF9A" }} />
                  </span>
                  <span
                    className="text-[0.76rem] font-bold transition-colors"
                    style={{ color: isActive ? cat.color : "#a8a29e" }}
                  >
                    {cat.category}
                  </span>
                  {isActive && (
                    <motion.span layoutId="faq-indicator" className="ml-auto">
                      <RiArrowRightLine size={11} style={{ color: cat.color }} />
                    </motion.span>
                  )}
                </motion.button>
              );
            })}

            
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.35 }}
              className="hidden lg:block mt-5 p-4 rounded-2xl"
              style={{ backgroundColor: "#F7F6F0", border: "1px solid #EBE8D8" }}
            >
              <div className="w-7 h-7 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: "#FFF1F3", border: "1px solid #FECDD3" }}>
                <RiPhoneLine size={13} style={{ color: "#E84672" }} />
              </div>
              <p className="text-[0.75rem] font-bold text-neutral-700 mb-1">Still need help?</p>
              <p className="text-[0.68rem] leading-relaxed mb-3 font-medium" style={{ color: "#a8a29e" }}>
                Talk to a real human on our team.
              </p>
              <Link href="/contact">
                <motion.span
                  whileHover={{ gap: "0.5rem" }}
                  className="inline-flex items-center gap-1.5 text-[0.68rem] font-bold cursor-pointer"
                  style={{ color: "#E84672" }}
                >
                  Contact Us <RiArrowRightLine size={10} />
                </motion.span>
              </Link>
            </motion.div>
          </motion.div>

          
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.26, ease }}
            >
              
              <div
                className="flex items-center gap-2.5 mb-5 pb-4"
                style={{ borderBottom: "1px solid #F0EDE6" }}
              >
                <span
                  className="w-7 h-7 rounded-xl flex items-center justify-center"
                  style={{ backgroundColor: activeData.colorLight, border: `1px solid ${activeData.colorBorder}` }}
                >
                  <activeData.icon size={13} style={{ color: activeData.color }} />
                </span>
                <span
                  className="text-[0.62rem] font-black tracking-[0.18em] uppercase"
                  style={{ color: activeData.color }}
                >
                  {activeData.category}
                </span>
                <span className="text-[0.6rem] font-bold ml-1" style={{ color: "#C8BF9A" }}>
                  · {activeData.questions.length} questions
                </span>
              </div>

              
              <div>
                {activeData.questions.map((item, qi) => (
                  <AccordionItem
                    key={`${activeCategory}-${qi}`}
                    q={item.q}
                    a={item.a}
                    isOpen={openKey === `${activeCategory}-${qi}`}
                    onToggle={() => toggle(`${activeCategory}-${qi}`)}
                    accentColor={activeData.color}
                    accentLight={activeData.colorLight}
                    index={qi}
                  />
                ))}
              </div>

              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="mt-7 flex flex-wrap items-center gap-x-4 gap-y-3"
              >
                <Link href="/faqs">
                  <motion.span
                    whileHover={{ y: -2, boxShadow: "0 10px 24px rgba(232,70,114,0.22)" }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl px-5 py-2.5 text-[0.8rem] font-bold text-white select-none"
                    style={{ backgroundColor: "#E84672" }}
                  >
                    View all FAQs
                    <motion.span
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                      className="inline-flex"
                    >
                      <RiArrowRightLine size={14} />
                    </motion.span>
                  </motion.span>
                </Link>
                <span
                  className="flex items-center gap-1.5 text-[0.68rem] font-semibold"
                  style={{ color: "#C8BF9A" }}
                >
                  <RiQuestionLine size={11} style={{ color: "#D4CFB3" }} />
                  Can&apos;t find your answer?
                </span>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}