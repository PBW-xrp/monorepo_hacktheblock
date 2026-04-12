"use client";

import { useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
// Navbar is now in layout.tsx — global across all pages
import FeatureCard from "@/components/FeatureCard";
import HeroSection from "@/components/HeroSection";
import { HowItWorks, CTABanner, FeaturesHeader, ProblemSolution } from "@/components/LandingSections";
import GenerativeShowcase from "@/components/GenerativeShowcase";
import CodeSnippetCard from "@/components/CodeSnippetCard";
import FullpageScroll from "@/components/FullpageScroll";

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
  return (
    <div id="features" className="px-6 py-20 max-w-6xl mx-auto w-full">
      <FeaturesHeader />
      <div className="grid md:grid-cols-3 gap-5">
        <FeatureCard icon={<ShieldIcon />} glowColor="blue" delay={0}
          title="ZK Pricing"
          description="Black-Scholes inside a RISC Zero zkVM. Groth16 proof on every quote."
        />
        <FeatureCard icon={<ChainIcon />} glowColor="cyan" delay={120}
          title="On-Chain Settlement"
          description="Smart Escrow verifies the proof. Funds go directly to the buyer."
        />
        <FeatureCard icon={<WalletIcon />} glowColor="purple" delay={240}
          title="XRPL Native"
          description="No bridge, no EVM wallet. 4 transactions, full lifecycle."
        />
      </div>
    </div>
  );
}

function FooterSection() {
  return (
    <div className="flex flex-col items-center justify-center">
      <CTABanner />
      <footer className="border-t-2 border-black px-6 py-8 w-full">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="relative w-6 h-6">
              <Image src="/Verafi_Hero_Logo.png" alt="VeraFi" fill className="object-contain" />
            </div>
            <span className="font-mono font-medium text-brand-text">
              vera<span className="text-brand-green font-bold">fi</span>
            </span>
          </div>
          <p className="text-sm font-mono text-brand-muted">
            Hack the Block 2026 · Paris Blockchain Week
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function LandingPage() {
  return (
    <>
      {/* Navbar is in layout.tsx */}
      <FullpageScroll>
        {[
          <HeroSection key="hero" />,
          <FeaturesSection key="features" />,
          <HowItWorks key="how" />,
          <CodeSnippetCard key="code" />,
          <GenerativeShowcase key="gen" />,
          <ProblemSolution key="problem" />,
          <FooterSection key="footer" />,
        ]}
      </FullpageScroll>
    </>
  );
}
