import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: "#1C2430",
        navy: {
          DEFAULT: "#14213D",
          50: "#EEF1F6",
          100: "#D7DDE9",
          400: "#3D4E75",
          600: "#1D2C4E",
          700: "#14213D",
          900: "#0C1526",
        },
        brass: {
          DEFAULT: "#C9A24B",
          50: "#FBF6EA",
          100: "#F3E6C2",
          400: "#D4B267",
          600: "#B58C36",
        },
        paper: "#F5F6F8",
        resolved: "#2F7D5C",
        urgent: "#B3492B",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "serif"],
        sans: ["var(--font-inter)", "sans-serif"],
        mono: ["var(--font-plex-mono)", "monospace"],
      },
      backgroundImage: {
        perforation:
          "repeating-linear-gradient(to bottom, transparent, transparent 5px, #D7DDE9 5px, #D7DDE9 10px)",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
