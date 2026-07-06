# ──────────────────────────────────────────────────────────────
#  Imagen de DESARROLLO para @faviola/web (Next.js 15) — hot reload.
#  El Dockerfile de producción (standalone output) se añade más adelante.
# ──────────────────────────────────────────────────────────────
FROM node:22-alpine

RUN corepack enable
WORKDIR /app

# Contexto completo (node_modules/.next/dist excluidos por .dockerignore).
COPY . .

RUN pnpm install --frozen-lockfile

EXPOSE 3000
CMD ["pnpm", "--filter", "@faviola/web", "dev"]
