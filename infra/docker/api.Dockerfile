# ──────────────────────────────────────────────────────────────
#  Imagen de DESARROLLO para @faviola/api (NestJS) — con hot reload.
#  Para producción se creará un Dockerfile multi-stage en un sprint
#  posterior (build → runtime distroless).
# ──────────────────────────────────────────────────────────────
FROM node:22-alpine

RUN corepack enable
WORKDIR /app

# Contexto completo (node_modules/.next/dist excluidos por .dockerignore).
# En un monorepo pnpm, instalar con el workspace completo evita fallos de
# --frozen-lockfile por manifiestos parciales.
COPY . .

RUN pnpm install --frozen-lockfile

# Genera el Prisma Client dentro de la imagen. La URL es un placeholder de
# build (generate no conecta a la BD); en runtime la sobrescribe docker-compose.
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
RUN pnpm --filter @faviola/api exec prisma generate

EXPOSE 4000
# En dev: aplica migraciones y siembra (idempotente) antes de arrancar, para que
# `pnpm up` sobre un volumen limpio quede con login funcionando.
CMD ["sh", "-c", "pnpm --filter @faviola/api exec prisma migrate deploy && (pnpm --filter @faviola/api exec prisma db seed || true) && pnpm --filter @faviola/api dev"]
