import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06]"
      style={{ background: "rgba(10,13,20,0.85)", backdropFilter: "blur(16px)" }}
    >
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-8 h-8">
            <Image
              src="/Verafi_Hero_Logo.png"
              alt="VeraFi"
              fill
              className="object-contain rounded-md"
            />
          </div>
          <span className="font-semibold text-brand-text tracking-tight">
            Vera<span className="text-brand-blue">Fi</span>
          </span>
        </Link>

        {/* Nav links */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/write"
            className="text-sm text-brand-text/60 hover:text-brand-text transition-colors duration-150"
          >
            Write
          </Link>
          <Link
            href="/board"
            className="text-sm text-brand-text/60 hover:text-brand-text transition-colors duration-150"
          >
            Board
          </Link>
          <Link
            href="/trade"
            className="text-sm text-brand-text/60 hover:text-brand-text transition-colors duration-150"
          >
            Trade
          </Link>
          <Link
            href="/exercise"
            className="text-sm text-brand-text/60 hover:text-brand-text transition-colors duration-150"
          >
            Exercise
          </Link>
        </div>

        {/* CTA */}
        <Link href="/login" className="btn-primary text-white">
          Launch App
        </Link>
      </div>
    </nav>
  );
}
