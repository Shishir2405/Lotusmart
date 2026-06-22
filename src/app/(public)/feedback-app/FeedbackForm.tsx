"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  RiStarFill,
  RiStarLine,
  RiCheckLine,
  RiHeart3Line,
  RiChat3Line,
} from "react-icons/ri";
import apiClient from "@/lib/api-client";
import toast from "@/components/ui/toast";

const PARTS = [
  "Browsing categories / products",
  "Search",
  "Product details page",
  "Add to cart",
  "Checkout & payment (prepaid)",
  "Delivery address / location auto-fill",
  "Deals / offers",
  "Login / Sign up",
  "Profile / account",
];

const RATING_LABELS = ["", "Poor", "Fair", "Good", "Great", "Excellent"];

export function FeedbackForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneModel, setPhoneModel] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [partsTried, setPartsTried] = useState<string[]>([]);
  const [bug, setBug] = useState("");
  const [confusing, setConfusing] = useState("");
  const [liked, setLiked] = useState("");
  const [improve, setImprove] = useState("");
  const [nps, setNps] = useState<number | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const togglePart = (p: string) =>
    setPartsTried((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const mail = email.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) {
      toast.error("Please enter a valid email so we can reply.");
      return;
    }
    if (!rating) {
      toast.error("Please tap an overall rating (1–5 stars).");
      return;
    }
    if (!bug.trim()) {
      toast.error("Please tell us about any bug/crash (type “None” if there wasn't one).");
      return;
    }
    setSubmitting(true);
    try {
      await apiClient.post("/api/feedback", {
        name,
        email: mail,
        phoneModel,
        rating,
        partsTried,
        bug,
        confusing,
        liked,
        improve,
        nps,
      });
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        "Couldn't submit — please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <section className="min-h-screen bg-[#FFFDF7]">
        <div className="container-narrow py-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto max-w-md rounded-2xl bg-white p-8 text-center"
            style={{ border: "1px solid #EBE8D8" }}
          >
            <div
              className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full"
              style={{ backgroundColor: "#F0FDF4", border: "1px solid #BBF7D0" }}
            >
              <RiCheckLine size={26} style={{ color: "#16A34A" }} />
            </div>
            <h1 className="text-xl font-black text-neutral-900">Thank you! 🙏</h1>
            <p className="mt-2 text-sm font-medium leading-relaxed text-neutral-500">
              Your feedback was submitted. It genuinely helps us make LotusMart better — we read
              every response.
            </p>
            <button
              onClick={() => {
                setSubmitted(false);
                setRating(0);
                setPartsTried([]);
                setBug("");
                setConfusing("");
                setLiked("");
                setImprove("");
                setNps(null);
              }}
              className="mt-6 text-sm font-bold"
              style={{ color: "#E84672" }}
            >
              Submit another response
            </button>
          </motion.div>
        </div>
      </section>
    );
  }

  const labelCls = "mb-1.5 block text-sm font-semibold text-neutral-700";
  const inputCls =
    "w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-neutral-800 outline-none transition-colors placeholder:text-[#C8BF9A] focus:border-[#E84672]";
  const inputStyle = { borderColor: "#EBE8D8" } as const;
  const reqDot = <span style={{ color: "#E84672" }}>*</span>;

  return (
    <section className="min-h-screen bg-[#FFFDF7]">
      {/* Hero */}
      <div
        className="w-full py-12 md:py-14"
        style={{
          background: "linear-gradient(135deg, #FFF8F0 0%, #FDEEF2 50%, #E8EDDD 100%)",
          borderBottom: "1px solid #EBE8D8",
        }}
      >
        <div className="container-narrow">
          <div className="mb-3 flex items-center gap-3">
            <span className="h-px w-8" style={{ backgroundColor: "#E84672" }} />
            <span
              className="text-[0.6rem] font-black tracking-[0.28em] uppercase"
              style={{ color: "#B59F6B" }}
            >
              App Testers
            </span>
          </div>
          <h1 className="text-[clamp(1.6rem,3.6vw,2.4rem)] font-black leading-[1.1] tracking-[-0.03em] text-neutral-900">
            Help us improve <span style={{ color: "#E84672" }}>LotusMart</span> — your feedback
            takes 1 minute.
          </h1>
          <p className="mt-2 max-w-xl text-[0.88rem] font-medium leading-relaxed text-neutral-500">
            Tried the app? Tell us what worked, what broke, and what we should add. Only email and
            a rating are required.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="container-narrow py-10">
        <div className="mx-auto max-w-2xl space-y-5">
          {/* Section 1 — Who */}
          <div className="rounded-2xl bg-white p-5 md:p-6" style={{ border: "1px solid #EBE8D8" }}>
            <h2 className="mb-4 text-sm font-black tracking-wide text-neutral-800 uppercase">
              About you
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>Name <span className="text-neutral-300">(optional)</span></label>
                <input className={inputCls} style={inputStyle} value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
              </div>
              <div>
                <label className={labelCls}>Email {reqDot}</label>
                <input className={inputCls} style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
              <div className="sm:col-span-2">
                <label className={labelCls}>Phone model <span className="text-neutral-300">(optional)</span></label>
                <input className={inputCls} style={inputStyle} value={phoneModel} onChange={(e) => setPhoneModel(e.target.value)} placeholder="e.g. Samsung M31, Android 12" />
              </div>
            </div>
          </div>

          {/* Section 2 — Experience */}
          <div className="rounded-2xl bg-white p-5 md:p-6" style={{ border: "1px solid #EBE8D8" }}>
            <h2 className="mb-4 text-sm font-black tracking-wide text-neutral-800 uppercase">
              Your experience
            </h2>

            <label className={labelCls}>Overall rating {reqDot}</label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((n) => {
                const active = (hoverRating || rating) >= n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHoverRating(n)}
                    onMouseLeave={() => setHoverRating(0)}
                    aria-label={`${n} star${n > 1 ? "s" : ""}`}
                    className="transition-transform hover:scale-110"
                  >
                    {active ? (
                      <RiStarFill size={30} style={{ color: "#F5A623" }} />
                    ) : (
                      <RiStarLine size={30} style={{ color: "#D4CFB3" }} />
                    )}
                  </button>
                );
              })}
              {(hoverRating || rating) > 0 && (
                <span className="ml-2 text-sm font-bold text-neutral-500">
                  {RATING_LABELS[hoverRating || rating]}
                </span>
              )}
            </div>

            <label className={`${labelCls} mt-6`}>Which parts did you try? <span className="text-neutral-300">(optional)</span></label>
            <div className="flex flex-wrap gap-2">
              {PARTS.map((p) => {
                const on = partsTried.includes(p);
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => togglePart(p)}
                    className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-[0.8rem] font-semibold transition-colors"
                    style={{
                      backgroundColor: on ? "#FFF1F3" : "#F7F6F0",
                      color: on ? "#E84672" : "#78716c",
                      border: `1px solid ${on ? "#FECDD3" : "#EBE8D8"}`,
                    }}
                  >
                    {on && <RiCheckLine size={13} />}
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3 — Useful feedback */}
          <div className="rounded-2xl bg-white p-5 md:p-6" style={{ border: "1px solid #EBE8D8" }}>
            <h2 className="mb-4 flex items-center gap-2 text-sm font-black tracking-wide text-neutral-800 uppercase">
              <RiChat3Line size={16} style={{ color: "#E84672" }} /> Tell us more
            </h2>
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Did you find any bug or crash? Where? {reqDot}</label>
                <textarea className={`${inputCls} min-h-[88px] resize-y`} style={inputStyle} value={bug} onChange={(e) => setBug(e.target.value)} placeholder="Describe the bug and where it happened (or type “None”)." required />
              </div>
              <div>
                <label className={labelCls}>Was anything confusing or hard to use?</label>
                <textarea className={`${inputCls} min-h-[72px] resize-y`} style={inputStyle} value={confusing} onChange={(e) => setConfusing(e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <label className={labelCls}>What did you like most?</label>
                <textarea className={`${inputCls} min-h-[72px] resize-y`} style={inputStyle} value={liked} onChange={(e) => setLiked(e.target.value)} placeholder="Optional" />
              </div>
              <div>
                <label className={labelCls}>What should we add or improve?</label>
                <textarea className={`${inputCls} min-h-[72px] resize-y`} style={inputStyle} value={improve} onChange={(e) => setImprove(e.target.value)} placeholder="Optional" />
              </div>
            </div>
          </div>

          {/* Section 4 — NPS */}
          <div className="rounded-2xl bg-white p-5 md:p-6" style={{ border: "1px solid #EBE8D8" }}>
            <label className={labelCls}>
              How likely are you to recommend LotusMart? <span className="text-neutral-300">(optional)</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: 11 }, (_, n) => {
                const on = nps === n;
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setNps(on ? null : n)}
                    className="h-9 w-9 rounded-lg text-sm font-bold transition-colors"
                    style={{
                      backgroundColor: on ? "#E84672" : "#F7F6F0",
                      color: on ? "#fff" : "#78716c",
                      border: `1px solid ${on ? "#E84672" : "#EBE8D8"}`,
                    }}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
            <div className="mt-1.5 flex justify-between text-[0.68rem] font-semibold text-neutral-400">
              <span>Not likely</span>
              <span>Very likely</span>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={submitting}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold text-white disabled:opacity-60"
            style={{ backgroundColor: "#E84672" }}
          >
            <RiHeart3Line size={16} />
            {submitting ? "Submitting…" : "Submit feedback"}
          </motion.button>
          <p className="text-center text-[0.72rem] font-medium text-neutral-400">
            We use your feedback only to improve the app. Required: email, rating, and the bug field.
          </p>
        </div>
      </form>
    </section>
  );
}
