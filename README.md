# PJ | Gestión Digital — Frontend

Frontend de **PJ | Gestión Digital** (nombre técnico interno del
repositorio: `FPJ-IA-frontend`). Next.js (App Router) + TypeScript +
Tailwind CSS, que consume la API del backend
[`assistenceit-arch/FPJ-IA`](https://github.com/assistenceit-arch/FPJ-IA)
— repositorio separado, ambos bajo la misma cuenta/organización de
GitHub, ambos privados. Este frontend no funciona sin ese backend
corriendo en paralelo.

## Requisitos

- Node.js 18.18+ (recomendado 20+)
- El backend `FPJ-IA` corriendo localmente (`npm run start:dev`, puerto
  3000 por defecto)

## Puesta en marcha

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Abre [http://localhost:3001](http://localhost:3001) (o el puerto que
Next.js asigne si el 3000 ya lo usa el backend).

## Estructura

```
src/
  app/
    login/                    Pantalla de inicio de sesión (pública)
    registro/                 Registro autónomo de cuenta (pública)
    (app)/                    Rutas protegidas (requieren sesión)
      layout.tsx              Barra superior con el escudo de marca
      admin/                  Panel de administración (pagos, usuarios,
                               exoneraciones, auditoría) -- exclusivo
                               de rol ADMINISTRADOR
      procedimientos/
        page.tsx               "Mis procedimientos" (con aviso de
                                eliminación automática por retención)
        nuevo/page.tsx          Creación de un procedimiento nuevo
        [id]/
          layout.tsx            Navegación entre los 8 bloques +
                                 indicadores de estado
          funcionario/          Bloque 1
          intervinientes/       Bloque 2 (Capturados/Aprehendidos)
          lugar/                Bloque 3
          actuaciones/          Bloque 4 (derechos, esposas, lesiones,
                                 testigos, víctimas -- todo individual
                                 por persona)
          elementos/            Bloque 5
          relato/               Bloque 6
          pago/                 Bloque 7
          documentos/           Bloque 8 (genera y descarga; muestra
                                 la advertencia de responsabilidad del
                                 funcionario una vez el pago queda
                                 verificado o exonerado)
          testigos/, victimas/  Fichas propias (núcleo común,
                                 condicionadas según el delito)
  lib/
    api.ts                    Cliente HTTP hacia el backend
    auth.ts                   Guardado/lectura del token JWT (cookie)
    tipos.ts                  Tipos compartidos del dominio
    delitos.ts                Catálogo de los 15 delitos soportados
    estados.ts                Lógica de "¿este bloque está completo?"
  middleware.ts                Protección de rutas por cookie de sesión
                                (excluye explícitamente /public/marca,
                                que debe cargar sin sesión)
public/
  marca/                      Escudo (header) e imagen de portada
                               (login), ambos en WebP optimizado
```

## Estado de avance

Formulario completo (Bloques 1-8) para los 15 delitos soportados, con
generación y descarga de documentos, pagos, panel de administración
con auditoría, y política de retención de datos (eliminación automática
de procedimientos a los 7 días de su creación, con aviso visible desde
el día 5).

## Identidad visual

La paleta de colores y las dos imágenes de marca (`public/marca/`) se
extrajeron directamente del escudo oficial de PJ | Gestión Digital —
ver `tailwind.config.ts` para los tokens de color (`institucional-*`
para la marca completa, `acento` para el verde de las acciones
primarias).
