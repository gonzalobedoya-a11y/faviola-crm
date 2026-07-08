'use client';

import { Building2, MessageCircle, Plus, Search, UserRoundCheck } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useClients } from '@/features/clients/api';
import { temperatureClass, temperatureLabel } from '@/features/clients/labels';
import type { Client } from '@/features/clients/types';
import { useProperties } from '@/features/properties/api';
import type { Property } from '@/features/properties/types';
import { formatMoney } from '@/lib/format';

function cleanPhone(phone?: string | null): string {
  const digits = phone?.replace(/\D/g, '') ?? '';
  if (!digits) return '';
  return digits.startsWith('51') ? digits : `51${digits}`;
}

function ownerWhatsapp(owner: Client): string {
  const text = [
    `Hola ${owner.firstName}, soy Faviola.`,
    '',
    'Te escribo para actualizar el estado de tu propiedad y coordinar próximos pasos.',
  ].join('\n');
  return `https://wa.me/${cleanPhone(owner.phone)}?text=${encodeURIComponent(text)}`;
}

export default function OwnersPage(): ReactNode {
  const [q, setQ] = useState('');
  const { data: owners, isLoading } = useClients({ type: 'SELLER', q: q || undefined });
  const { data: properties } = useProperties({});

  const propertiesByOwner = useMemo(() => {
    const map = new Map<string, Property[]>();
    for (const property of properties?.items ?? []) {
      if (!property.owner?.id) continue;
      map.set(property.owner.id, [...(map.get(property.owner.id) ?? []), property]);
    }
    return map;
  }, [properties]);

  const totalOwners = owners?.meta.total ?? 0;
  const withInventory = (owners?.items ?? []).filter((owner) =>
    propertiesByOwner.has(owner.id),
  ).length;
  const activeProperties = (properties?.items ?? []).filter(
    (property) => property.owner?.id,
  ).length;

  return (
    <div className="w-full max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-content">Propietarios</h1>
          <p className="mt-1 text-sm text-content-muted">
            Captación, propietarios vendedores y sus inmuebles asociados.
          </p>
        </div>
        <Button asChild variant="brand">
          <Link href="/clients/new">
            <Plus className="h-4 w-4" />
            Nuevo propietario
          </Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Propietarios" value={totalOwners} />
        <Metric label="Con inventario" value={withInventory} />
        <Metric label="Propiedades captadas" value={activeProperties} />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
        <input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder="Buscar propietario por nombre, teléfono o correo"
          className="h-11 w-full rounded-xl border border-border bg-surface-raised pl-10 pr-3 text-sm text-content placeholder:text-content-muted focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-content-muted">Cargando propietarios…</p>
      ) : !owners || owners.items.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-raised p-12 text-center">
          <UserRoundCheck className="mx-auto h-8 w-8 text-content-muted" />
          <p className="mt-3 font-medium text-content">Aún no hay propietarios</p>
          <p className="mt-1 text-sm text-content-muted">
            Crea un cliente tipo vendedor para empezar a gestionar captaciones.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {owners.items.map((owner) => (
            <OwnerCard
              key={owner.id}
              owner={owner}
              properties={propertiesByOwner.get(owner.id) ?? []}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }): ReactNode {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4 shadow-elevation-1">
      <p className="font-display text-3xl text-content">{value}</p>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-content-muted">{label}</p>
    </div>
  );
}

function OwnerCard({ owner, properties }: { owner: Client; properties: Property[] }): ReactNode {
  const phone = cleanPhone(owner.phone);
  const portfolioValue = properties.reduce((sum, property) => sum + property.price, 0);

  return (
    <article className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Link
            href={`/clients/${owner.id}`}
            className="font-semibold text-content hover:text-brand-deep"
          >
            {owner.firstName} {owner.lastName}
          </Link>
          <p className="mt-1 text-sm text-content-muted">
            {owner.phone ?? owner.email ?? 'Sin contacto'}
          </p>
        </div>
        <Badge className={temperatureClass[owner.temperature]}>
          {temperatureLabel[owner.temperature]}
        </Badge>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-surface-sunken p-3">
          <p className="text-lg font-semibold text-content">{properties.length}</p>
          <p className="text-xs text-content-muted">Propiedades</p>
        </div>
        <div className="rounded-lg bg-surface-sunken p-3">
          <p className="truncate text-lg font-semibold text-content">
            {formatMoney(portfolioValue, 'USD')}
          </p>
          <p className="text-xs text-content-muted">Valor referencial</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {properties.slice(0, 3).map((property) => (
          <Link
            key={property.id}
            href={`/properties/${property.id}`}
            className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:bg-surface-sunken"
          >
            <Building2 className="h-4 w-4 text-brand-deep" />
            <span className="min-w-0 flex-1 truncate">{property.title}</span>
            <span className="text-xs text-content-muted">{property.status}</span>
          </Link>
        ))}
        {properties.length === 0 && (
          <p className="rounded-lg border border-dashed border-border p-3 text-sm text-content-muted">
            Sin propiedades asociadas todavía.
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2 border-t border-border pt-4">
        {phone && (
          <Button asChild size="sm" variant="secondary">
            <a href={ownerWhatsapp(owner)} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </Button>
        )}
        <Button asChild size="sm" variant="secondary">
          <Link href={`/clients/${owner.id}`}>Ver expediente</Link>
        </Button>
        <Button asChild size="sm" variant="secondary">
          <Link href="/properties/new">Nueva propiedad</Link>
        </Button>
      </div>
    </article>
  );
}
