# Registro de Sprints

Referencia oficial: **Blueprint Técnico (Fase 2)**. No se avanza de sprint sin aprobación.

| Sprint | Alcance                                   | Estado        |
| ------ | ----------------------------------------- | ------------- |
| 0A     | Infraestructura del monorepo              | Completado    |
| 0B     | Arquitectura base (front + back)          | Completado    |
| 1      | Auth · Tenancy · RBAC                     | Completado    |
| 2      | Clientes                                  | Completado    |
| 3      | Propiedades                               | Completado    |
| 4      | Matching                                  | Completado    |
| 5      | Pipeline · Visitas                        | Completado    |
| 6      | Dashboard · Notificaciones · IA (base)    | Dashboard ✔ · Notif/IA pendiente |
| 7      | Documentos · Reportes                     | Pendiente     |
| 8      | Settings · Marca · Hardening · Release    | Pendiente     |

## Sprint 0A — Infraestructura

**Objetivo:** dejar el proyecto listo para desarrollar; un comando levanta todo el entorno.

Incluye: monorepo (pnpm + Turborepo), Next.js 15, NestJS 11, TypeScript, Docker Compose
(PostgreSQL, Redis, MinIO, MailHog), Prisma (config), ESLint/Prettier/Husky/lint-staged,
variables de entorno, configuración compartida, CI básica y scripts dev/prod.

**Fuera de alcance (a propósito):** módulos del CRM, pantallas, componentes, Design System.
