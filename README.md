# Faviola Velarde — CRM Inmobiliario Inteligente

Monorepo del CRM. Construido siguiendo las fases aprobadas:
**Fase 0 (Discovery)** · **Fase 1 (Branding + Design System)** · **Fase 2 (Blueprint Técnico)**.

> Estado actual: **release funcional** desplegado en Railway + Vercel.

## Funcionalidades

- Autenticación segura, sesiones rotativas y cambio de contraseña.
- Clientes compradores/vendedores, requisitos de búsqueda y actividad.
- Inventario de propiedades, galería por URL y documentos asociados.
- Matching automático comprador ↔ propiedad.
- Pipeline comercial, agenda y seguimiento de visitas.
- Dashboard, notificaciones, búsqueda global, reportes y exportación CSV.
- Centro de contacto por WhatsApp/correo, perfil, temas claro/oscuro y navegación móvil.

---

## Stack

| Capa            | Tecnología                                                        |
| --------------- | ----------------------------------------------------------------- |
| Frontend        | Next.js 15 · React 19 · TypeScript                                 |
| Backend         | NestJS 11 · TypeScript · Prisma                                    |
| Base de datos   | PostgreSQL 16                                                      |
| Cache / colas   | Redis 7                                                            |
| Almacenamiento  | MinIO (S3-compatible)                                              |
| Correo (dev)    | MailHog                                                            |
| Monorepo        | pnpm workspaces · Turborepo                                        |
| Calidad         | ESLint 9 (flat) · Prettier · Husky · lint-staged · GitHub Actions |

## Estructura

```
faviola-crm/
├── apps/
│   ├── api/          # NestJS (backend)
│   └── web/          # Next.js 15 (frontend)
├── packages/
│   ├── config/       # ESLint + TSConfig base compartidos
│   └── shared/       # Contratos/utilidades compartidas (Sprint 1+)
├── infra/docker/     # Dockerfiles de desarrollo
├── docker-compose.yml
└── turbo.json
```

---

## Requisitos

- **Node.js** ≥ 20.11 (recomendado 22)
- **pnpm** ≥ 10
- **Docker Desktop** (para levantar la infraestructura de datos)

## Arranque rápido

```bash
# 1. Variables de entorno
cp .env.example .env

# 2. Dependencias
pnpm install

# 3a. Entorno COMPLETO en contenedores (un solo comando)
pnpm up            # = docker compose up --build

#     → web:      http://localhost:3000
#     → api:      http://localhost:4000/health
#     → MinIO UI: http://localhost:9001
#     → MailHog:  http://localhost:8025
```

### Alternativa: apps en el host, datos en Docker

```bash
pnpm env:up            # levanta postgres, redis, minio, mailhog
pnpm prisma:generate   # genera el Prisma Client (requerido tras clonar/instalar)
pnpm dev               # levanta web + api con hot reload (Turborepo)
```

> El flujo `pnpm up` (Docker) genera el Prisma Client dentro de la imagen; solo
> el flujo en el host requiere `pnpm prisma:generate` manualmente.

## Scripts principales

| Comando              | Descripción                                        |
| -------------------- | -------------------------------------------------- |
| `pnpm up`            | Entorno completo en Docker (un comando)            |
| `pnpm env:up`        | Solo infraestructura de datos                      |
| `pnpm env:down`      | Detiene la infraestructura                         |
| `pnpm env:reset`     | Detiene y **borra** los volúmenes de datos         |
| `pnpm dev`           | Ejecuta web + api en el host (hot reload)          |
| `pnpm build`         | Compila todos los paquetes                         |
| `pnpm lint`          | ESLint en todo el monorepo                         |
| `pnpm typecheck`     | Chequeo de tipos estricto                          |
| `pnpm format`        | Formatea con Prettier                              |

---

## Convenciones

- **Commits:** Conventional Commits.
- **Ramas:** trunk-based; PR con CI en verde antes de merge.
- **Arquitectura:** no se desvía del Blueprint (Fase 2) sin aprobación.
