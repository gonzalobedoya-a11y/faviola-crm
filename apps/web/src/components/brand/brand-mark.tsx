import Image from 'next/image';
import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

/** Monograma FV (el "logo solo") sobre una placa clara, coherente en ambos temas. */
export function BrandMark({
  size = 40,
  className,
}: {
  size?: number;
  className?: string;
}): ReactNode {
  return (
    <span
      className={cn(
        'inline-flex shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1 ring-border',
        className,
      )}
      style={{ width: size, height: size, backgroundColor: '#faf8f3' }}
    >
      <Image
        src="/brand/logo-monogram.png"
        alt="Faviola Velarde"
        width={size}
        height={size}
        className="h-full w-full object-contain"
        priority
      />
    </span>
  );
}

/** Bloque monograma + nombre, para cabeceras de navegación. */
export function BrandLockup({ className }: { className?: string }): ReactNode {
  return (
    <span className={cn('flex items-center gap-3', className)}>
      <BrandMark size={40} />
      <span className="leading-tight">
        <span className="block font-display text-base text-content">Faviola Velarde</span>
        <span className="block text-[10px] uppercase tracking-[0.18em] text-brand-deep">
          Agente inmobiliaria
        </span>
      </span>
    </span>
  );
}
