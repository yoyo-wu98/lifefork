import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        night: "oklch(0.22 0.018 255)",
        deep: "oklch(0.965 0.01 92)",
        ink: "oklch(0.24 0.018 255)",
        mist: "oklch(0.52 0.018 255)",
        gold: "oklch(0.57 0.08 78)",
        blue: "oklch(0.48 0.095 235)",
        violet: "oklch(0.47 0.085 305)",
      },
      boxShadow: {
        glow: "0 1px 2px rgba(26, 28, 36, 0.06), 0 24px 80px rgba(42, 37, 27, 0.09)",
        quiet: "0 1px 2px rgba(26, 28, 36, 0.05), 0 16px 44px rgba(26, 28, 36, 0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
