"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  RiLeafLine, RiTruckLine, RiShieldCheckLine,
  RiCustomerService2Line, RiAwardLine, RiHeartLine,
  RiArrowRightLine,
} from "react-icons/ri";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface WhyChooseUsItem {
  icon: string;
  title: string;
  description: string;
}

interface WhyChooseUsProps {
  title?: string;
  subtitle?: string;
  settings?: {
    items?: WhyChooseUsItem[];
    [key: string]: unknown;
  };
}

const ICON_MAP: Record<string, typeof RiLeafLine> = {
  RiLeafLine,
  RiTruckLine,
  RiShieldCheckLine,
  RiCustomerService2Line,
  RiAwardLine,
  RiHeartLine,
  leaf: RiLeafLine,
  truck: RiTruckLine,
  shield: RiShieldCheckLine,
  support: RiCustomerService2Line,
  award: RiAwardLine,
  heart: RiHeartLine,
};

const COLOR_ROTATION = [
  { iconColor: "#16A34A", accentColor: "#16A34A", accentLight: "#F0FDF4", accentBorder: "#BBF7D0" },
  { iconColor: "#2563EB", accentColor: "#2563EB", accentLight: "#EFF6FF", accentBorder: "#BFDBFE" },
  { iconColor: "#D97706", accentColor: "#D97706", accentLight: "#FFFBEB", accentBorder: "#FDE68A" },
  { iconColor: "#7C3AED", accentColor: "#7C3AED", accentLight: "#F5F3FF", accentBorder: "#DDD6FE" },
  { iconColor: "#E84672", accentColor: "#E84672", accentLight: "#FFF1F3", accentBorder: "#FECDD3" },
  { iconColor: "#7A6E42", accentColor: "#7A6E42", accentLight: "#F7F6F0", accentBorder: "#D4CFB3" },
];

function mapAPIItems(items: WhyChooseUsItem[]) {
  return items.map((item, i) => {
    const colors = COLOR_ROTATION[i % COLOR_ROTATION.length];
    const resolvedIcon = ICON_MAP[item.icon] || RiLeafLine;
    return {
      icon: resolvedIcon,
      index: String(i + 1).padStart(2, "0"),
      title: item.title,
      desc: item.description,
      ...colors,
    };
  });
}

export function WhyChooseUs({ title, subtitle, settings }: WhyChooseUsProps = {}) {
  const [hovered, setHovered] = useState<number | null>(null);

  const hasAdminItems =
    Array.isArray(settings?.items) && settings!.items!.length > 0;

  if (!hasAdminItems) return null;

  const activeFeatures = mapAPIItems(settings!.items!);

  return (
    <section className="relative overflow-hidden py-16 lg:py-24" style={{ backgroundColor: "#FAFAF8" }}>

      
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage: "radial-gradient(circle, #7A6E42 1.2px, transparent 1.2px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 w-full max-w-[1400px] mx-auto px-6 md:px-8 lg:px-12">

        {(title || subtitle) && (
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-14">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="h-px w-10" style={{ backgroundColor: "#E84672" }} />
                <span
                  className="text-[0.58rem] font-black tracking-[0.28em] uppercase"
                  style={{ color: "#B8AE86" }}
                >
                  Our Promise
                </span>
              </div>
              {title && (
                <h2 className="text-[clamp(2rem,4vw,3.2rem)] font-black leading-[0.96] tracking-[-0.04em] text-neutral-900">
                  {title}
                </h2>
              )}
            </motion.div>

            {subtitle && (
              <motion.p
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1, duration: 0.55, ease }}
                className="max-w-xs text-[0.82rem] leading-[1.85] text-neutral-400 font-medium"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        )}


        <div style={{ borderTop: "1px solid #EBE8D8" }}>
          {activeFeatures.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-30px" }}
              transition={{ delay: i * 0.055, duration: 0.45, ease }}
              onHoverStart={() => setHovered(i)}
              onHoverEnd={() => setHovered(null)}
              className="relative cursor-default group"
              style={{ borderBottom: "1px solid #EBE8D8" }}
            >
              
              <motion.div
                animate={{ opacity: hovered === i ? 1 : 0 }}
                transition={{ duration: 0.18 }}
                className="pointer-events-none absolute inset-0"
                style={{ backgroundColor: `${f.accentColor}06` }}
              />

              
              <motion.div
                animate={{ scaleY: hovered === i ? 1 : 0, opacity: hovered === i ? 1 : 0 }}
                transition={{ duration: 0.2 }}
                className="absolute left-0 top-0 bottom-0 w-[2px] rounded-full origin-bottom"
                style={{ backgroundColor: f.accentColor }}
              />

              <div className="relative flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-0 py-4 px-3">

                
                <span
                  className="text-[0.52rem] font-black tracking-[0.22em] w-10 flex-shrink-0 transition-colors duration-200"
                  style={{ color: hovered === i ? f.accentColor : "#D4CFB3" }}
                >
                  {f.index}
                </span>

                
                <motion.div
                  animate={{
                    backgroundColor: hovered === i ? f.accentLight : "#F7F6F0",
                    scale: hovered === i ? 1.06 : 1,
                  }}
                  transition={{ duration: 0.18 }}
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 sm:mr-5"
                  style={{ border: `1px solid ${hovered === i ? f.accentBorder : "#EBE8D8"}` }}
                >
                  <f.icon size={16} style={{ color: hovered === i ? f.iconColor : "#C8BF9A" }} />
                </motion.div>

                
                <motion.span
                  animate={{ color: hovered === i ? f.accentColor : "#292524" }}
                  transition={{ duration: 0.18 }}
                  className="text-[0.88rem] font-black tracking-tight flex-shrink-0 sm:w-44"
                >
                  {f.title}
                </motion.span>

                
                <p className="flex-1 text-[0.78rem] leading-relaxed sm:pl-5 font-medium" style={{ color: "#a8a29e" }}>
                  {f.desc}
                </p>

                
                <motion.span
                  animate={{ opacity: hovered === i ? 1 : 0, x: hovered === i ? 0 : -6 }}
                  transition={{ duration: 0.18 }}
                  className="hidden sm:flex flex-shrink-0 pl-5"
                  style={{ color: f.accentColor }}
                >
                  <RiArrowRightLine size={15} />
                </motion.span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}