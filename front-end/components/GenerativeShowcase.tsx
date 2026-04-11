"use client";

import { motion } from "framer-motion";
import GenerativeOptionCard from "./GenerativeOptionCard";

const SAMPLES = [
  { strike: 1.15, vol: 4300, expiryDays: 7, isPut: false },
  { strike: 1.05, vol: 3200, expiryDays: 14, isPut: true },
  { strike: 1.30, vol: 7200, expiryDays: 90, isPut: false },
];

export default function GenerativeShowcase() {
  return (
    <section className="px-6 pb-28 max-w-6xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <p className="text-brand-text/40 text-sm uppercase tracking-widest font-medium mb-3">
          Every option, unique
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-brand-text tracking-tight mb-3">
          Generative Visual Identity
        </h2>
        <p className="text-brand-text/50 text-sm max-w-xl mx-auto">
          Each option contract gets its own deterministic art piece — derived from strike,
          volatility, expiry, and type. Same params, same art. Forever.
        </p>
      </motion.div>

      <div className="flex items-center justify-center gap-5 flex-wrap">
        {SAMPLES.map((sample, i) => (
          <motion.div
            key={`${sample.strike}-${sample.vol}-${sample.expiryDays}-${sample.isPut}`}
            initial={{ opacity: 0, y: 30, rotate: i % 2 === 0 ? -3 : 3 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{
              duration: 0.6,
              delay: i * 0.1,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <GenerativeOptionCard {...sample} size={180} />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
