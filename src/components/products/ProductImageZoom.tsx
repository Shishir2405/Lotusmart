"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { RiZoomInLine } from "react-icons/ri";
import { normalizeImageUrl } from "@/utils/helpers";

interface Props {
  src: string;
  alt: string;
  discount?: number;
  zoom?: number;
  imageKey?: string | number;
}

const LENS_SIZE = 28; // % of the container — controls how much of the source the panel shows

export function ProductImageZoom({ src, alt, discount, zoom = 2.5, imageKey }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [hovering, setHovering] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = containerRef.current?.getBoundingClientRect();
    if (!r) return;
    const rawX = ((e.clientX - r.left) / r.width) * 100;
    const rawY = ((e.clientY - r.top) / r.height) * 100;
    setPos({
      x: Math.max(0, Math.min(100, rawX)),
      y: Math.max(0, Math.min(100, rawY)),
    });
  };

  const url = normalizeImageUrl(src);

  return (
    <div className="relative">
      <motion.div
        key={imageKey ?? src}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        ref={containerRef}
        onMouseEnter={() => setHovering(true)}
        onMouseLeave={() => setHovering(false)}
        onMouseMove={handleMouseMove}
        className="relative aspect-[4/5] sm:aspect-square rounded-2xl lg:rounded-3xl overflow-hidden bg-[#F7F6F0] cursor-zoom-in shadow-sm ring-1 ring-neutral-100"
      >
        <Image
          src={url}
          alt={alt}
          fill
          className={`object-cover transition-transform duration-300 ${
            hovering ? "lg:scale-[1.02]" : ""
          }`}
          sizes="(max-width: 1024px) 100vw, 50vw"
          priority
        />

        {discount && discount > 0 && (
          <div className="absolute top-4 left-4 px-3 py-1 rounded-full bg-[#E84672] text-white text-sm font-bold z-20 shadow-md">
            -{discount}%
          </div>
        )}

        {/* Hover hint — desktop only, fades when actually hovering */}
        <div
          className={`hidden lg:flex absolute bottom-4 right-4 items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/85 backdrop-blur-sm text-neutral-600 text-xs font-medium shadow-md transition-opacity z-20 ${
            hovering ? "opacity-0" : "opacity-100"
          }`}
        >
          <RiZoomInLine size={13} />
          Hover to zoom
        </div>

        {/* Lens — only on lg+ */}
        {hovering && (
          <div
            className="hidden lg:block absolute pointer-events-none border-2 border-white bg-white/15 shadow-[0_0_0_9999px_rgba(0,0,0,0.05)] rounded-md transition-[left,top] duration-75 ease-out z-10"
            style={{
              width: `${LENS_SIZE}%`,
              height: `${LENS_SIZE}%`,
              left: `calc(${pos.x}% - ${LENS_SIZE / 2}%)`,
              top: `calc(${pos.y}% - ${LENS_SIZE / 2}%)`,
            }}
          />
        )}
      </motion.div>

      {/* Zoom panel — overlays the right column on lg+ */}
      {hovering && (
        <div
          aria-hidden
          className="hidden lg:block absolute top-0 left-[calc(100%+24px)] w-full aspect-square rounded-3xl overflow-hidden bg-white border border-neutral-100 shadow-2xl pointer-events-none z-30"
        >
          <div
            className="w-full h-full bg-no-repeat bg-[#F7F6F0]"
            style={{
              backgroundImage: `url(${url})`,
              backgroundSize: `${zoom * 100}%`,
              backgroundPosition: `${pos.x}% ${pos.y}%`,
            }}
          />
        </div>
      )}
    </div>
  );
}
