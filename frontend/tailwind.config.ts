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
        background: "#080812",
        card: "rgba(13,13,31,0.85)",
        "accent-purple": "#7c3aed",
        "accent-blue": "#2563eb",
        "accent-cyan": "#06b6d4",
        "accent-green": "#4ade80",
        "accent-red": "#f87171",
      },
    },
  },
  plugins: [],
};

export default config;
