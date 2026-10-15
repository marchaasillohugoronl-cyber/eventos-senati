# EventShare SENATI — base del proyecto

Plataforma web para la inauguración de la nueva sede de SENATI: muro de fotografías vía QR, proyección en TV (`/tv`),
panel de administración y captación voluntaria de interesados en **Ingeniería de Software con IA**.

Stack: Next.js 14 (App Router) · TypeScript · Tailwind · Prisma + Neon PostgreSQL · Auth.js (Google) · Cloudinary · Ably · Vercel.

## 1. Instalación

```bash
npm install
cp .env.example .env     # completa los valores (ver abajo)
npx prisma migrate dev --name init
npm run db:seed          # crea el evento y el administrador principal
npm run dev
```

Ably está fijado en `2.20.0`: se verificó que compila con Next.js 14.2.35.
La versión `2.29.0` produce `super keyword outside a method` al compilar el cliente.
Antes de actualizar Ably, comprobar la compilación de `/evento` y `/tv`.

## 2. Servicios externos

| Servicio | Qué crear | Variables |
|---|---|---|
| Neon | Proyecto PostgreSQL (cadena *pooled* y directa) | `DATABASE_URL`, `DIRECT_URL` |
| Google Cloud | OAuth Client (Web). Redirect: `https://TU-DOMINIO/api/auth/callback/google` (y `http://localhost:3000/api/auth/callback/google`) | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` |
| Auth.js | `npx auth secret` | `AUTH_SECRET` |
| Cloudinary | Cuenta; el cloud name va también como `NEXT_PUBLIC_…` | `CLOUDINARY_*` |
| Ably | App con API key (el servidor publica; el navegador usa tokens de solo suscripción) | `ABLY_API_KEY` |
| Admin | Cadena aleatoria ≥ 32 caracteres | `ADMIN_SESSION_SECRET` |

## 3. Qué incluye esta base

- **Esquema Prisma completo** (User, Admin, Event, Post, PostImage, Like con único, Comment, Report, InformationRequest, RemovalRequest, AuditLog).
- **Auth visitantes** con Google y **auth admin** con correo/contraseña (bcrypt + JWT en cookie httpOnly), roles `OWNER` / `COLLABORATOR` verificados en el servidor.
- **Muro** `/evento` con tiempo real, Me gusta, comentarios, reportes, descarga de originales y tarjeta promocional.
- **Publicar** `/evento/publicar`: cámara/galería, hasta 5 fotos, subida directa firmada a Cloudinary, borrador en IndexedDB que sobrevive al login con Google y se recupera para revisar antes de publicar.
- **TV** `/tv`: cola FIFO, 8 s por publicación, collage 2–5 fotos, ediciones sin reencolar, QR permanente, banner de la carrera, comentarios flotantes, caché local y re-sincronización tras desconexión.
- **Admin** `/admin`: control manual del evento (iniciar/finalizar/reabrir), estadísticas, moderación, interesados, exportación a Excel (solo con consentimiento, solo OWNER), generador de **QR real** con afiche vertical A4 y horizontal 16:9 en PNG.
- Páginas `/perfil`, `/ingenieria-software-ia`, `/privacidad`.

## 4. Pendientes antes de producción

1. **Contenido oficial**: duración, malla, certificaciones y requisitos de la carrera; logotipo autorizado de SENATI (hoy es texto «SENATI»; colores aproximados en `tailwind.config.ts`).
2. **Política de privacidad**: `app/privacidad/page.tsx` es un borrador; debe revisarla legal (Ley 29733).
3. **Edición de publicaciones en el perfil**: la API `PATCH /api/posts/[id]` está lista; falta la pantalla (marcada con `TODO` en `app/perfil/page.tsx`).
4. **Moderación**: pantallas de reportes, solicitudes de retirada, comentarios y alta de colaboradores (las APIs existen: `/api/admin/reports/[id]`, `/api/admin/comments/[id]`, `/api/admin/collaborators`).
5. **Rate limiting**: el actual es en memoria; usar Upstash Redis en Vercel.
6. **Pruebas** (Fase 7): responsive, concurrencia, QR escaneable, TV de 77", etc.

## 5. Despliegue en Vercel

Importa el repo, copia las variables de `.env.example`, y ejecuta `npx prisma migrate deploy` contra Neon.
Define `NEXT_PUBLIC_APP_URL` con el dominio final **antes** de generar los afiches.

## 6. Uso en el evento

- Admin → `/admin` → **Iniciar evento**.
- Computadora conectada a la TV: abre `https://TU-DOMINIO/tv` (o `/tv?key=TV_ACCESS_KEY`) en Chrome y pulsa **F11**.
- Admin → **QR y afiches** → descarga los PNG.
