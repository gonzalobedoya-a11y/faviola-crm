'use client';

import { useEffect, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';

export default function Error({ error, reset }: { error: Error; reset: () => void }): ReactNode {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <h2 className="font-display text-2xl text-content">Algo salió mal</h2>
      <p className="max-w-sm text-content-secondary">
        Ocurrió un error inesperado. Puedes intentar de nuevo.
      </p>
      <Button onClick={reset}>Reintentar</Button>
    </div>
  );
}
