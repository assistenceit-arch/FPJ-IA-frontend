import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

// Corrección 2026-09-02 (Etapa 2 de la actualización de Next.js): en
// la versión 15, eslint-config-next todavía exportaba internamente el
// formato clásico (`{extends: [...]}`), por lo que esta configuración
// necesitaba pasar por FlatCompat (@eslint/eslintrc) como puente. A
// partir de la versión 16, el paquete migró a exportar directamente
// arreglos en formato "flat config" nativo -- ya no hace falta el
// puente, la importación directa (esto es justo lo que el codemod
// oficial de Next.js había intentado generar desde el principio, solo
// que en su momento no correspondía todavía con lo que el paquete
// realmente exportaba).
const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
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
