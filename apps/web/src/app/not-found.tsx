import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';

export default function NotFound(): ReactNode {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-surface px-6 text-center">
      <p className="font-display text-6xl text-brand">404</p>
      <h1 className="font-display text-2xl text-content">Página no encontrada</h1>
      <p className="max-w-sm text-content-secondary">
        La página que buscas no existe o fue movida.
      </p>
      <Button asChild variant="brand">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
