import type { ReactNode } from 'react';

export default function Loading(): ReactNode {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-border border-t-brand"
        role="status"
        aria-label="Cargando"
      />
    </div>
  );
}
