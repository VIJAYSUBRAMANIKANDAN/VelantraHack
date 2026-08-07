/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        forest: { DEFAULT: "#1B5E3A", dark: "#123D26", light: "#245C3A" },
        growth: { DEFAULT: "#2E8B4F", light: "#7CB342", pale: "#E7F2E5" },
        sun: { DEFAULT: "#F5A623", light: "#FBBF24", dark: "#D9860F" },
        cream: "#FBF9F4",
        ink: { DEFAULT: "#1A2A20", soft: "#4A5A4E", faint: "#8C978F" },
      },
      fontFamily: {
        display: ["Sora", "sans-serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px -4px rgba(27,94,58,0.15)",
        card: "0 2px 12px rgba(27,94,58,0.08)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
    },
  },
  plugins: [],
}
