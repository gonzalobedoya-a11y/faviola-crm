'use client';

import { LogOut, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import { BrandLockup, BrandMark } from '@/components/brand/brand-mark';
import { navItems } from '@/config/nav';
import { useAuth } from '@/lib/auth/auth-context';
import { cn } from '@/lib/utils';

export function Sidebar(): ReactNode {
  const pathname = usePathname();
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const fullName = user ? `${user.firstName} ${user.lastName}` : 'Faviola Velarde';
  const initials = user ? `${user.firstName[0] ?? ''}${user.lastName[0] ?? ''}` : 'FV';

  return (
    <aside
      className={cn(
        'hidden shrink-0 flex-col border-r border-border bg-surface-sunken transition-[width] duration-200 md:flex print:!hidden',
        collapsed ? 'w-20' : 'w-60',
      )}
    >
      <div
        className={cn(
          'flex h-20 items-center border-b border-border',
          collapsed ? 'justify-center px-3' : 'justify-between px-4',
        )}
      >
        {collapsed ? <BrandMark size={40} /> : <BrandLockup />}
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-label={collapsed ? 'Mostrar barra lateral' : 'Ocultar barra lateral'}
          className={cn(
            'flex h-8 w-8 items-center justify-center rounded-md text-content-muted transition-colors hover:bg-surface hover:text-brand-deep',
            collapsed &&
              'absolute left-[3.75rem] top-6 border border-border bg-surface-raised shadow-elevation-1',
          )}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>
      </div>

      <nav className={cn('flex-1 space-y-0.5 overflow-y-auto py-4', collapsed ? 'px-2' : 'px-3')}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          const highlighted = item.href === '/academy';
          return (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={cn(
                'relative flex items-center rounded-md py-2 text-sm transition-colors',
                collapsed ? 'justify-center px-2' : 'gap-3 px-3',
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
              {!collapsed && <span className="flex-1">{item.label}</span>}
              {item.badge ? (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-medium text-brand-foreground">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>

      <div
        className={cn(
          'flex items-center border-t border-border py-3',
          collapsed ? 'justify-center px-2' : 'gap-3 px-4',
        )}
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand text-sm font-medium uppercase text-brand-foreground">
          {initials}
        </span>
        {!collapsed && (
          <>
            <Link href="/settings" className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-content hover:text-brand-deep">
                {fullName}
              </span>
              <span className="block text-xs text-content-muted">Ver perfil</span>
            </Link>
            <LogoutButton />
          </>
        )}
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
