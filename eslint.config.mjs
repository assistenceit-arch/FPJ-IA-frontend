import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Corrección 2026-09-02: el codemod oficial de Next.js (next-lint-to-eslint-cli)
// generó una configuración que asumía que eslint-config-next exportaba
// arreglos en formato "flat config" nativo -- pero, a la fecha, ese
// paquete sigue exportando el formato clásico (`{extends: [...]}`) por
// debajo. FlatCompat es el puente oficial y bien documentado para usar
// configuraciones clásicas dentro de un eslint.config.mjs moderno,
// hasta que Next.js termine su propia migración a flat config nativo.
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
];

export default eslintConfig;
