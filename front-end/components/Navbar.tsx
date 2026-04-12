import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

export default function Navbar() {
  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 border-b-2"
      style={{ borderColor: "var(--brand-border)", background: "var(--nav-bg)" }}
    >
      <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative w-6 h-6">
            <Image
              src="/Verafi_Hero_Logo.png"
              alt="VeraFi"
              fill
              className="object-contain"
            />
          </div>
          <span className="font-mono font-medium text-brand-text text-base tracking-tight">
            vera<span className="text-brand-green font-bold">fi</span>
          </span>
        </Link>

        {/* Nav links — mono uppercase like Rysk */}
        <div className="hidden md:flex items-center gap-1">
          {[
            { label: "Earn", href: "/trade" },
            { label: "Write", href: "/write" },
            { label: "Board", href: "/board" },
            { label: "Exercise", href: "/exercise" },
            { label: "Feed", href: "/executions" },
          ].map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="px-3 py-1 text-sm font-mono font-medium text-brand-muted hover:text-brand-text hover:bg-black/5 transition-colors duration-100"
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Theme + CTA */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link href="/login" className="btn-primary text-sm py-2 px-5">
            Connect
          </Link>
        </div>
      </div>
    </nav>
  );
}
