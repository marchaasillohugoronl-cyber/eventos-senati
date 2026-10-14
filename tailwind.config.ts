import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        // Azul institucional aproximado. Ajustar con la guía de marca oficial de SENATI.
        senati: {
          50: "#eff6ff",
          100: "#dbeafe",
          500: "#1d5fd1",
          600: "#0b4fb8",
          700: "#093f93",
          800: "#073076",
          900: "#04214f",
        },
      },
      keyframes: {
        floatUp: {
          "0%": { opacity: "0", transform: "translateY(24px)" },
          "10%": { opacity: "1" },
          "90%": { opacity: "1" },
          "100%": { opacity: "0", transform: "translateY(-24px)" },
        },
        fadeIn: { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        floatUp: "floatUp 6s ease-in-out forwards",
        fadeIn: "fadeIn 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};

export default config;
