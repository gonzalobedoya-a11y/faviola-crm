/**
 * @faviola/shared
 * ---------------------------------------------------------------------------
 * Punto único de contratos y utilidades compartidas entre `@faviola/web`
 * (Next.js) y `@faviola/api` (NestJS).
 *
 * Sprint 0A: solo se establece el paquete y su cableado en el monorepo.
 * Los esquemas Zod, tipos de dominio, constantes (roles/permisos/estados)
 * y DTOs de contrato se incorporan a partir del Sprint 1 (Blueprint §2.4).
 */

export const APP_NAME = 'Faviola Velarde CRM' as const;
export const API_VERSION = 'v1' as const;
