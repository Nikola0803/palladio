import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: "#1E1F1B",
          50: "#FAFAF8",
          100: "#1E1F1B", // primary text (dark, on light surfaces)
          400: "#6B6C64", // muted text
          700: "#E5E4DD", // border
          800: "#FFFFFF", // card surface
          900: "#F6F6F2", // page background
        },
        gold: {
          DEFAULT: "#2F8F5B", // primary accent — clean green, "frames" highlight
          light: "#3FAE73",
          dim: "#F0F8F3", // tint for subtle green backgrounds
        },
        silver: "#767A82",
        rose: "#B8763E",
        moss: "#3E7D6B", // secondary success tone, distinct from primary green
        rust: "#B4553F",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      borderRadius: {
        stamp: "3px",
      },
      boxShadow: {
        card: "0 1px 2px rgba(30,31,27,0.04), 0 1px 8px rgba(30,31,27,0.04)",
        "card-hover": "0 2px 4px rgba(30,31,27,0.06), 0 4px 16px rgba(30,31,27,0.06)",
      },
      backgroundImage: {
        facet:
          "linear-gradient(135deg, rgba(47,143,91,0.05) 0%, rgba(47,143,91,0) 40%)",
      },
    },
  },
  plugins: [],
};

export default config;
