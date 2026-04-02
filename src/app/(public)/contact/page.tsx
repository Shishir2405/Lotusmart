"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import toast from "@/components/ui/toast";
import {
  RiMailLine,
  RiPhoneLine,
  RiWhatsappLine,
  RiMapPinLine,
  RiTimeLine,
  RiSendPlaneLine,
  RiInstagramLine,
  RiFacebookCircleLine,
  RiTwitterXLine,
  RiYoutubeLine,
  RiHomeLine,
  RiUserLine,
  RiMessage2Line,
  RiArrowRightLine,
} from "react-icons/ri";
import { useContactInfo } from "@/hooks/useContactInfo";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

const socialIcons = [
  { key: "instagram", icon: RiInstagramLine, label: "Instagram", hoverColor: "#E1306C" },
  { key: "facebook", icon: RiFacebookCircleLine, label: "Facebook", hoverColor: "#1877F2" },
  { key: "twitter", icon: RiTwitterXLine, label: "Twitter / X", hoverColor: "#000000" },
  { key: "youtube", icon: RiYoutubeLine, label: "YouTube", hoverColor: "#FF0000" },
];

export default function ContactPage() {
  const { contact, loading } = useContactInfo();
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSubmitting(false);
    toast.success("Your message has been sent! We will get back to you shortly.");
    setForm({ name: "", email: "", subject: "", message: "" });
  };

  const contactDetails = contact
    ? [
        {
          icon: RiMailLine,
          label: "Email",
          value: contact.email,
          href: `mailto:${contact.email}`,
          color: "#2563EB",
          bg: "#EFF6FF",
          border: "#BFDBFE",
        },
        {
          icon: RiPhoneLine,
          label: "Phone",
          value: contact.phone,
          href: `tel:${contact.phone.replace(/[^+\d]/g, "")}`,
          color: "#5C6B3C",
          bg: "#E8EDDD",
          border: "#C5D1A8",
        },
        {
          icon: RiWhatsappLine,
          label: "WhatsApp",
          value: "Chat with us",
          href: `https://wa.me/${contact.whatsapp.replace(/[^+\d]/g, "")}`,
          color: "#25D366",
          bg: "#F0FDF4",
          border: "#BBF7D0",
        },
        {
          icon: RiMapPinLine,
          label: "Address",
          value: contact.address,
          href: "#map",
          color: "#B59F6B",
          bg: "#F5F0E1",
          border: "#D4C99A",
        },
      ]
    : [];

  return (
    <section className="min-h-screen bg-[#FFFDF7]">
      
      <div
        className="w-full py-12 md:py-16"
        style={{
          background: "linear-gradient(135deg, #FFF8F0 0%, #FDEEF2 50%, #F5F0E1 100%)",
          borderBottom: "1px solid #EBE8D8",
        }}
      >
        <div className="max-w-4xl mx-auto px-6">
          
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
            <span style={{ color: "#78716c" }}>Contact Us</span>
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
                Get In Touch
              </span>
            </div>
            <h1 className="text-[clamp(1.8rem,4vw,2.8rem)] font-black leading-[1.05] tracking-[-0.03em] text-neutral-900 mb-3">
              Contact{" "}
              <span style={{ color: "#E84672" }}>Us</span>
            </h1>
            <p
              className="text-[0.9rem] leading-relaxed font-medium max-w-lg"
              style={{ color: "#a8a29e" }}
            >
              Have a question, feedback, or just want to say hello? We would love
              to hear from you. Our team typically responds within 24 hours.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-10 md:py-14">

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="flex items-start gap-4 p-5 rounded-2xl bg-white animate-pulse"
                style={{ border: "1px solid #EBE8D8" }}
              >
                <div className="w-10 h-10 rounded-xl bg-gray-200" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-16 bg-gray-200 rounded" />
                  <div className="h-4 w-40 bg-gray-200 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5, ease }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12"
        >
          {contactDetails.map((item, i) => (
            <motion.a
              key={item.label}
              href={item.href}
              target={item.href.startsWith("http") ? "_blank" : undefined}
              rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 + i * 0.06, duration: 0.4, ease }}
              whileHover={{ y: -2, boxShadow: "0 6px 20px rgba(0,0,0,0.06)" }}
              className="flex items-start gap-4 p-5 rounded-2xl bg-white transition-shadow cursor-pointer"
              style={{ border: `1px solid ${item.border}` }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: item.bg, border: `1px solid ${item.border}` }}
              >
                <item.icon size={18} style={{ color: item.color }} />
              </div>
              <div className="min-w-0">
                <p
                  className="text-[0.7rem] font-bold tracking-widest uppercase mb-1"
                  style={{ color: "#B59F6B" }}
                >
                  {item.label}
                </p>
                <p className="text-[0.88rem] font-semibold text-neutral-700 break-words">
                  {item.value}
                </p>
              </div>
            </motion.a>
          ))}
        </motion.div>
        )}


        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5, ease }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12"
        >
          
          <div
            className="p-5 rounded-2xl bg-white"
            style={{ border: "1px solid #EBE8D8" }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: "#FFF1F3", border: "1px solid #FECDD3" }}
              >
                <RiTimeLine size={16} style={{ color: "#E84672" }} />
              </div>
              <div>
                <p
                  className="text-[0.7rem] font-bold tracking-widest uppercase"
                  style={{ color: "#B59F6B" }}
                >
                  Business Hours
                </p>
              </div>
            </div>
            <p className="text-[0.88rem] font-semibold text-neutral-700 mb-2">
              {contact?.businessHours ?? "—"}
            </p>
            <p className="text-[0.8rem] font-medium" style={{ color: "#a8a29e" }}>
              Closed on Sundays and public holidays
            </p>
          </div>

          
          <div
            className="p-5 rounded-2xl bg-white"
            style={{ border: "1px solid #EBE8D8" }}
          >
            <p
              className="text-[0.7rem] font-bold tracking-widest uppercase mb-4"
              style={{ color: "#B59F6B" }}
            >
              Follow Us
            </p>
            <div className="flex items-center gap-3">
              {socialIcons.map(({ key, icon: Icon, label, hoverColor }) => {
                const href =
                  contact?.socialLinks[key as keyof typeof contact.socialLinks];
                if (!href) return null;
                return (
                  <motion.a
                    key={key}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    whileHover={{
                      backgroundColor: hoverColor,
                      color: "#ffffff",
                      y: -3,
                      scale: 1.1,
                    }}
                    whileTap={{ scale: 0.9 }}
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl transition-colors"
                    style={{
                      backgroundColor: "#F7F6F0",
                      color: "#78716c",
                      border: "1px solid #EBE8D8",
                    }}
                  >
                    <Icon size={18} />
                  </motion.a>
                );
              })}
            </div>
            <p className="text-[0.8rem] font-medium mt-3" style={{ color: "#a8a29e" }}>
              Stay connected for offers and updates
            </p>
          </div>
        </motion.div>

        
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.5, ease }}
          className="rounded-2xl bg-white p-6 md:p-8 mb-12"
          style={{ border: "1px solid #EBE8D8" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "#FFF1F3", border: "1px solid #FECDD3" }}
            >
              <RiMessage2Line size={16} style={{ color: "#E84672" }} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-neutral-800">Send us a message</h2>
              <p className="text-[0.78rem] font-medium" style={{ color: "#a8a29e" }}>
                Fill out the form and we will be in touch
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              <div>
                <label
                  htmlFor="name"
                  className="block text-[0.78rem] font-semibold text-neutral-700 mb-1.5"
                >
                  Full Name <span style={{ color: "#E84672" }}>*</span>
                </label>
                <div
                  className="flex items-center gap-2.5 rounded-xl px-4 py-3 transition-colors"
                  style={{ backgroundColor: "#FAFAF8", border: "1.5px solid #EBE8D8" }}
                >
                  <RiUserLine size={15} style={{ color: "#B59F6B", flexShrink: 0 }} />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className="flex-1 min-w-0 bg-transparent border-none outline-none text-[0.88rem] text-neutral-800 placeholder:text-[#C8BF9A]"
                  />
                </div>
              </div>

              
              <div>
                <label
                  htmlFor="email"
                  className="block text-[0.78rem] font-semibold text-neutral-700 mb-1.5"
                >
                  Email Address <span style={{ color: "#E84672" }}>*</span>
                </label>
                <div
                  className="flex items-center gap-2.5 rounded-xl px-4 py-3 transition-colors"
                  style={{ backgroundColor: "#FAFAF8", border: "1.5px solid #EBE8D8" }}
                >
                  <RiMailLine size={15} style={{ color: "#B59F6B", flexShrink: 0 }} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your@email.com"
                    className="flex-1 min-w-0 bg-transparent border-none outline-none text-[0.88rem] text-neutral-800 placeholder:text-[#C8BF9A]"
                  />
                </div>
              </div>
            </div>

            
            <div>
              <label
                htmlFor="subject"
                className="block text-[0.78rem] font-semibold text-neutral-700 mb-1.5"
              >
                Subject
              </label>
              <select
                id="subject"
                name="subject"
                value={form.subject}
                onChange={handleChange}
                className="w-full rounded-xl px-4 py-3 text-[0.88rem] text-neutral-800 outline-none cursor-pointer appearance-none"
                style={{ backgroundColor: "#FAFAF8", border: "1.5px solid #EBE8D8" }}
              >
                <option value="">Select a topic</option>
                <option value="general">General Inquiry</option>
                <option value="order">Order Related</option>
                <option value="product">Product Question</option>
                <option value="bulk">Bulk / Corporate Order</option>
                <option value="feedback">Feedback</option>
                <option value="other">Other</option>
              </select>
            </div>

            
            <div>
              <label
                htmlFor="message"
                className="block text-[0.78rem] font-semibold text-neutral-700 mb-1.5"
              >
                Message <span style={{ color: "#E84672" }}>*</span>
              </label>
              <textarea
                id="message"
                name="message"
                value={form.message}
                onChange={handleChange}
                rows={5}
                placeholder="How can we help you?"
                className="w-full rounded-xl px-4 py-3 text-[0.88rem] text-neutral-800 outline-none resize-none placeholder:text-[#C8BF9A]"
                style={{ backgroundColor: "#FAFAF8", border: "1.5px solid #EBE8D8" }}
              />
            </div>

            
            <motion.button
              type="submit"
              disabled={submitting}
              whileHover={{ y: -2, boxShadow: "0 8px 20px rgba(232,70,114,0.25)" }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[0.88rem] font-semibold text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#E84672" }}
            >
              {submitting ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full inline-block"
                  />
                  Sending...
                </>
              ) : (
                <>
                  Send Message <RiSendPlaneLine size={15} />
                </>
              )}
            </motion.button>
          </form>
        </motion.div>

        
        {contact?.mapEmbedUrl && (
          <motion.div
            id="map"
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1, duration: 0.5, ease }}
            className="rounded-2xl overflow-hidden mb-12"
            style={{ border: "1px solid #EBE8D8" }}
          >
            <iframe
              src={contact.mapEmbedUrl}
              width="100%"
              height="350"
              style={{ border: 0 }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="LotusMart Location"
            />
          </motion.div>
        )}

        
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.15, duration: 0.5, ease }}
          className="text-center"
        >
          <div
            className="rounded-2xl px-8 py-10"
            style={{ backgroundColor: "#F7F6F0", border: "1px solid #EBE8D8" }}
          >
            <h3 className="text-lg font-bold text-neutral-800 mb-2">
              Looking for quick answers?
            </h3>
            <p
              className="text-[0.85rem] font-medium mb-5 max-w-md mx-auto"
              style={{ color: "#78716c" }}
            >
              Check our frequently asked questions for instant help on orders,
              shipping, returns, and more.
            </p>
            <Link href="/faqs">
              <motion.span
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-[0.85rem] font-semibold cursor-pointer"
                style={{
                  backgroundColor: "#fff",
                  color: "#E84672",
                  border: "1px solid #FECDD3",
                }}
              >
                View FAQs <RiArrowRightLine size={14} />
              </motion.span>
            </Link>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
