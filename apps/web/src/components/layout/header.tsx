'use client';

import { Bell, Calendar, Command, Menu, Search, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';

import { BrandMark } from '@/components/brand/brand-mark';
import { navItems } from '@/config/nav';
import { useClients } from '@/features/clients/api';
import { useDashboard } from '@/features/dashboard/api';
import { useProperties } from '@/features/properties/api';
import { cn } from '@/lib/utils';

import { ThemeToggle } from './theme-toggle';

export function Header(): ReactNode {
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const normalizedQuery = query.trim();
  const canSearch = normalizedQuery.length >= 2;
  const { data: clients, isFetching: searchingClients } = useClients({ q: normalizedQuery });
  const { data: properties, isFetching: searchingProperties } = useProperties({
    q: normalizedQuery,
  });
  const { data: dashboard } = useDashboard();

  const notifications = useMemo(() => {
    if (!dashboard) return [];
    const items: { label: string; detail: string; href: string }[] = [];
    if (dashboard.quickStats.followUps > 0) {
      items.push({
        label: `${dashboard.quickStats.followUps} seguimientos pendientes`,
        detail: 'Revisa tus clientes que necesitan contacto.',
        href: '/clients',
      });
    }
    if (dashboard.quickStats.newMatches > 0) {
      items.push({
        label: `${dashboard.quickStats.newMatches} coincidencias nuevas`,
        detail: 'Hay propiedades que encajan con compradores.',
        href: '/matching',
      });
    }
    if (dashboard.quickStats.visitsToday > 0) {
      items.push({
        label: `${dashboard.quickStats.visitsToday} visitas para hoy`,
        detail: 'Consulta horarios y datos de contacto.',
        href: '/agenda',
      });
    }
    if (dashboard.quickStats.dealsClosing > 0) {
      items.push({
        label: `${dashboard.quickStats.dealsClosing} cierres en curso`,
        detail: 'Negociaciones que requieren tu atención.',
        href: '/pipeline',
      });
    }
    return items;
  }, [dashboard]);

  const closePanels = (): void => {
    setShowNotifications(false);
    setShowMobileMenu(false);
  };

  return (
    <header className="relative z-30 flex h-16 items-center gap-3 border-b border-border bg-surface px-4 md:px-6 print:hidden">
      <button
        type="button"
        aria-label={showMobileMenu ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={showMobileMenu}
        onClick={() => setShowMobileMenu((value) => !value)}
        className="flex h-10 w-10 items-center justify-center rounded-md text-content-secondary hover:bg-surface-sunken md:hidden"
      >
        {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
      </button>
      <span className="flex items-center gap-2 md:hidden">
        <BrandMark size={32} />
      </span>

      <div className="relative hidden max-w-md flex-1 sm:block">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar clientes o propiedades..."
          aria-label="Buscar en el sistema"
          autoComplete="off"
          className="h-10 w-full rounded-lg border border-border bg-surface-sunken pl-9 pr-9 text-sm text-content placeholder:text-content-muted focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <Command className="absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-content-muted" />
        {canSearch && (
          <div className="absolute left-0 right-0 top-12 max-h-96 overflow-y-auto rounded-xl border border-border bg-surface-raised p-2 shadow-elevation-2">
            {searchingClients || searchingProperties ? (
              <p className="px-3 py-4 text-sm text-content-muted">Buscando…</p>
            ) : (
              <>
                <SearchSection title="Clientes">
                  {clients?.items.slice(0, 4).map((client) => (
                    <Link
                      key={client.id}
                      href={`/clients/${client.id}`}
                      onClick={() => setQuery('')}
                      className="block rounded-md px-3 py-2 text-sm hover:bg-surface-sunken"
                    >
                      <span className="font-medium text-content">
                        {client.firstName} {client.lastName}
                      </span>
                      <span className="ml-2 text-xs text-content-muted">
                        {client.phone ?? client.email ?? 'Sin contacto'}
                      </span>
                    </Link>
                  ))}
                </SearchSection>
                <SearchSection title="Propiedades">
                  {properties?.items.slice(0, 4).map((property) => (
                    <Link
                      key={property.id}
                      href={`/properties/${property.id}`}
                      onClick={() => setQuery('')}
                      className="block rounded-md px-3 py-2 text-sm hover:bg-surface-sunken"
                    >
                      <span className="font-medium text-content">{property.title}</span>
                      <span className="ml-2 text-xs text-content-muted">{property.code}</span>
                    </Link>
                  ))}
                </SearchSection>
                {!clients?.items.length && !properties?.items.length && (
                  <p className="px-3 py-4 text-sm text-content-muted">No encontramos resultados.</p>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <div className="ml-auto flex items-center gap-1">
        <div className="relative">
          <button
            type="button"
            aria-label="Notificaciones"
            aria-expanded={showNotifications}
            onClick={() => setShowNotifications((value) => !value)}
            className="relative flex h-10 w-10 items-center justify-center rounded-md text-content-secondary transition-colors hover:bg-surface-sunken hover:text-content"
          >
            <Bell className="h-[18px] w-[18px]" />
            {notifications.length > 0 && (
              <span className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-medium text-brand-foreground">
                {notifications.length}
              </span>
            )}
          </button>
          {showNotifications && (
            <div className="absolute right-0 top-12 w-80 rounded-xl border border-border bg-surface-raised p-2 shadow-elevation-2">
              <p className="px-3 py-2 text-sm font-semibold text-content">Notificaciones</p>
              {notifications.length === 0 ? (
                <p className="px-3 py-5 text-sm text-content-muted">Todo al día. No hay alertas.</p>
              ) : (
                notifications.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={() => setShowNotifications(false)}
                    className="block rounded-lg px-3 py-2.5 hover:bg-surface-sunken"
                  >
                    <span className="block text-sm font-medium text-content">{item.label}</span>
                    <span className="mt-0.5 block text-xs text-content-muted">{item.detail}</span>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
        <Link
          href="/agenda"
          aria-label="Calendario"
          className="flex h-10 w-10 items-center justify-center rounded-md text-content-secondary transition-colors hover:bg-surface-sunken hover:text-content"
        >
          <Calendar className="h-[18px] w-[18px]" />
        </Link>
        <ThemeToggle />
      </div>

      {showMobileMenu && (
        <nav className="fixed inset-x-0 bottom-0 top-16 overflow-y-auto border-t border-border bg-surface-raised p-4 md:hidden">
          <div className="grid gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={closePanels}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm',
                    pathname === item.href
                      ? 'bg-brand-tint font-medium text-brand-deep'
                      : 'text-content-secondary hover:bg-surface-sunken',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}

function SearchSection({ title, children }: { title: string; children: ReactNode }): ReactNode {
  return (
    <div className="py-1">
      <p className="px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-content-muted">
        {title}
      </p>
      {children}
    </div>
  );
}
