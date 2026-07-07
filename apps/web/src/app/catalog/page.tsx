'use client';

import {
  Bath,
  Bed,
  Building2,
  Filter,
  MapPin,
  Maximize,
  MessageCircle,
  Search,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import type { Operation, Property } from '@/features/properties/types';
import { formatMoney } from '@/lib/format';

interface PublicResponse {
  data?: {
    items: Property[];
    meta: { total: number; page: number; pageSize: number; totalPages: number };
  };
}

function operationLabel(operation: Operation): string {
  return operation === 'SALE' ? 'Venta' : 'Alquiler';
}

function whatsappCatalogUrl(): string {
  const text = [
    'Hola Faviola, estoy viendo tu catálogo de propiedades.',
    '',
    'Me gustaría recibir asesoría para encontrar una propiedad.',
  ].join('\n');
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export default function PublicCatalogPage(): ReactNode {
  const [q, setQ] = useState('');
  const [operation, setOperation] = useState('');
  const [district, setDistrict] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [properties, setProperties] = useState<Property[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const qs = useMemo(() => {
    const params = new URLSearchParams({ pageSize: '60' });
    if (q.trim()) params.set('q', q.trim());
    if (operation) params.set('operation', operation);
    if (district.trim()) params.set('district', district.trim());
    if (priceMax.trim()) params.set('priceMax', priceMax.trim());
    return params.toString();
  }, [q, operation, district, priceMax]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setError(null);
    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          const response = await fetch(`/api/v1/properties/public?${qs}`, {
            headers: { Accept: 'application/json' },
          });
          if (!response.ok) throw new Error('No se pudo cargar el catálogo.');
          const body = (await response.json()) as PublicResponse;
          if (!mounted) return;
          setProperties(body.data?.items ?? []);
          setTotal(body.data?.meta.total ?? 0);
        } catch (err) {
          if (mounted) setError(err instanceof Error ? err.message : 'Catálogo no disponible.');
        } finally {
          if (mounted) setLoading(false);
        }
      })();
    }, 250);
    return () => {
      mounted = false;
      window.clearTimeout(timeout);
    };
  }, [qs]);

  return (
    <main className="min-h-screen bg-[#f8f3eb] text-[#241f1a]">
      <section className="mx-auto max-w-6xl px-5 py-8">
        <header className="rounded-[2rem] border border-[#eadfce] bg-white/75 p-7 shadow-[0_24px_80px_rgba(36,31,26,0.08)] backdrop-blur">
          <p className="font-script text-4xl text-[#a9884e]">Faviola Velarde</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl leading-tight md:text-5xl">
                Catálogo inmobiliario
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#6d6256]">
                Propiedades seleccionadas para compra y alquiler. Filtra por zona, operación o
                presupuesto y comparte la ficha ideal.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="secondary">
                <Link href="/lead">Dejar mis datos</Link>
              </Button>
              <Button asChild variant="brand">
                <a href={whatsappCatalogUrl()} target="_blank" rel="noreferrer">
                  <MessageCircle className="h-4 w-4" />
                  Pedir asesoría
                </a>
              </Button>
            </div>
          </div>
        </header>

        <section className="mt-6 rounded-2xl border border-[#eadfce] bg-white/70 p-4 shadow-[0_12px_40px_rgba(36,31,26,0.06)]">
          <div className="grid gap-3 md:grid-cols-[1fr_0.6fr_0.7fr_0.6fr]">
            <label className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8a7863]" />
              <input
                value={q}
                onChange={(event) => setQ(event.target.value)}
                placeholder="Buscar por distrito, código o tipo"
                className="h-11 w-full rounded-xl border border-[#eadfce] bg-white pl-10 pr-3 text-sm outline-none focus:border-[#a9884e] focus:ring-2 focus:ring-[#a9884e]/20"
              />
            </label>
            <select
              value={operation}
              onChange={(event) => setOperation(event.target.value)}
              className="h-11 rounded-xl border border-[#eadfce] bg-white px-3 text-sm outline-none focus:border-[#a9884e] focus:ring-2 focus:ring-[#a9884e]/20"
            >
              <option value="">Venta y alquiler</option>
              <option value="SALE">Venta</option>
              <option value="RENT">Alquiler</option>
            </select>
            <input
              value={district}
              onChange={(event) => setDistrict(event.target.value)}
              placeholder="Distrito"
              className="h-11 rounded-xl border border-[#eadfce] bg-white px-3 text-sm outline-none focus:border-[#a9884e] focus:ring-2 focus:ring-[#a9884e]/20"
            />
            <input
              value={priceMax}
              onChange={(event) => setPriceMax(event.target.value.replace(/\D/g, ''))}
              placeholder="Precio máx."
              className="h-11 rounded-xl border border-[#eadfce] bg-white px-3 text-sm outline-none focus:border-[#a9884e] focus:ring-2 focus:ring-[#a9884e]/20"
            />
          </div>
          <p className="mt-3 inline-flex items-center gap-2 text-xs text-[#7d6c56]">
            <Filter className="h-3.5 w-3.5" />
            {loading ? 'Buscando propiedades…' : `${total} propiedad${total === 1 ? '' : 'es'}`}
          </p>
        </section>

        {error && (
          <p className="mt-8 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </p>
        )}

        {!loading && !error && properties.length === 0 && (
          <div className="mt-8 rounded-2xl border border-dashed border-[#d8c9b2] bg-white/65 p-12 text-center">
            <Building2 className="mx-auto h-10 w-10 text-[#a9884e]" />
            <p className="mt-3 font-medium">No encontramos propiedades con esos filtros.</p>
            <p className="mt-1 text-sm text-[#6d6256]">
              Prueba quitando filtros o contáctanos por WhatsApp.
            </p>
          </div>
        )}

        <section className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </section>
      </section>
    </main>
  );
}

function PropertyCard({ property }: { property: Property }): ReactNode {
  const cover = property.media.find((media) => media.isCover) ?? property.media[0];

  return (
    <Link
      href={`/p/${property.code}`}
      className="group overflow-hidden rounded-[1.5rem] border border-[#eadfce] bg-white shadow-[0_16px_50px_rgba(36,31,26,0.08)] transition-transform hover:-translate-y-1"
    >
      <div className="relative aspect-[4/3] bg-[#efe5d6]">
        {cover ? (
          <Image
            src={cover.url}
            alt={property.title}
            fill
            unoptimized
            className="object-cover"
            sizes="420px"
          />
        ) : (
          <div className="grid h-full place-items-center">
            <Building2 className="h-10 w-10 text-[#a9884e]" />
          </div>
        )}
        <span className="absolute left-4 top-4 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-[#8a6125] backdrop-blur">
          {operationLabel(property.operation)}
        </span>
      </div>
      <div className="p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#a9884e]">
          {property.code}
        </p>
        <h2 className="mt-2 line-clamp-2 font-display text-2xl leading-tight">{property.title}</h2>
        <p className="mt-2 font-display text-2xl text-[#a77934]">
          {formatMoney(property.price, property.currency)}
        </p>
        <p className="mt-3 flex items-center gap-1.5 text-sm text-[#6d6256]">
          <MapPin className="h-4 w-4" />
          {[property.district, property.city].filter(Boolean).join(', ') || 'Consultar ubicación'}
        </p>
        <div className="mt-4 flex gap-4 text-xs text-[#6d6256]">
          <span className="inline-flex items-center gap-1">
            <Bed className="h-3.5 w-3.5" />
            {property.bedrooms ?? '—'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Bath className="h-3.5 w-3.5" />
            {property.bathrooms ?? '—'}
          </span>
          <span className="inline-flex items-center gap-1">
            <Maximize className="h-3.5 w-3.5" />
            {property.area ? `${property.area} m²` : '—'}
          </span>
        </div>
      </div>
    </Link>
  );
}
