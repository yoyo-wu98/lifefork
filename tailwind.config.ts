import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        night: "#080B14",
        deep: "#0B1020",
        ink: "#F4F0E8",
        mist: "#A8A8B3",
        gold: "#D6A85C",
        blue: "#8FB7FF",
        violet: "#B18CFF",
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.08), 0 20px 80px rgba(143,183,255,0.15)",
      },
    },
  },
  plugins: [],
};

export default config;
