"use client";

import { useEffect, useState } from "react";

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("verafi_theme");
    if (saved === "dark") {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("verafi_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("verafi_theme", "light");
    }
  };

  return (
    <button
      onClick={toggle}
      className="w-8 h-8 border-2 border-[var(--brand-border)] flex items-center justify-center font-mono text-xs font-bold hover:bg-[var(--brand-surface)] transition-colors"
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {dark ? "☀" : "☾"}
    </button>
  );
}
