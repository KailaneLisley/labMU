/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fdeaea",
          100: "#f6c4cb",
          200: "#ed8f96",
          300: "#e45a61",
          400: "#d4254c",
          500: "#8B1329",
          600: "#6b0f1f",
          700: "#4b0a17",
          800: "#2b060f",
          900: "#0b0207",
        },
      },
      fontFamily: {
        sans: ['"Inter"', "system-ui", "-apple-system", '"Segoe UI"', "Roboto", "sans-serif"],
      },
      borderRadius: {
        lg: "20px",
        md: "10px",
      },
      boxShadow: {
        card: "0 10px 40px rgba(139, 19, 41, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};
