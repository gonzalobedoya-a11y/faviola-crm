/**
 * Almacén del access token en memoria (nunca en localStorage por seguridad).
 * El refresh token vive en una cookie httpOnly gestionada por el backend
 * (Sprint 1). El cliente HTTP lee el token desde aquí.
 */
let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
}
