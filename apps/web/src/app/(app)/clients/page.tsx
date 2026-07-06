'use client';

import { ChevronRight, Plus, Search, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useClients } from '@/features/clients/api';
import { formatMoney, temperatureClass, temperatureLabel } from '@/features/clients/labels';
import type { Client } from '@/features/clients/types';

const tabs = [
  { key: 'BUYER', label: 'Compradores' },
  { key: 'SELLER', label: 'Vendedores' },
] as const;

export default function ClientsPage(): ReactNode {
  const [tab, setTab] = useState<'BUYER' | 'SELLER'>('BUYER');
  const [q, setQ] = useState('');
  const { data, isLoading, isError } = useClients({ type: tab, q: q || undefined });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-content">Clientes</h1>
          <p className="mt-1 text-sm text-content-muted">Compradores y vendedores de tu cartera.</p>
        </div>
        <Button asChild variant="brand">
          <Link href="/clients/new">
            <Plus className="h-4 w-4" />
            Nuevo cliente
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-border bg-surface-sunken p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={
                tab === t.key
                  ? 'rounded-md bg-surface-raised px-4 py-1.5 text-sm font-medium text-content shadow-elevation-1'
                  : 'rounded-md px-4 py-1.5 text-sm text-content-secondary hover:text-content'
              }
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
          <input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar por nombre, correo o teléfono"
            className="h-10 w-full rounded-md border border-border bg-surface-raised pl-9 pr-3 text-sm text-content placeholder:text-content-muted focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-surface-raised shadow-elevation-1">
        {isLoading ? (
          <div className="p-10 text-center text-sm text-content-muted">Cargando clientes…</div>
        ) : isError ? (
          <div className="p-10 text-center text-sm text-danger">
            No se pudieron cargar los clientes.
          </div>
        ) : !data || data.items.length === 0 ? (
          <EmptyState />
        ) : (
          <ul className="divide-y divide-border">
            {data.items.map((client) => (
              <ClientRow key={client.id} client={client} />
            ))}
          </ul>
        )}
      </div>

      {data && data.items.length > 0 && (
        <p className="text-xs text-content-muted">
          {data.meta.total} {data.meta.total === 1 ? 'cliente' : 'clientes'}
        </p>
      )}
    </div>
  );
}

function ClientRow({ client }: { client: Client }): ReactNode {
  const initials = `${client.firstName[0] ?? ''}${client.lastName[0] ?? ''}`;
  const req = client.requirement;
  const reqSummary = req
    ? [formatMoney(req.budgetMax ?? req.budgetMin, req.currency), req.zones.slice(0, 2).join(', ')]
        .filter(Boolean)
        .join(' · ')
    : null;

  return (
    <li>
      <Link
        href={`/clients/${client.id}`}
        className="flex items-center gap-4 px-4 py-3 transition-colors hover:bg-surface-sunken"
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand text-sm font-medium uppercase text-brand-foreground">
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-content">
            {client.firstName} {client.lastName}
          </p>
          <p className="truncate text-xs text-content-muted">
            {client.phone ?? client.email ?? 'Sin contacto'}
          </p>
        </div>
        {reqSummary && (
          <span className="hidden max-w-[200px] truncate text-xs text-content-secondary md:block">
            {reqSummary}
          </span>
        )}
        <Badge className={temperatureClass[client.temperature]}>
          {temperatureLabel[client.temperature]}
        </Badge>
        <ChevronRight className="h-4 w-4 shrink-0 text-content-muted" />
      </Link>
    </li>
  );
}

function EmptyState(): ReactNode {
  return (
    <div className="flex flex-col items-center gap-3 p-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-tint text-brand-deep">
        <UserPlus className="h-6 w-6" />
      </span>
      <div>
        <p className="font-medium text-content">Aún no hay clientes aquí</p>
        <p className="mt-1 text-sm text-content-muted">Registra tu primer cliente para empezar.</p>
      </div>
      <Button asChild variant="brand" size="sm">
        <Link href="/clients/new">
          <Plus className="h-4 w-4" />
          Nuevo cliente
        </Link>
      </Button>
    </div>
  );
}
