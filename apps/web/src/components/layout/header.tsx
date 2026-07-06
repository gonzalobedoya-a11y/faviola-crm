'use client';

import { Bell, Calendar, Command, Search } from 'lucide-react';
import type { ReactNode } from 'react';

import { BrandMark } from '@/components/brand/brand-mark';

import { ThemeToggle } from './theme-toggle';

export function Header(): ReactNode {
  return (
    <header className="flex h-16 items-center gap-3 border-b border-border bg-surface px-4 md:px-6">
      <span className="flex items-center gap-2 md:hidden">
        <BrandMark size={32} />
      </span>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
        <input
          type="search"
          placeholder="Buscar en el sistema..."
          aria-label="Buscar en el sistema"
          className="h-10 w-full rounded-lg border border-border bg-surface-sunken pl-9 pr-9 text-sm text-content placeholder:text-content-muted focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Command className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-content-muted" />
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button
          type="button"
          aria-label="Notificaciones"
          className="relative flex h-10 w-10 items-center justify-center rounded-md text-content-secondary transition-colors hover:bg-surface-sunken hover:text-content"
        >
          <Bell className="h-[18px] w-[18px]" />
          <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-medium text-brand-foreground">
            3
          </span>
        </button>
        <button
          type="button"
          aria-label="Calendario"
          className="flex h-10 w-10 items-center justify-center rounded-md text-content-secondary transition-colors hover:bg-surface-sunken hover:text-content"
        >
          <Calendar className="h-[18px] w-[18px]" />
        </button>
        <ThemeToggle />
      </div>
    </header>
  );
}
