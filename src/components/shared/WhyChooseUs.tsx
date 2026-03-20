"use client";

import { motion } from "framer-motion";
import {
  RiLeafLine,
  RiTruckLine,
  RiShieldCheckLine,
  RiCustomerService2Line,
  RiAwardLine,
  RiHeartLine,
} from "react-icons/ri";

const features = [
  {
    icon: RiLeafLine,
    title: "100% Natural",
    desc: "No artificial colours, flavours or preservatives. Just pure, honest ingredients.",
    color: "text-green-600 bg-green-50",
  },
  {
    icon: RiShieldCheckLine,
    title: "FSSAI Certified",
    desc: "All products meet India's highest food safety standards. Tested before every batch.",
    color: "text-blue-600 bg-blue-50",
  },
  {
    icon: RiTruckLine,
    title: "Fast Delivery",
    desc: "Delivered in 2–5 business days. Free shipping on orders above ₹500.",
    color: "text-amber-600 bg-amber-50",
  },
  {
    icon: RiAwardLine,
    title: "Premium Grade",
    desc: "We source only the top-grade produce — extra bold, AA, and supreme quality selections.",
    color: "text-purple-600 bg-purple-50",
  },
  {
    icon: RiCustomerService2Line,
    title: "Expert Support",
    desc: "Our team is available Mon–Sat, 9AM–7PM to assist you with any query.",
    color: "text-[#E84672] bg-[#FFF1F3]",
  },
  {
    icon: RiHeartLine,
    title: "Easy Returns",
    desc: "Not satisfied? Return within 7 days for a full refund — no questions asked.",
    color: "text-[#7A6E42] bg-[#F7F6F0]",
  },
];

export function WhyChooseUs() {
  return (
    <section className="bg-[#F7F6F0] py-20">
      <div className="container-wide">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-neutral-900 mb-2">Why Choose LotusMart</h2>
          <p className="text-neutral-500 max-w-md mx-auto">
            We're not just a store — we're your partner for a healthier, more flavourful kitchen.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
              className="bg-white rounded-2xl p-6 hover:shadow-md transition-shadow duration-300"
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${f.color}`}>
                <f.icon size={24} />
              </div>
              <h3 className="text-base font-semibold text-neutral-900 mb-2">{f.title}</h3>
              <p className="text-sm text-neutral-500 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
