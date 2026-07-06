'use client';

import { useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';

import { useAuth } from '@/lib/auth/auth-context';

/** Protege el shell autenticado: redirige a /login si no hay sesión. */
export function AuthGuard({ children }: { children: ReactNode }): ReactNode {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-brand"
          role="status"
          aria-label="Cargando"
        />
      </div>
    );
  }

  return <>{children}</>;
}
