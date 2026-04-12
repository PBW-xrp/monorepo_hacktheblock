"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger, useGSAP);
}

const steps = [
  {
    step: "01",
    colorHex: "#25292E",
    title: "Lock collateral",
    body: "Writer deploys a ZK Smart Escrow. Buyer is the destination.",
  },
  {
    step: "02",
    colorHex: "#2aab63",
    title: "Pay premium",
    body: "Buyer sends a single XRPL Payment to the writer.",
  },
  {
    step: "03",
    colorHex: "#2aab63",
    title: "Prove & settle",
    body: "Groth16 ZK proof submitted on-chain. Escrow verifies and releases.",
  },
  {
    step: "04",
    colorHex: "#FF494A",
    title: "Or expire",
    body: "Out of the money? EscrowCancel returns collateral to writer.",
  },
];

export function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="px-6 py-20 max-w-4xl mx-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <p className="text-brand-muted text-sm uppercase tracking-widest font-medium mb-3">The Flow</p>
        <h2 className="text-3xl md:text-4xl font-bold text-brand-text tracking-tight">How it works</h2>
      </motion.div>

      <ol className="relative space-y-10 ml-4">
        {/* Timeline line — grows in via Framer Motion */}
        <motion.span
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
          className="absolute left-0 top-0 bottom-0 w-0.5 bg-black origin-top"
        />
        {steps.map((item, i) => (
          <motion.li
            key={item.step}
            initial={{ opacity: 0, x: -40, filter: "blur(8px)" }}
            animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            transition={{
              duration: 0.6,
              delay: 0.3 + i * 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="ml-8 cursor-default relative"
          >
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                duration: 0.5,
                delay: 0.4 + i * 0.15,
                type: "spring",
                stiffness: 300,
                damping: 15,
              }}
              className="absolute -left-12 flex items-center justify-center w-8 h-8 border-2 border-black bg-brand-bg text-sm font-bold font-mono"
              style={{ color: item.colorHex }}
            >
              {item.step}
            </motion.span>
            <h3 className="text-brand-text font-semibold mb-1">{item.title}</h3>
            <p className="text-brand-muted leading-relaxed">{item.body}</p>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

// ── Problem / Solution ────────────────────────────────────────────────────────

const problems = [
  {
    icon: "👁️",
    title: "Hidden pricing",
    body: "No way to verify if the spread is fair.",
  },
  {
    icon: "🔒",
    title: "Trust required",
    body: "No proof the computation was honest.",
  },
  {
    icon: "🌉",
    title: "XRP excluded",
    body: "Options need EVM wallets and bridges.",
  },
];

const solutions = [
  {
    icon: "🔐",
    title: "ZK-verified",
    body: "Groth16 proof guarantees honest pricing.",
  },
  {
    icon: "⛓️",
    title: "On-chain verified",
    body: "Smart Escrow validates the proof directly.",
  },
  {
    icon: "⚡",
    title: "4 transactions",
    body: "Create, pay, settle or cancel. Fully native.",
  },
];

export function ProblemSolution() {
  return (
    <section className="px-6 pb-28 max-w-6xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5 }}
        className="text-center mb-14"
      >
        <p className="text-brand-muted text-sm uppercase tracking-widest font-medium mb-3">The Case for VeraFi</p>
        <h2 className="text-3xl md:text-4xl font-bold text-brand-text tracking-tight">
          Why this matters
        </h2>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-5">
        {/* Problem card */}
        <motion.div
          initial={{ opacity: 0, x: -32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -4, boxShadow: "0 0 40px rgba(255,80,80,0.12)" }}
          className="rounded-2xl p-px cursor-default"
          style={{ background: "linear-gradient(135deg, rgba(255,80,80,0.25) 0%, rgba(255,80,80,0.05) 100%)" }}
        >
          <motion.div
            className="rounded-2xl p-7 h-full"
            style={{ background: "#eee9dd" }}
            whileHover={{ background: "#e8e3d6" }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.span
                whileHover={{ scale: 1.06, borderColor: "rgba(255,80,80,0.6)" }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-red-500/30 text-red-400/80 bg-red-500/5 cursor-default"
              >
                The Problem
              </motion.span>
            </div>
            <ul className="space-y-6">
              {problems.map((p, i) => (
                <motion.li
                  key={p.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                  className="flex gap-4"
                >
                  <span className="text-xl shrink-0 mt-0.5">{p.icon}</span>
                  <div>
                    <p className="text-brand-text font-semibold text-sm mb-1">{p.title}</p>
                    <p className="text-brand-text/45 text-sm leading-relaxed">{p.body}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* Solution card */}
        <motion.div
          initial={{ opacity: 0, x: 32 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -4, boxShadow: "0 0 48px rgba(42,171,99,0.18)" }}
          className="rounded-2xl p-px cursor-default"
          style={{ background: "linear-gradient(135deg, rgba(42,171,99,0.4) 0%, rgba(42,171,99,0.3) 100%)" }}
        >
          <motion.div
            className="rounded-2xl p-7 h-full"
            style={{ background: "#eee9dd" }}
            whileHover={{ background: "#e8e3d6" }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.span
                whileHover={{ scale: 1.06, borderColor: "rgba(42,171,99,0.6)" }}
                transition={{ type: "spring", stiffness: 400, damping: 18 }}
                className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-brand-blue/30 text-brand-blue/80 bg-brand-blue/5 cursor-default"
              >
                The VeraFi Solution
              </motion.span>
            </div>
            <ul className="space-y-6">
              {solutions.map((s, i) => (
                <motion.li
                  key={s.title}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: 0.1 + i * 0.08 }}
                  className="flex gap-4"
                >
                  <span className="text-xl shrink-0 mt-0.5">{s.icon}</span>
                  <div>
                    <p className="text-brand-text font-semibold text-sm mb-1">{s.title}</p>
                    <p className="text-brand-text/45 text-sm leading-relaxed">{s.body}</p>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

export function CTABanner() {
  return (
    <section className="px-6 pb-28">
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.97 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="max-w-4xl mx-auto rounded-3xl p-px"
        style={{
          background: "linear-gradient(135deg, rgba(42,171,99,0.4) 0%, rgba(255,73,74,0.4) 50%, rgba(42,171,99,0.4) 100%)",
        }}
      >
        <div
          className="rounded-3xl px-8 py-14 text-center"
          style={{ background: "#eee9dd" }}
        >
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-4xl font-bold text-brand-text mb-4 tracking-tight"
          >
            Ready to trade with proof?
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-brand-muted mb-8 max-w-lg mx-auto"
          >
            Connect your XRPL wallet and get a verifiably fair option quote in seconds.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.97 }}
            className="inline-block"
          >
            <Link href="/login" className="btn-primary text-white">
              Launch App
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

export function FeaturesHeader() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const y = useTransform(scrollYProgress, [0, 0.5], [60, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.3], [0, 1]);

  return (
    <motion.div
      ref={ref}
      style={{ y, opacity }}
      className="text-center mb-12"
    >
      <p className="text-brand-muted text-sm uppercase tracking-widest font-medium mb-3">Why VeraFi</p>
      <h2 className="text-3xl md:text-4xl font-bold text-brand-text tracking-tight">
        Trust built into every quote
      </h2>
    </motion.div>
  );
}
