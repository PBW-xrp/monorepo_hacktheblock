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
    colorHex: "#6b8fff",
    title: "Create an Option",
    body: "The writer locks collateral in a ZK Smart Escrow on XRPL — specifying strike, expiry, and the buyer's address.",
  },
  {
    step: "02",
    colorHex: "#00e5ff",
    title: "ZK Pricing",
    body: "Black-Scholes pricing runs inside a RISC Zero zkVM. The computation produces a Groth16 proof that the math is correct — verifiable by anyone.",
  },
  {
    step: "03",
    colorHex: "#9b6bff",
    title: "On-Chain Settlement",
    body: "The ZK proof is submitted as memos in an EscrowFinish transaction. The XRPL Smart Escrow verifies the proof on-chain and releases funds to the buyer.",
  },
  {
    step: "04",
    colorHex: "#6b8fff",
    title: "Trustless & Native",
    body: "Everything happens on XRPL. 4 transactions per option lifecycle. No bridge, no EVM, no intermediary.",
  },
];

export function HowItWorks() {
  const container = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      // Animate the line drawing down as user scrolls through the section
      gsap.fromTo(
        ".timeline-line",
        { scaleY: 0, transformOrigin: "top" },
        {
          scaleY: 1,
          ease: "none",
          scrollTrigger: {
            trigger: container.current,
            start: "top 70%",
            end: "bottom 80%",
            scrub: 1,
          },
        }
      );

      // Stagger reveal each step with scrub
      gsap.utils.toArray<HTMLElement>(".timeline-step").forEach((step) => {
        gsap.fromTo(
          step,
          { opacity: 0, x: -40, filter: "blur(8px)" },
          {
            opacity: 1,
            x: 0,
            filter: "blur(0px)",
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: {
              trigger: step,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });

      // Pulse the step numbers as they enter view
      gsap.utils.toArray<HTMLElement>(".timeline-number").forEach((num) => {
        gsap.fromTo(
          num,
          { scale: 0.5, opacity: 0 },
          {
            scale: 1,
            opacity: 1,
            duration: 0.6,
            ease: "back.out(2)",
            scrollTrigger: {
              trigger: num,
              start: "top 85%",
              toggleActions: "play none none reverse",
            },
          }
        );
      });
    },
    { scope: container }
  );

  return (
    <section
      ref={container}
      id="how-it-works"
      style={{ scrollMarginTop: "80px" }}
      className="px-6 pb-28 max-w-4xl mx-auto"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <p className="text-brand-text/40 text-sm uppercase tracking-widest font-medium mb-3">The Flow</p>
        <h2 className="text-3xl md:text-4xl font-bold text-brand-text tracking-tight">How it works</h2>
      </motion.div>

      <ol className="relative space-y-10 ml-4">
        {/* Animated timeline line */}
        <span className="timeline-line absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-brand-blue via-brand-cyan to-brand-purple" />
        {steps.map((item) => (
          <li key={item.step} className="timeline-step ml-8 cursor-default relative">
            <span
              className="timeline-number absolute -left-12 flex items-center justify-center w-8 h-8 rounded-full border border-white/[0.1] bg-brand-bg text-xs font-bold font-mono"
              style={{ color: item.colorHex, boxShadow: `0 0 16px ${item.colorHex}40` }}
            >
              {item.step}
            </span>
            <h3 className="text-brand-text font-semibold mb-1.5">{item.title}</h3>
            <p className="text-brand-text/50 text-sm leading-relaxed">{item.body}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}

// ── Problem / Solution ────────────────────────────────────────────────────────

const problems = [
  {
    icon: "👁️",
    title: "Black-box pricing",
    body: "Market makers quote options from hidden models. You have no way to know if the spread is fair or if the model was manipulated for the trade.",
  },
  {
    icon: "🔒",
    title: "Trust assumed, not earned",
    body: "Every options platform asks you to trust them. There is no verifiable record that the price you paid reflects an honest computation.",
  },
  {
    icon: "🌉",
    title: "XRP locked out",
    body: "Existing DeFi options markets require EVM wallets and wrapped assets. XRP holders face bridges, gas fees, and custodial risks just to access a quote.",
  },
];

const solutions = [
  {
    icon: "🔐",
    title: "ZK-verified pricing",
    body: "Every quote is computed inside a RISC Zero zkVM. A Groth16 proof guarantees the Black-Scholes math is correct — verifiable by anyone, unfakeable.",
  },
  {
    icon: "⛓️",
    title: "On-chain verification",
    body: "The ZK proof is verified directly by the XRPL Smart Escrow. No oracle to trust, no off-chain server — the ledger itself validates the computation.",
  },
  {
    icon: "⚡",
    title: "Native XRPL settlement",
    body: "Connect via Otsu, Crossmark, or Xaman. Collateral locked in escrow, premium paid via Payment, settlement via ZK proof. 4 transactions, fully trustless.",
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
        <p className="text-brand-text/40 text-sm uppercase tracking-widest font-medium mb-3">The Case for VeraFi</p>
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
            style={{ background: "linear-gradient(135deg, rgba(30,12,12,0.98) 0%, rgba(18,12,12,0.98) 100%)" }}
            whileHover={{ background: "linear-gradient(135deg, rgba(36,14,14,0.98) 0%, rgba(22,14,14,0.98) 100%)" }}
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
          whileHover={{ y: -4, boxShadow: "0 0 48px rgba(107,143,255,0.18)" }}
          className="rounded-2xl p-px cursor-default"
          style={{ background: "linear-gradient(135deg, rgba(107,143,255,0.4) 0%, rgba(0,229,255,0.3) 100%)" }}
        >
          <motion.div
            className="rounded-2xl p-7 h-full"
            style={{ background: "linear-gradient(135deg, rgba(10,16,32,0.98) 0%, rgba(10,20,28,0.98) 100%)" }}
            whileHover={{ background: "linear-gradient(135deg, rgba(13,20,42,0.98) 0%, rgba(10,24,34,0.98) 100%)" }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <motion.span
                whileHover={{ scale: 1.06, borderColor: "rgba(107,143,255,0.6)" }}
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
          background: "linear-gradient(135deg, rgba(107,143,255,0.4) 0%, rgba(155,107,255,0.4) 50%, rgba(0,229,255,0.4) 100%)",
        }}
      >
        <div
          className="rounded-3xl px-8 py-14 text-center"
          style={{ background: "linear-gradient(135deg, rgba(10,13,20,0.98) 0%, rgba(20,24,40,0.98) 100%)" }}
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
            className="text-brand-text/50 mb-8 max-w-lg mx-auto"
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
      <p className="text-brand-text/40 text-sm uppercase tracking-widest font-medium mb-3">Why VeraFi</p>
      <h2 className="text-3xl md:text-4xl font-bold text-brand-text tracking-tight">
        Trust built into every quote
      </h2>
    </motion.div>
  );
}
