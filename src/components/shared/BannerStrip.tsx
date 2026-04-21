"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { RiArrowRightLine, RiTimeLine } from "react-icons/ri";
import { normalizeImageUrl } from "@/utils/helpers";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface BannerStripProps {
  title?: string;
  subtitle?: string;
  settings?: {
    image?: string;
    title?: string;
    subtitle?: string;
    link?: string;
    [key: string]: unknown;
  };
}

export function BannerStrip({ title, subtitle, settings }: BannerStripProps = {}) {
  const image = settings?.image;
  const bannerTitle = settings?.title || "";
  const bannerSubtitle = settings?.subtitle || "";
  const bannerLink = settings?.link || "/products";

  if (!image) return null;

  return (
    <section className="py-16 lg:py-24" style={{ backgroundColor: "#FAFAF9" }}>
      <div className="mx-auto w-full max-w-[1400px] px-6 md:px-8 lg:px-12">
        {(title || subtitle) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.55, ease }}
            className="mb-10"
          >
            {title && (
              <h2 className="text-[clamp(1.9rem,3.5vw,2.8rem)] leading-tight font-black tracking-[-0.03em] text-neutral-900">
                {title}
              </h2>
            )}
            {subtitle && (
              <p className="mt-2 text-sm text-neutral-400">{subtitle}</p>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease }}
        >
          <Link href={bannerLink} className="group block">
            <motion.div
              whileHover={{ boxShadow: "0 28px 72px rgba(0,0,0,0.18)" }}
              transition={{ duration: 0.3, ease }}
              className="relative h-[320px] cursor-pointer overflow-hidden rounded-3xl md:h-[420px] lg:h-[480px]"
            >
              <Image
                src={normalizeImageUrl(image)}
                alt={bannerTitle || "Promotional banner"}
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="100vw"
                priority
              />

              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(110deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 45%, transparent 75%)",
                }}
              />

              <div className="absolute inset-0 z-10 flex flex-col justify-end p-8 md:p-10">
                {bannerTitle && (
                  <div className="mb-3 flex items-center gap-2">
                    <span className="h-px w-8 bg-white/60" />
                    <span className="text-[0.62rem] font-black tracking-[0.22em] uppercase text-white/70">
                      <span className="inline-flex items-center gap-1.5">
                        <RiTimeLine size={11} />
                        Featured
                      </span>
                    </span>
                  </div>
                )}

                {bannerTitle && (
                  <h3
                    className="mb-2 max-w-2xl leading-[0.95] font-black tracking-[-0.03em] whitespace-pre-line text-white"
                    style={{ fontSize: "clamp(2rem, 4vw, 3.25rem)" }}
                  >
                    {bannerTitle}
                  </h3>
                )}

                {bannerSubtitle && (
                  <p className="mb-6 max-w-xl text-[0.9rem] leading-relaxed text-white/75">
                    {bannerSubtitle}
                  </p>
                )}

                <motion.span
                  whileHover={{ x: 4 }}
                  className="inline-flex w-fit items-center gap-2 rounded-2xl bg-white px-5 py-3 text-[0.85rem] font-black text-neutral-900"
                >
                  Explore
                  <RiArrowRightLine size={15} />
                </motion.span>
              </div>
            </motion.div>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
