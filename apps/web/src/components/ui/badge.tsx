import type { ReactNode } from 'react';

import { cn } from '@/lib/utils';

export function Badge({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): ReactNode {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium',
        className,
      )}
    >
      {children}
    </span>
  );
}
