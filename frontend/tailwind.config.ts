import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "#F5F6F8",
        panel: "#FFFFFF",
        ink: {
          DEFAULT: "#161A20",
          soft: "#4B5563",
          faint: "#8A93A3",
        },
        nav: {
          DEFAULT: "#0F1720",
          raised: "#171F2A",
          border: "#232D3A",
          text: "#C7CEDA",
        },
        line: "#E4E6EA",
        accent: {
          DEFAULT: "#1F7A6C",
          soft: "#E4F2EF",
          strong: "#155A50",
        },
        warn: "#B4711F",
        danger: "#C4433C",
      },
      fontFamily: {
        display: ["var(--font-display)", "sans-serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 2px rgba(15, 23, 32, 0.06)",
      },
      keyframes: {
        pulseDot: {
          "0%, 100%": { opacity: "0.25" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        pulseDot: "pulseDot 1.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
