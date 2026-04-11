import Image from "next/image";
import Link from "next/link";
import WalletConnectPanel from "@/components/WalletConnectPanel";

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-brand-bg flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full opacity-10 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, #9b6bff 0%, #6b8fff 40%, transparent 75%)",
          }}
        />
      </div>

      {/* Back link */}
      <Link
        href="/"
        className="absolute top-6 left-6 flex items-center gap-2 text-sm text-brand-text/40 hover:text-brand-text/80 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
        </svg>
        Back
      </Link>

      {/* Card */}
      <div className="relative z-10 w-full max-w-md animate-fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative w-14 h-14 mb-4">
            <Image
              src="/Verafi_Hero_Logo.png"
              alt="VeraFi"
              fill
              priority
              className="object-contain rounded-2xl"
              style={{ filter: "drop-shadow(0 0 16px rgba(107,143,255,0.5))" }}
            />
          </div>
          <h1 className="text-2xl font-bold text-brand-text tracking-tight">
            Connect Wallet
          </h1>
          <p className="text-brand-text/45 text-sm mt-1.5 text-center max-w-xs">
            Choose your XRPL wallet to access verifiable options pricing.
          </p>
        </div>

        {/* Wallet panel */}
        <WalletConnectPanel />

      </div>
    </div>
  );
}
