import type { NextConfig } from 'next';

// Si se define API_PROXY_URL (p. ej. en Vercel → URL de Railway), Next hace de
// proxy: `/api/*` se reenvía a la API. Así el front y la API quedan en el mismo
// origen y la cookie de refresh es first-party (sin problemas de terceros).
const apiProxyUrl = process.env.API_PROXY_URL?.replace(/\/$/, '');

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Permite consumir el paquete `@faviola/shared` (TS) sin pre-compilarlo.
  transpilePackages: ['@faviola/shared'],
  async rewrites() {
    if (!apiProxyUrl) return [];
    return [{ source: '/api/:path*', destination: `${apiProxyUrl}/api/:path*` }];
  },
  // El lint se ejecuta de forma centralizada (Turborepo + CI) con la flat
  // config de `@faviola/config`. Se evita el doble pase de ESLint en el build.
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Los assets de marca son estáticos; no requieren optimización en runtime.
  images: {
    unoptimized: true,
  },
  // En Docker sobre Windows, los eventos inotify del bind-mount no siempre
  // propagan archivos NUEVOS. El polling en dev hace que Next los detecte.
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = { poll: 1000, aggregateTimeout: 300 };
    }
    return config;
  },
};

export default nextConfig;
