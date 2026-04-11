"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import Navbar from "@/components/Navbar";
import FeatureCard from "@/components/FeatureCard";
import HeroSection from "@/components/HeroSection";
import { HowItWorks, CTABanner, FeaturesHeader, ProblemSolution } from "@/components/LandingSections";
import GenerativeShowcase from "@/components/GenerativeShowcase";
import CodeSnippetCard from "@/components/CodeSnippetCard";

function ShieldIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

function ChainIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
    </svg>
  );
}

function WalletIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
    </svg>
  );
}

function FeaturesSection() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "center center"],
  });
  const y = useTransform(scrollYProgress, [0, 1], [80, 0]);
  const opacity = useTransform(scrollYProgress, [0, 0.4], [0, 1]);

  return (
    <div id="features" style={{ scrollMarginTop: "80px" }}>
      <motion.section
        ref={ref}
        style={{ y, opacity }}
        className="px-6 pb-28 max-w-6xl mx-auto"
      >
        <FeaturesHeader />
        <div className="grid md:grid-cols-3 gap-5">
          <FeatureCard icon={<ShieldIcon />} glowColor="blue" delay={0}
            title="ZK-Verified Pricing"
            description="Every option price is computed via Black-Scholes inside a RISC Zero zkVM. A Groth16 proof guarantees the math is correct — verifiable by anyone, unfakeable."
          />
          <FeatureCard icon={<ChainIcon />} glowColor="cyan" delay={120}
            title="Trustless Settlement"
            description="ZK proofs are verified on-chain by the XRPL Smart Escrow. If the option is in the money, the escrow releases funds directly to the buyer. No intermediary."
          />
          <FeatureCard icon={<WalletIcon />} glowColor="purple" delay={240}
            title="XRPL Native"
            description="Connect via Otsu, Crossmark, or Xaman. No bridge, no EVM wallet, no wrapped assets — options trading where XRP already lives. 4 transactions, full lifecycle."
          />
        </div>
      </motion.section>
    </div>
  );
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-brand-bg overflow-x-hidden">
      <Navbar />
      <HeroSection />

      {/* ── Features ── */}
      <FeaturesSection />

      <HowItWorks />
      <CodeSnippetCard />
      <GenerativeShowcase />
      <ProblemSolution />
      <CTABanner />

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="relative w-6 h-6">
              <Image src="/Verafi_Hero_Logo.png" alt="VeraFi" fill className="object-contain rounded" />
            </div>
            <span className="text-sm font-medium text-brand-text/60">
              Vera<span className="text-brand-blue">Fi</span>
            </span>
          </div>
          <p className="text-xs text-brand-text/30">
            Built for Hack the Block 2026 · Paris Blockchain Week · XRPL groth5 Devnet
          </p>
        </div>
      </footer>
    </div>
  );
}
