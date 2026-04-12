"use client";

import { useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";

const CODE_LINES = [
  { text: "// On-chain ZK verifier (Rust → wasm32v1-none)", color: "text-brand-muted" },
  { text: "#[unsafe(no_mangle)]", color: "text-brand-purple" },
  { text: "pub extern \"C\" fn finish() -> i32 {", color: "text-brand-cyan" },
  { text: "    let journal: [u8; 38] = get_memo(0);", color: "text-brand-text/80" },
  { text: "    let seal: [u8; 256] = get_memo(1);", color: "text-brand-text/80" },
  { text: "", color: "" },
  { text: "    // Verify Groth16 proof against options pricer", color: "text-brand-muted" },
  { text: "    let proof = Proof::from_seal_bytes(&seal)?;", color: "text-brand-text/80" },
  { text: "    let digest = risc0::hash_journal(&journal);", color: "text-brand-text/80" },
  { text: "    risc0::verify(&proof, &OPTIONS_PRICER_ID, &digest)?;", color: "text-brand-cyan" },
  { text: "", color: "" },
  { text: "    // Cross-check journal vs agreed params", color: "text-brand-muted" },
  { text: "    let strike = u64::from_le_bytes(journal[8..16]);", color: "text-brand-text/80" },
  { text: "    let is_itm = journal[37];", color: "text-brand-text/80" },
  { text: "    assert_eq!(strike, get_escrow_strike());", color: "text-brand-text/80" },
  { text: "", color: "" },
  { text: "    is_itm as i32  // 1 = release funds", color: "text-brand-cyan" },
  { text: "}", color: "text-brand-cyan" },
];

export default function CodeSnippetCard() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });
  const [visibleLines, setVisibleLines] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setVisibleLines(i);
      if (i >= CODE_LINES.length) clearInterval(interval);
    }, 80);
    return () => clearInterval(interval);
  }, [inView]);

  return (
    <section className="px-6 pb-28 max-w-5xl mx-auto" ref={ref}>
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.5 }}
        className="text-center mb-10"
      >
        <p className="text-brand-muted text-sm uppercase tracking-widest font-medium mb-3">
          The verifier
        </p>
        <h2 className="text-3xl md:text-4xl font-bold text-brand-text tracking-tight mb-3">
          On-chain verifier
        </h2>
        <p className="text-brand-muted text-sm max-w-md mx-auto">
          The escrow reads the ZK proof and verifies it. No trust, just math.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-3xl"
      >
        {/* Glow halo */}
        <div
          className="absolute -inset-4 rounded-3xl opacity-30 blur-2xl"
          style={{
            background: "radial-gradient(ellipse at center, rgba(42,171,99,0.4), rgba(255,73,74,0.2), transparent)",
          }}
        />

        <div className="relative rounded-2xl overflow-hidden border border-black/15 bg-[#eee9dd]/95 backdrop-blur-sm shadow-[0_0_60px_rgba(42,171,99,0.08)]">
          {/* Window header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-black/10 bg-white/[0.02]">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-400/70" />
              <span className="w-3 h-3 rounded-full bg-yellow-400/70" />
              <span className="w-3 h-3 rounded-full bg-green-400/70" />
            </div>
            <span className="font-mono text-xs text-brand-muted">escrow/src/lib.rs</span>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-brand-cyan animate-pulse" />
              <span className="text-[10px] text-brand-cyan/70 font-mono">groth5</span>
            </div>
          </div>

          {/* Code body */}
          <div className="p-6 font-mono text-xs leading-relaxed min-h-[420px]">
            {CODE_LINES.map((line, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{
                  opacity: i < visibleLines ? 1 : 0,
                  x: i < visibleLines ? 0 : -8,
                }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="flex items-start gap-4"
              >
                <span className="text-brand-muted/40 select-none w-6 text-right tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className={line.color || "text-brand-text/60"}>
                  {line.text || "\u00A0"}
                </span>
              </motion.div>
            ))}
            {/* Blinking cursor */}
            {visibleLines >= CODE_LINES.length && (
              <motion.span
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="inline-block w-2 h-3 bg-brand-cyan ml-2 align-middle"
                style={{ boxShadow: "0 0 8px rgba(42,171,99,0.8)" }}
              />
            )}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
