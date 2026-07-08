'use client';

import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { BrandLockup } from '@/components/brand/brand-mark';
import { navItems } from '@/config/nav';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils';

export function Sidebar(): ReactNode {
  const pathname = usePathname();
  const { user } = useAuth();
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Faviola Velarde';
  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}` : 'FV';

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-surface-sunken md:flex print:!hidden">
      <div className="flex h-20 items-center border-b border-border px-5">
        <BrandLockup />
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          const highlighted = item.href === '/academy';
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-brand-tint font-medium text-brand-deep'
                  : highlighted
                    ? 'bg-brand-tint/70 font-medium text-brand-deep hover:bg-brand-tint'
                    : 'text-content-secondary hover:bg-surface hover:text-content',
              )}
            >
              {(active || highlighted) && (
                <span
                  className="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-brand"
                  aria-hidden="true"
                />
              )}
              <Icon className="h-[18px] w-[18px]" />
              <span className="flex-1">{item.label}</span>
              {item.badge ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-medium text-brand-foreground">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div className="flex items-center gap-3 border-t border-border px-4 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-medium uppercase text-brand-foreground">
          {initials}
        </span>
        <Link href="/settings" className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-content hover:text-brand-deep">
            {fullName}
          </span>
          <span className="block text-xs text-content-muted">Ver perfil</span>
        </Link>
        <LogoutButton />
      </div>
    </aside>
  );
}

function LogoutButton(): ReactNode {
  const { logout } = useAuth();
  return (
    <button
      type="button"
      aria-label="Cerrar sesion"
      onClick={() => void logout()}
      className="flex h-8 w-8 items-center justify-center rounded-md text-content-muted transition-colors hover:bg-surface hover:text-danger"
    >
      <LogOut className="h-4 w-4" />
    </button>
  );
}
