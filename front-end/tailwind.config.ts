import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Light mode (Rysk beige)
        "brand-bg": "var(--brand-bg)",
        "brand-surface": "var(--brand-surface)",
        "brand-border": "var(--brand-border)",
        "brand-text": "var(--brand-text)",
        "brand-muted": "var(--brand-muted)",
        // Functional
        "brand-blue": "var(--brand-green)",
        "brand-cyan": "var(--brand-green)",
        "brand-purple": "var(--brand-red)",
        "brand-green": "var(--brand-green)",
        "brand-red": "var(--brand-red)",
        // Status
        "brand-success": "#30E000",
        "brand-warning": "#FFD641",
        "brand-error": "#FF494A",
      },
      fontFamily: {
        sans: ['"DM Sans"', "Inter", "system-ui", "sans-serif"],
        mono: ['"DM Mono"', '"Source Code Pro"', '"Space Mono"', "monospace"],
      },
      boxShadow: {
        "panel": "4px 4px 0 0 var(--shadow-color)",
        "panel-hover": "6px 6px 0 0 var(--shadow-color)",
        "brutal-sm": "3px 3px 0 0 var(--brand-border)",
        "brutal-md": "5px 5px 0 0 var(--brand-border)",
        "brutal-lg": "8px 8px 0 0 var(--brand-border)",
        "btn": "4px 4px 0 0 var(--brand-border)",
        "win98-sunken": "inset -1px -1px var(--sunken-light), inset 1px 1px var(--sunken-dark), inset -2px -2px var(--sunken-mid), inset 2px 2px var(--sunken-deep)",
      },
      borderRadius: {
        "rysk": "0.5rem",
        "none": "0",
        DEFAULT: "0",
      },
      animation: {
        "glow-pulse": "glow-pulse 2.5s ease-in-out infinite",
        "fade-in-up": "fade-in-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.4s ease-out forwards",
      },
      keyframes: {
        "glow-pulse": {
          "0%, 100%": { opacity: "0.6", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        "fade-in-up": {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
