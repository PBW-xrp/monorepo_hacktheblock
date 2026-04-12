import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // Rysk-inspired warm beige + single accent
        "brand-bg": "#eee9dd",
        "brand-surface": "#e8e3d6",
        "brand-border": "#000000",
        "brand-text": "#25292E",
        "brand-muted": "#3c4242",
        // Functional — single green accent for actions/CALL
        "brand-blue": "#2aab63",
        "brand-cyan": "#2aab63",
        "brand-purple": "#FF494A",
        "brand-green": "#2aab63",
        "brand-red": "#FF494A",
        // Status
        "brand-success": "#30E000",
        "brand-warning": "#FFD641",
        "brand-error": "#FF494A",
        // Win98 surface tones
        "win98-silver": "#c0c0c0",
        "win98-highlight": "#dfdfdf",
        "win98-shadow": "#808080",
        "win98-titlebar": "#000080",
      },
      fontFamily: {
        sans: ['"DM Sans"', "Inter", "system-ui", "sans-serif"],
        mono: ['"DM Mono"', '"Source Code Pro"', '"Space Mono"', "monospace"],
      },
      boxShadow: {
        // Rysk production — offset with mild blur
        "panel": "6px 6px 0 0 rgba(0,0,0,0.25)",
        "panel-hover": "8px 8px 0 0 rgba(0,0,0,0.3)",
        "panel-press": "2px 2px 0 0 rgba(0,0,0,0.2)",
        // Neobrutalism scale
        "brutal-sm": "3px 3px 0 0 #000",
        "brutal-md": "5px 5px 0 0 #000",
        "brutal-lg": "8px 8px 0 0 #000",
        // Button
        "btn": "0px 4px 12px rgba(0,0,0,0.1)",
        "btn-hover": "3px 3px 0 0 rgba(0,0,0,0.5)",
        // Win98 bevel
        "win98-raised": "inset -1px -1px #0a0a0a, inset 1px 1px #fff, inset -2px -2px #808080, inset 2px 2px #dfdfdf",
        "win98-sunken": "inset -1px -1px #fff, inset 1px 1px #808080, inset -2px -2px #dfdfdf, inset 2px 2px #0a0a0a",
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
