/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        gold: { DEFAULT: "#F5A623", dark: "#C9841A", light: "#FFBE4D" },
        ink: {
          950: "#0A0A0A",
          900: "#111111",
          800: "#1A1A1A",
          700: "#222222",
        },
        muted: "#888888",
        danger: "#E63946",
      },
      fontFamily: {
        display: ['"Bebas Neue"', "sans-serif"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      borderRadius: { sm: "4px" },
      boxShadow: {
        gold: "0 12px 30px rgba(245,166,35,0.35)",
      },
      keyframes: {
        pulse2: {
          "0%,100%": { opacity: "1", transform: "scale(1)" },
          "50%": { opacity: "0.5", transform: "scale(0.8)" },
        },
        fadeUp: {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        pulse2: "pulse2 2s infinite",
        fadeUp: "fadeUp 0.6s ease both",
      },
    },
  },
  plugins: [],
};
