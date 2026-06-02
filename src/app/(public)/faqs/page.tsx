"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiAddLine,
  RiSubtractLine,
  RiSearchLine,
  RiLeafLine,
  RiTruckLine,
  RiShieldCheckLine,
  RiQuestionLine,
  RiArrowRightLine,
  RiHomeLine,
  RiBankCardLine,
  RiUser3Line,
} from "react-icons/ri";
import axios from "axios";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  sortOrder: number;
}

const categoryConfig: Record<
  string,
  { icon: typeof RiLeafLine; color: string; colorLight: string; colorBorder: string }
> = {
  Products: {
    icon: RiLeafLine,
    color: "#5C6B3C",
    colorLight: "#E8EDDD",
    colorBorder: "#C5D1A8",
  },
  Shipping: {
    icon: RiTruckLine,
    color: "#B59F6B",
    colorLight: "#F5F0E1",
    colorBorder: "#D4C99A",
  },
  "Returns & Refunds": {
    icon: RiShieldCheckLine,
    color: "#E84672",
    colorLight: "#FFF1F3",
    colorBorder: "#FECDD3",
  },
  "Orders & Payments": {
    icon: RiBankCardLine,
    color: "#2563EB",
    colorLight: "#EFF6FF",
    colorBorder: "#BFDBFE",
  },
  Account: {
    icon: RiUser3Line,
    color: "#7C3AED",
    colorLight: "#F5F3FF",
    colorBorder: "#DDD6FE",
  },
  General: {
    icon: RiQuestionLine,
    color: "#0D9488",
    colorLight: "#F0FDFA",
    colorBorder: "#99F6E4",
  },
};

const defaultFAQs: FAQItem[] = [];

function AccordionItem({
  item,
  isOpen,
  onToggle,
  accentColor,
  index,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  accentColor: string;
  accentLight: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.38, ease }}
      className="group cursor-pointer"
      style={{ borderBottom: "1px solid #F0EDE6" }}
      onClick={onToggle}
    >
      <div className="flex items-start gap-3 py-5 pr-1">
        <p
          className="flex-1 text-[0.92rem] font-semibold leading-snug transition-colors duration-200"
          style={{ color: isOpen ? "#1c1917" : "#78716c" }}
        >
          {item.question}
        </p>
        <motion.div
          animate={{ backgroundColor: isOpen ? accentColor : "#F7F6F0" }}
          transition={{ duration: 0.2 }}
          className="mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ border: isOpen ? "none" : "1px solid #EBE8D8" }}
        >
          {isOpen ? (
            <RiSubtractLine size={12} color="#fff" />
          ) : (
            <RiAddLine size={12} style={{ color: "#B8AE86" }} />
          )}
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
              className="pb-5 pr-10"
            >
              <div
                className="w-8 h-0.5 rounded-full mb-3"
                style={{ backgroundColor: accentColor, opacity: 0.4 }}
              />
              <p
                className="text-[0.85rem] leading-[1.88] font-medium"
                style={{ color: "#78716c" }}
              >
                {item.answer}
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function FAQsPage() {
  const [faqs, setFaqs] = useState<FAQItem[]>(defaultFAQs);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    axios
      .get("/api/site-config?key=faq")
      .then((res) => {
        const items = res.data?.data?.value?.items;
        if (Array.isArray(items) && items.length > 0) {
          setFaqs(items);
        }
      })
      .catch(() => {});
  }, []);


  const CATEGORIES = useMemo(
    () => [
      "All",
      ...Array.from(new Set(faqs.map((f) => f.category).filter(Boolean))),
    ],
    [faqs]
  );

  const filteredFAQs = useMemo(() => {
    let result = [...faqs];

    if (activeCategory !== "All") {
      result = result.filter((f) => f.category === activeCategory);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (f) =>
          f.question.toLowerCase().includes(q) ||
          f.answer.toLowerCase().includes(q)
      );
    }

    return result.sort((a, b) => a.sortOrder - b.sortOrder);
  }, [faqs, activeCategory, search]);

  const toggle = (id: string) => setOpenId(openId === id ? null : id);

  const getConfig = (category: string) =>
    categoryConfig[category] ?? categoryConfig.General;

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
          
          <motion.nav
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease }}
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
            <span style={{ color: "#78716c" }}>FAQs</span>
          </motion.nav>

          
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease }}
          >
            <div className="flex items-center gap-3 mb-3">
              <span className="h-px w-8" style={{ backgroundColor: "#E84672" }} />
              <span
                className="text-[0.6rem] font-black tracking-[0.28em] uppercase"
                style={{ color: "#B59F6B" }}
              >
                Help Center
              </span>
            </div>
            <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-black leading-[1.05] tracking-[-0.03em] text-neutral-900 mb-3">
              Frequently Asked{" "}
              <span style={{ color: "#E84672" }}>Questions</span>
            </h1>
            <p
              className="text-[0.9rem] leading-relaxed font-medium max-w-lg"
              style={{ color: "#a8a29e" }}
            >
              Everything you need to know about LotusMart. Can&apos;t find what
              you&apos;re looking for?{" "}
              <Link
                href="/contact"
                className="underline underline-offset-2 transition-colors"
                style={{ color: "#E84672" }}
              >
                Contact our team
              </Link>
              .
            </p>
          </motion.div>
        </div>
      </div>

      <div className="container-narrow py-10 md:py-14">
        
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.45, ease }}
          className="mb-8"
        >
          <div
            className="flex items-center gap-3 rounded-2xl px-5 py-3.5 transition-colors"
            style={{
              backgroundColor: "#fff",
              border: "1.5px solid #EBE8D8",
            }}
          >
            <RiSearchLine size={18} style={{ color: "#C8BF9A", flexShrink: 0 }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search FAQs..."
              className="flex-1 min-w-0 border-none bg-transparent text-[0.9rem] outline-none text-neutral-800 placeholder:text-[#C8BF9A]"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="text-[0.75rem] font-semibold cursor-pointer"
                style={{ color: "#E84672" }}
              >
                Clear
              </button>
            )}
          </div>
        </motion.div>

        
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45, ease }}
          className="flex flex-wrap gap-2 mb-10"
        >
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const cfg = cat !== "All" ? getConfig(cat) : null;
            const Icon = cfg?.icon;
            return (
              <motion.button
                key={cat}
                onClick={() => {
                  setActiveCategory(cat);
                  setOpenId(null);
                }}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[0.8rem] font-semibold cursor-pointer transition-colors"
                style={{
                  backgroundColor: isActive
                    ? cfg?.colorLight ?? "#FFF1F3"
                    : "#F7F6F0",
                  color: isActive ? cfg?.color ?? "#E84672" : "#a8a29e",
                  border: isActive
                    ? `1px solid ${cfg?.colorBorder ?? "#FECDD3"}`
                    : "1px solid #EBE8D8",
                }}
              >
                {Icon && <Icon size={14} />}
                {cat}
                {isActive && (
                  <span
                    className="text-[0.65rem] font-bold px-1.5 py-0.5 rounded-md"
                    style={{
                      backgroundColor: cfg?.color ?? "#E84672",
                      color: "#fff",
                    }}
                  >
                    {filteredFAQs.length}
                  </span>
                )}
              </motion.button>
            );
          })}
        </motion.div>

        
        <div
          className="rounded-2xl bg-white px-6 py-2"
          style={{ border: "1px solid #EBE8D8" }}
        >
          {filteredFAQs.length === 0 ? (
            <div className="py-16 text-center">
              <RiSearchLine
                size={36}
                className="mx-auto mb-4"
                style={{ color: "#D4CFB3" }}
              />
              <p className="text-[0.95rem] font-semibold text-neutral-600 mb-1">
                No FAQs found
              </p>
              <p className="text-[0.82rem] font-medium" style={{ color: "#a8a29e" }}>
                Try a different search term or category
              </p>
            </div>
          ) : (
            filteredFAQs.map((item, i) => {
              const cfg = getConfig(item.category);
              return (
                <AccordionItem
                  key={item.id}
                  item={item}
                  isOpen={openId === item.id}
                  onToggle={() => toggle(item.id)}
                  accentColor={cfg.color}
                  accentLight={cfg.colorLight}
                  index={i}
                />
              );
            })
          )}
        </div>

        
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 0.5, ease }}
          className="mt-12 text-center"
        >
          <div
            className="rounded-2xl px-8 py-10"
            style={{
              backgroundColor: "#FFF1F3",
              border: "1px solid #FECDD3",
            }}
          >
            <RiQuestionLine
              size={32}
              className="mx-auto mb-4"
              style={{ color: "#E84672" }}
            />
            <h3 className="text-lg font-bold text-neutral-800 mb-2">
              Still have questions?
            </h3>
            <p
              className="text-[0.85rem] font-medium mb-5 max-w-md mx-auto"
              style={{ color: "#78716c" }}
            >
              Our support team is available Monday to Saturday, 9 AM to 7 PM.
              We are always happy to help.
            </p>
            <Link href="/contact">
              <motion.span
                whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(232,70,114,0.25)" }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[0.85rem] font-semibold text-white cursor-pointer"
                style={{ backgroundColor: "#E84672" }}
              >
                Contact Us <RiArrowRightLine size={14} />
              </motion.span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
