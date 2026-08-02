# FPJ IA — Frontend

Plataforma inteligente de gestión documental de Policía Judicial. Frontend en Next.js (App Router) + TypeScript + Tailwind CSS, que consume la API del backend [`FPJ-IA`](https://github.com/assistenceit-arch/FPJ-IA).

## Requisitos

- Node.js 18.18+ (recomendado 20+)
- El backend `FPJ-IA` corriendo localmente (`npm run start:dev`, puerto 3000 por defecto)

## Puesta en marcha

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Abre [http://localhost:3001](http://localhost:3001) (o el puerto que Next.js asigne si el 3000 ya lo usa el backend).

## Estructura

```
src/
  app/
    login/                    Pantalla de inicio de sesión (pública)
    (app)/                    Rutas protegidas (requieren sesión)
      layout.tsx              Barra superior + cierre de sesión
      procedimientos/
        page.tsx               Listado de procedimientos
        nuevo/page.tsx          Creación de un procedimiento nuevo
        [id]/page.tsx           Detalle del procedimiento (formulario Bloques 1-6, en construcción)
  lib/
    api.ts                    Cliente HTTP hacia el backend (maneja token y errores)
    auth.ts                   Guardado/lectura del token JWT (cookie, 8h de expiración)
    tipos.ts                  Tipos compartidos del dominio
  middleware.ts                Protección de rutas basada en la cookie de sesión
```

## Estado de avance (Fase 5)

- [x] Scaffold del proyecto
- [x] Autenticación (login, protección de rutas, cierre de sesión)
- [x] Listado y creación de procedimientos
- [ ] Formulario único (Bloques 1-6, navegación libre, autoguardado, indicadores de estado)
- [ ] Generación y descarga de documentos
- [ ] Pagos

## Notas pendientes de verificar contra la API real

- El cuerpo exacto que espera `POST /procedimientos` (`src/app/(app)/procedimientos/nuevo/page.tsx`) es un primer intento razonable, no se ha probado end-to-end todavía — a diferencia del resto del backend, que sí se validó completo durante la Fase 4.
- El nombre exacto del campo del token en la respuesta de `POST /auth/login` (el cliente intenta `token`, `access_token` y `accessToken`, en ese orden).
