import { QueryClient } from '@tanstack/react-query';

/** Configuración por defecto de TanStack Query para toda la app. */
export function makeQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  });
}
