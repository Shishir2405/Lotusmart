"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ToastVariant = "success" | "error" | "info";

interface ToastLink {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface ToastItem {
  id: string;
  message: string;
  variant: ToastVariant;
  link?: ToastLink;
  duration: number;
  /** lifecycle: enter → visible → dissolving → done */
  phase: "enter" | "visible" | "dissolving" | "done";
}

interface ToastAPI {
  success: (message: string, opts?: { link?: ToastLink; duration?: number }) => string;
  error: (message: string, opts?: { link?: ToastLink; duration?: number }) => string;
  info: (message: string, opts?: { link?: ToastLink; duration?: number }) => string;
  dismiss: (id: string) => void;
}

/* ------------------------------------------------------------------ */
/*  Context                                                            */
/* ------------------------------------------------------------------ */

const ToastContext = createContext<ToastAPI | null>(null);

export function useToast(): ToastAPI {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>");
  return ctx;
}

/* ---- drop-in replacement so call-sites only change the import ---- */
const toast = Object.assign(
  (message: string, opts?: { link?: ToastLink; duration?: number }) => {
    return _globalAdd(message, "info", opts);
  },
  {
    success: (message: string, opts?: { link?: ToastLink; duration?: number }) =>
      _globalAdd(message, "success", opts),
    error: (message: string, opts?: { link?: ToastLink; duration?: number }) =>
      _globalAdd(message, "error", opts),
    info: (message: string, opts?: { link?: ToastLink; duration?: number }) =>
      _globalAdd(message, "info", opts),
    dismiss: (id: string) => _globalDismiss(id),
  },
);
export default toast;

/* global bridge — filled by <ToastProvider> on mount */
let _globalAdd: (
  msg: string,
  variant: ToastVariant,
  opts?: { link?: ToastLink; duration?: number },
) => string = () => "";
let _globalDismiss: (id: string) => void = () => {};

/* ------------------------------------------------------------------ */
/*  Provider                                                           */
/* ------------------------------------------------------------------ */

let _idCounter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const add = useCallback(
    (
      message: string,
      variant: ToastVariant,
      opts?: { link?: ToastLink; duration?: number },
    ) => {
      const id = `t-${++_idCounter}-${Date.now()}`;
      const duration = opts?.duration ?? 3500;
      setToasts((prev) => [
        ...prev,
        { id, message, variant, link: opts?.link, duration, phase: "enter" },
      ]);
      return id;
    },
    [],
  );

  const dismiss = useCallback((id: string) => {
    setToasts((prev) =>
      prev.map((t) => (t.id === id && t.phase !== "dissolving" ? { ...t, phase: "dissolving" as const } : t)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  /* expose to context + global bridge */
  const api: ToastAPI = {
    success: (msg, opts) => add(msg, "success", opts),
    error: (msg, opts) => add(msg, "error", opts),
    info: (msg, opts) => add(msg, "info", opts),
    dismiss,
  };

  useEffect(() => {
    _globalAdd = add;
    _globalDismiss = dismiss;
  }, [add, dismiss]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      {mounted &&
        createPortal(
          <div
            aria-live="polite"
            aria-atomic="true"
            style={{
              position: "fixed",
              top: 20,
              right: 20,
              zIndex: 99999,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              pointerEvents: "none",
            }}
          >
            {toasts.map((t, i) => (
              <SingleToast
                key={t.id}
                toast={t}
                index={i}
                onDismiss={dismiss}
                onRemove={remove}
              />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

/* ------------------------------------------------------------------ */
/*  Variant config                                                     */
/* ------------------------------------------------------------------ */

const VARIANT_CONFIG: Record<
  ToastVariant,
  { bg: string; border: string; icon: string; glow: string; particleColor: string }
> = {
  success: {
    bg: "rgba(230, 255, 237, 0.55)",
    border: "rgba(22, 163, 74, 0.25)",
    icon: "✓",
    glow: "rgba(22, 163, 74, 0.12)",
    particleColor: "#16a34a",
  },
  error: {
    bg: "rgba(255, 235, 235, 0.55)",
    border: "rgba(220, 38, 38, 0.25)",
    icon: "✕",
    glow: "rgba(220, 38, 38, 0.12)",
    particleColor: "#dc2626",
  },
  info: {
    bg: "rgba(237, 245, 255, 0.55)",
    border: "rgba(59, 130, 246, 0.25)",
    icon: "i",
    glow: "rgba(59, 130, 246, 0.12)",
    particleColor: "#3b82f6",
  },
};

/* ------------------------------------------------------------------ */
/*  Single toast                                                       */
/* ------------------------------------------------------------------ */

function SingleToast({
  toast: t,
  index,
  onDismiss,
  onRemove,
}: {
  toast: ToastItem;
  index: number;
  onDismiss: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const cfg = VARIANT_CONFIG[t.variant];
  const ref = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  /* enter → visible after paint */
  useEffect(() => {
    if (t.phase === "enter") {
      requestAnimationFrame(() => {
        onDismiss; // keep ref
        // transition to visible on next tick so CSS transition triggers
        const el = ref.current;
        if (el) {
          // force reflow
          void el.offsetHeight;
        }
      });
    }
  }, [t.phase, onDismiss]);

  /* auto-dismiss timer */
  useEffect(() => {
    if (t.phase === "enter" || t.phase === "visible") {
      timerRef.current = setTimeout(() => onDismiss(t.id), t.duration);
      return () => clearTimeout(timerRef.current);
    }
  }, [t.phase, t.id, t.duration, onDismiss]);

  /* dissolve → particle canvas → remove */
  useEffect(() => {
    if (t.phase !== "dissolving") return;

    const el = ref.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) {
      onRemove(t.id);
      return;
    }

    const rect = el.getBoundingClientRect();
    canvas.width = rect.width + 80;
    canvas.height = rect.height + 80;
    canvas.style.width = `${canvas.width}px`;
    canvas.style.height = `${canvas.height}px`;
    canvas.style.left = `${-40}px`;
    canvas.style.top = `${-40}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      onRemove(t.id);
      return;
    }

    /* generate particles across the toast rect */
    const PARTICLE_COUNT = 48;
    const particles: {
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      alpha: number;
      decay: number;
    }[] = [];

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: 40 + Math.random() * rect.width,
        y: 40 + Math.random() * rect.height,
        vx: (Math.random() - 0.5) * 3.5,
        vy: (Math.random() - 0.7) * 3,
        size: 1.5 + Math.random() * 3,
        alpha: 0.6 + Math.random() * 0.4,
        decay: 0.012 + Math.random() * 0.018,
      });
    }

    let raf: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      let alive = 0;

      for (const p of particles) {
        if (p.alpha <= 0) continue;
        alive++;
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.04; // float upward
        p.alpha -= p.decay;
        if (p.alpha <= 0) continue;

        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = cfg.particleColor;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      if (alive > 0) {
        raf = requestAnimationFrame(animate);
      } else {
        onRemove(t.id);
      }
    };

    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [t.phase, t.id, cfg.particleColor, onRemove]);

  const isDissolving = t.phase === "dissolving";

  return (
    <div
      style={{
        position: "relative",
        pointerEvents: "auto",
        transition: "transform 0.35s cubic-bezier(0.22,1,0.36,1), opacity 0.35s ease",
        transform: t.phase === "enter"
          ? `translateX(120%) scale(0.95)`
          : isDissolving
            ? `translateY(-8px) scale(0.92)`
            : `translateX(0) scale(1)`,
        opacity: isDissolving ? 0 : t.phase === "enter" ? 0 : 1,
      }}
    >
      {/* particle canvas (only visible during dissolve) */}
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          pointerEvents: "none",
          zIndex: 2,
          opacity: isDissolving ? 1 : 0,
        }}
      />

      <div
        ref={ref}
        role="status"
        onClick={() => onDismiss(t.id)}
        style={{
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "flex-start",
          gap: 12,
          minWidth: 280,
          maxWidth: 400,
          padding: "14px 18px",
          borderRadius: 16,
          cursor: "pointer",
          fontFamily: "var(--font-dm-sans), system-ui, sans-serif",

          /* glassmorphism */
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          boxShadow: `
            0 8px 32px rgba(0,0,0,0.08),
            0 2px 8px rgba(0,0,0,0.04),
            inset 0 1px 0 rgba(255,255,255,0.6),
            0 0 0 1px rgba(255,255,255,0.08)
          `,
          backdropFilter: "blur(24px) saturate(180%)",
          WebkitBackdropFilter: "blur(24px) saturate(180%)",

          transition: "transform 0.15s ease, box-shadow 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.015)";
          e.currentTarget.style.boxShadow = `
            0 12px 40px rgba(0,0,0,0.12),
            0 4px 12px rgba(0,0,0,0.06),
            inset 0 1px 0 rgba(255,255,255,0.7),
            0 0 20px ${cfg.glow}
          `;
          /* pause auto-dismiss on hover */
          clearTimeout(timerRef.current);
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = `
            0 8px 32px rgba(0,0,0,0.08),
            0 2px 8px rgba(0,0,0,0.04),
            inset 0 1px 0 rgba(255,255,255,0.6),
            0 0 0 1px rgba(255,255,255,0.08)
          `;
          /* resume timer on leave */
          timerRef.current = setTimeout(() => onDismiss(t.id), 1500);
        }}
      >
        {/* icon badge */}
        <span
          style={{
            flexShrink: 0,
            width: 26,
            height: 26,
            borderRadius: 9,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: t.variant === "info" ? 14 : 13,
            fontWeight: 800,
            fontStyle: t.variant === "info" ? "italic" : "normal",
            color: "#fff",
            background: `linear-gradient(135deg, ${cfg.particleColor}, ${cfg.particleColor}dd)`,
            boxShadow: `0 2px 8px ${cfg.particleColor}44`,
          }}
        >
          {cfg.icon}
        </span>

        {/* content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: 13,
              fontWeight: 500,
              lineHeight: 1.45,
              color: "#1C1917",
              wordBreak: "break-word",
            }}
          >
            {t.message}
          </p>

          {t.link && (
            <a
              href={t.link.href ?? "#"}
              onClick={(e) => {
                if (t.link?.onClick) {
                  e.preventDefault();
                  t.link.onClick();
                }
                onDismiss(t.id);
              }}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginTop: 6,
                fontSize: 12,
                fontWeight: 600,
                color: cfg.particleColor,
                textDecoration: "none",
                borderBottom: `1px solid ${cfg.particleColor}33`,
                paddingBottom: 1,
                transition: "border-color 0.15s ease",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderBottomColor = cfg.particleColor;
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.borderBottomColor = `${cfg.particleColor}33`;
              }}
            >
              {t.link.label}
              <span style={{ fontSize: 11 }}>→</span>
            </a>
          )}
        </div>

        {/* close hint */}
        <span
          style={{
            flexShrink: 0,
            fontSize: 14,
            lineHeight: 1,
            color: "#a8a29e",
            marginTop: 2,
            transition: "color 0.15s ease",
          }}
        >
          ×
        </span>

        {/* progress bar */}
        {!isDissolving && (
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 16,
              right: 16,
              height: 2,
              borderRadius: 1,
              overflow: "hidden",
              background: `${cfg.particleColor}15`,
            }}
          >
            <div
              style={{
                height: "100%",
                borderRadius: 1,
                background: `linear-gradient(90deg, ${cfg.particleColor}66, ${cfg.particleColor})`,
                animation: `toast-progress ${t.duration}ms linear forwards`,
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
