import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        // Paleta de marca PJ | Gestión Digital — extraída del escudo
        // oficial (fondo azul-negro profundo, plata/cromado, verde de
        // acento). Institucional se mantiene como nombre de token por
        // continuidad con el resto del código, aunque ahora representa
        // la marca completa, no solo un tono "de gobierno".
        institucional: {
          950: "#04101F", // fondo de marca (header, hero de login)
          900: "#0A1A33",
          800: "#122A4D",
          700: "#1B3A66",
          600: "#28507F",
          100: "#E7ECF5",
          50: "#F4F6FB",
        },
        // Verde de marca (tomado del brillo del escudo, #17DF00) --
        // adaptado a un tono más profundo para que funcione como texto
        // y como fondo de botón sin perder legibilidad (el verde puro
        // de la imagen no pasa contraste AA ni como texto sobre blanco
        // ni como fondo con texto blanco). "brillante" conserva el
        // tono original para usos puramente decorativos (resplandor,
        // no texto).
        acento: {
          DEFAULT: "#128A00",
          hover: "#0E6E00",
          light: "#E3F5D8",
          brillante: "#17DF00",
        },
        estado: {
          completo: "#1E8E5A",
          pendiente: "#C98A12",
          error: "#C4392B",
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
