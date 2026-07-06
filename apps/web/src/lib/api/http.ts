import { getAccessToken } from '@/lib/auth/token-store';

import { ApiError } from './errors';

// Vacío = mismo origen (usa el proxy `/api` de next.config → API_PROXY_URL).
// En local (Docker) se define NEXT_PUBLIC_API_URL=http://localhost:4000.
const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';
const API_PREFIX = '/api/v1';

interface ErrorPayload {
  message?: string;
  details?: unknown;
}

interface Envelope<T> {
  data?: T;
}

/**
 * Cliente HTTP tipado sobre `fetch`.
 * - Adjunta el access token (Authorization: Bearer).
 * - Envía cookies (refresh token httpOnly) con `credentials: include`.
 * - Normaliza errores a `ApiError` y desenvuelve el sobre `{ data }`.
 */
export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers = new Headers(options.headers);
  headers.set('Accept', 'application/json');
  if (!(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${BASE_URL}${API_PREFIX}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const isJson = response.headers.get('content-type')?.includes('application/json') ?? false;
  const body: unknown = isJson ? await response.json() : null;

  if (!response.ok) {
    const payload = (body ?? {}) as ErrorPayload;
    throw new ApiError(response.status, payload.message ?? 'Error de red', payload.details);
  }

  const envelope = (body ?? {}) as Envelope<T>;
  return (envelope.data ?? body) as T;
}

export const httpClient = {
  get: <T>(path: string) => apiFetch<T>(path, { method: 'GET' }),
  post: <T>(path: string, data?: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  patch: <T>(path: string, data?: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(path: string) => apiFetch<T>(path, { method: 'DELETE' }),
};
