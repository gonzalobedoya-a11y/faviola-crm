# Despliegue — Vercel (frontend) + Railway (API + PostgreSQL)

> Objetivo: obtener un **link compartible**. El Next.js va a **Vercel**; la API
> NestJS + **PostgreSQL** van a **Railway**. Todo se despliega desde tu repositorio
> de GitHub. Los pasos de crear cuentas / conectar / poner variables los haces tú
> (yo no puedo iniciar sesión ni crear cuentas por ti).

---

## 0) Subir el código a GitHub (una vez)

```bash
cd faviola-crm
git add -A
git commit -m "CRM Faviola — listo para deploy"
# crea un repo vacío en github.com y luego:
git remote add origin https://github.com/TU_USUARIO/faviola-crm.git
git push -u origin main
```

---

## 1) Railway — API + Base de datos

1. Entra a **railway.app** → **New Project** → **Deploy from GitHub repo** → elige `faviola-crm`.
2. Railway detecta `railway.json` y construye con `infra/docker/api.prod.Dockerfile`.
3. En el proyecto: **+ New → Database → PostgreSQL** (crea la BD gratis).
4. Ve al **servicio de la API → Variables** y agrega:

   | Variable | Valor |
   | --- | --- |
   | `DATABASE_URL` | Referencia a la de Postgres: `${{Postgres.DATABASE_URL}}` |
   | `NODE_ENV` | `production` |
   | `JWT_ACCESS_SECRET` | (una cadena larga aleatoria) |
   | `JWT_REFRESH_SECRET` | (otra cadena larga aleatoria) |
   | `CORS_ORIGIN` | La URL de Vercel (paso 2), p. ej. `https://faviola-crm.vercel.app` |

   > `PORT` lo inyecta Railway solo. `MINIO_*` no hace falta (la subida de fotos a
   > MinIO queda deshabilitada en el demo; las fotos por URL sí funcionan).

5. En **Settings → Networking → Generate Domain** para obtener la URL pública de la API,
   p. ej. `https://faviola-api-production.up.railway.app`. **Cópiala.**
6. El primer arranque aplica **migraciones + seed** solo. Verifica:
   `https://<tu-api>.up.railway.app/api/v1/health` → debe responder `{"status":"ok"}`.

---

## 2) Vercel — Frontend (Next.js)

1. Entra a **vercel.com** → **Add New → Project** → importa `faviola-crm`.
2. **Root Directory:** selecciona **`apps/web`** (Vercel detecta el monorepo pnpm).
3. Framework: **Next.js** (automático). Build/Install por defecto.
4. **Environment Variables** (recomendado, cookies first-party vía proxy):

   | Variable | Valor |
   | --- | --- |
   | `API_PROXY_URL` | La URL de la API de Railway (paso 1.5), sin `/` final |

   > Con `API_PROXY_URL`, Next reenvía `/api/*` a Railway desde el **mismo dominio**,
   > así la sesión persiste al recargar (cookie first-party). No definas
   > `NEXT_PUBLIC_API_URL` en este modo.

5. **Deploy.** Al terminar te da la URL, p. ej. `https://faviola-crm.vercel.app`.
6. Vuelve a **Railway → Variables → `CORS_ORIGIN`** y pon esa URL de Vercel (redeploy la API).

---

## 3) Probar

- Abre `https://faviola-crm.vercel.app`
- Inicia sesión: **faviola@faviolavelarde.com** / **Faviola2026!**

Ese es el link que puedes compartir.

---

## Alternativa (sin proxy, directo)

Si prefieres no usar el proxy: en Vercel define `NEXT_PUBLIC_API_URL` = URL de Railway
(en vez de `API_PROXY_URL`). Funciona igual, pero como front y API están en dominios
distintos, algunos navegadores que **bloquean cookies de terceros** cerrarían la sesión
al recargar (el login por sesión sigue funcionando). Por eso se recomienda el proxy.

## Notas

- **Fotos:** en el demo hospedado, la carga a MinIO está deshabilitada; registra
  imágenes por **URL**. Para habilitar subida real en producción se cambia MinIO por
  un almacenamiento S3/Blob gestionado (siguiente iteración).
- **Seed:** el usuario admin se crea en el primer arranque. Cambia la contraseña con
  `SEED_ADMIN_PASSWORD` en Railway si quieres.
