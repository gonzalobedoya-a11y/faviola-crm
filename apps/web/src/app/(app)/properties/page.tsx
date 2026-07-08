'use client';

import { Bath, Bed, Building2, Maximize, Plus, Search } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useProperties } from '@/features/properties/api';
import { operationLabel, statusClass, statusLabel } from '@/features/properties/labels';
import type { Operation, Property } from '@/features/properties/types';
import { formatMoney } from '@/lib/format';

const tabs = [
  { key: undefined, label: 'Todas' },
  { key: 'SALE', label: 'Venta' },
  { key: 'RENT', label: 'Alquiler' },
] as const;

export default function PropertiesPage(): ReactNode {
  const [operation, setOperation] = useState<Operation | undefined>(undefined);
  const [q, setQ] = useState('');
  const { data, isLoading, isError } = useProperties({ operation, q: q || undefined });

  return (
    <div className="w-full max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-content">Propiedades</h1>
          <p className="mt-1 text-sm text-content-muted">Tu inventario de venta y alquiler.</p>
        </div>
        <Button asChild variant="brand">
          <Link href="/properties/new">
            <Plus className="h-4 w-4" />
            Nueva propiedad
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-lg border border-border bg-surface-sunken p-1">
          {tabs.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => setOperation(t.key)}
              className={
                operation === t.key
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
            placeholder="Buscar por título, código o distrito"
            className="h-10 w-full rounded-md border border-border bg-surface-raised pl-9 pr-3 text-sm text-content placeholder:text-content-muted focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-content-muted">Cargando propiedades…</p>
      ) : isError ? (
        <p className="py-16 text-center text-sm text-danger">
          No se pudieron cargar las propiedades.
        </p>
      ) : !data || data.items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      )}
    </div>
  );
}

function PropertyCard({ property }: { property: Property }): ReactNode {
  const cover = property.media.find((m) => m.isCover) ?? property.media[0];

  return (
    <Link
      href={`/properties/${property.id}`}
      className="group overflow-hidden rounded-xl border border-border bg-surface-raised shadow-elevation-1 transition-shadow hover:shadow-elevation-2"
    >
      <div className="relative aspect-[4/3] bg-surface-sunken">
        {cover ? (
          <Image
            src={cover.url}
            alt={property.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            sizes="(max-width: 1024px) 100vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-content-muted">
            <Building2 className="h-10 w-10" />
          </div>
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge className="border-transparent bg-black/55 text-white backdrop-blur-sm">
            {operationLabel[property.operation]}
          </Badge>
          <Badge className={`bg-surface/90 backdrop-blur-sm ${statusClass[property.status]}`}>
            {statusLabel[property.status]}
          </Badge>
        </div>
      </div>

      <div className="p-4">
        <p className="text-lg font-semibold tabular-nums text-content">
          {formatMoney(property.price, property.currency)}
        </p>
        <p className="mt-0.5 truncate text-sm font-medium text-content">{property.title}</p>
        <p className="truncate text-xs text-content-muted">
          {[property.district, property.city].filter(Boolean).join(', ') || 'Sin ubicación'}
        </p>
        <div className="mt-3 flex items-center gap-4 border-t border-border pt-3 text-xs text-content-secondary">
          <span className="inline-flex items-center gap-1">
            <Bed className="h-4 w-4 text-content-muted" />
            {property.bedrooms ?? '—'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath className="h-4 w-4 text-content-muted" />
            {property.bathrooms ?? '—'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Maximize className="h-4 w-4 text-content-muted" />
            {property.area ? `${property.area} m²` : '—'}
          </span>
        </div>
      </div>
    </Link>
  );
}

function EmptyState(): ReactNode {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface-raised p-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-tint text-brand-deep">
        <Building2 className="h-6 w-6" />
      </span>
      <div>
        <p className="font-medium text-content">Aún no hay propiedades</p>
        <p className="mt-1 text-sm text-content-muted">Registra tu primera propiedad.</p>
      </div>
      <Button asChild variant="brand" size="sm">
        <Link href="/properties/new">
          <Plus className="h-4 w-4" />
          Nueva propiedad
        </Link>
      </Button>
    </div>
  );
}
