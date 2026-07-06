'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { httpClient } from '@/lib/api/http';

import { setAccessToken } from './token-store';

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenantId: string;
  permissions: string[];
}

interface LoginResponse {
  user: Omit<AuthUser, 'permissions'>;
  accessToken: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/**
 * Estado global de autenticación.
 * - Bootstrap silencioso: al montar intenta `refresh` (cookie httpOnly) y, si
 *   hay sesión, restaura el access token en memoria + el usuario.
 * - `login`/`logout` hablan con el backend y actualizan el estado.
 */
export function AuthProvider({ children }: { children: ReactNode }): ReactNode {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { accessToken } = await httpClient.post<{ accessToken: string }>('/auth/refresh');
        setAccessToken(accessToken);
        const me = await httpClient.get<AuthUser>('/auth/me');
        if (active) setUser(me);
      } catch {
        if (active) {
          setAccessToken(null);
          setUser(null);
        }
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await httpClient.post<LoginResponse>('/auth/login', { email, password });
    setAccessToken(res.accessToken);
    const me = await httpClient.get<AuthUser>('/auth/me');
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    try {
      await httpClient.post('/auth/logout');
    } finally {
      setAccessToken(null);
      setUser(null);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ user, isAuthenticated: user !== null, isLoading, login, logout }),
    [user, isLoading, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  }
  return context;
}
