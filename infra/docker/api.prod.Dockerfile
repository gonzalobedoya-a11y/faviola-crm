# ──────────────────────────────────────────────────────────────
#  Imagen de PRODUCCIÓN para @faviola/api (NestJS) — Railway.
#  Instala el workspace, genera Prisma, compila y arranca aplicando
#  migraciones + seed (idempotente) para dejar el login funcionando.
# ──────────────────────────────────────────────────────────────
FROM node:22-alpine

RUN corepack enable
WORKDIR /app

# Contexto completo del monorepo (build desde la raíz del repo).
COPY . .

RUN pnpm install --frozen-lockfile

# El generate no conecta a la BD; la URL real se inyecta en runtime (Railway).
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN pnpm --filter @faviola/api exec prisma generate
RUN pnpm --filter @faviola/api build

ENV NODE_ENV=production

# Railway inyecta PORT. Al arrancar: migra, siembra (idempotente) y sirve.
CMD ["sh", "-c", "pnpm --filter @faviola/api exec prisma migrate deploy && (pnpm --filter @faviola/api exec prisma db seed || true) && node apps/api/dist/main.js"]
