import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Paleta institucional FPJ IA — pensada para un uso funcional,
        // legible bajo presión operativa, no para una página de marca.
        institucional: {
          950: "#0A1830", // fondo de barra superior / momentos de marca
          900: "#0F2245",
          800: "#16305C",
          700: "#1E3F73",
          600: "#2A5290",
          100: "#E7ECF5",
          50: "#F4F6FB",
        },
        acento: {
          DEFAULT: "#B8862E", // dorado institucional, uso restringido (acciones primarias)
          hover: "#9C7126",
          light: "#F3E7D0",
        },
        estado: {
          completo: "#1E8E5A", // 🟢
          pendiente: "#C98A12", // 🟡
          error: "#C4392B", // 🔴
        },
      },
      fontFamily: {
        display: [
          "Georgia",
          "Iowan Old Style",
          "Apple Garamond",
          "Baskerville",
          "Times New Roman",
          "serif",
        ],
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
