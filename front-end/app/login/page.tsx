import Image from "next/image";
import Link from "next/link";
import WalletConnectPanel from "@/components/WalletConnectPanel";
import AuroraBackground from "@/components/AuroraBackground";
import Meteors from "@/components/Meteors";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Aurora + meteors */}
      <AuroraBackground />
      <Meteors number={5} />

      {/* Center radial glow (kept) */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #FF494A 0%, #25292E 40%, transparent 75%)",
          }}
        />
      </div>

      {/* Back link */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-brand-muted hover:text-brand-text/80 transition-colors z-20"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back
      </Link>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Logo with orbiting ring */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-20 h-20 mb-4 flex items-center justify-center">
            {/* Orbiting ring */}
            <div
              className="absolute inset-0 rounded-full border border-brand-cyan/20"
              style={{ animation: "spin-slow 20s linear infinite" }}
            />
            <div
              className="absolute inset-2 rounded-full border border-brand-blue/15"
              style={{ animation: "spin-slow 30s linear infinite reverse" }}
            />
            <div className="relative w-14 h-14">
              <Image
                src="/Verafi_Hero_Logo.png"
                alt="VeraFi"
                fill
                priority
                className="object-contain rounded-2xl"
                style={{ filter: "drop-shadow(0 0 24px rgba(42,171,99,0.6))" }}
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-brand-text tracking-tight">
            Connect Wallet
          </h1>
          <p className="text-brand-text/45 text-sm mt-1.5 text-center max-w-xs">
            Choose your XRPL wallet to access decentralized options on the XRP Ledger.
          </p>
        </div>

        {/* Wallet panel */}
        <WalletConnectPanel />
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
