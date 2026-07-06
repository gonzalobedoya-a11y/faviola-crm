'use client';

import { ArrowLeft, Bath, Bed, Building2, ImagePlus, Maximize, MapPin, Ruler } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAddPropertyMedia, useProperty } from '@/features/properties/api';
import { operationLabel, statusClass, statusLabel } from '@/features/properties/labels';
import { formatMoney } from '@/lib/format';

export default function PropertyDetailPage(): ReactNode {
  const params = useParams<{ id: string }>();
  const { data: property, isLoading, isError } = useProperty(params.id);
  const [active, setActive] = useState(0);
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [photoUrl, setPhotoUrl] = useState('');
  const addPhoto = useAddPropertyMedia(params.id);

  if (isLoading) return <p className="p-8 text-sm text-content-muted">Cargando…</p>;
  if (isError || !property)
    return <p className="p-8 text-sm text-danger">No se encontró la propiedad.</p>;

  const images = property.media.filter((m) => m.type === 'IMAGE');
  const main = images[active] ?? images[0];
  const specs = [
    { icon: Bed, label: 'Dormitorios', value: property.bedrooms ?? '—' },
    { icon: Bath, label: 'Baños', value: property.bathrooms ?? '—' },
    { icon: Maximize, label: 'Área', value: property.area ? `${property.area} m²` : '—' },
    {
      icon: Ruler,
      label: 'Construido',
      value: property.builtArea ? `${property.builtArea} m²` : '—',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/properties"
          className="inline-flex items-center gap-1 text-sm text-content-secondary hover:text-content"
        >
          <ArrowLeft className="h-4 w-4" />
          Propiedades
        </Link>
        <Button variant="secondary" size="sm" onClick={() => setShowPhotoForm((value) => !value)}>
          <ImagePlus className="h-4 w-4" />
          Agregar foto
        </Button>
      </div>

      {showPhotoForm && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface-raised p-4 shadow-elevation-1 sm:flex-row">
          <input
            type="url"
            value={photoUrl}
            onChange={(event) => setPhotoUrl(event.target.value)}
            placeholder="https://.../imagen.jpg"
            aria-label="URL pública de la foto"
            className="h-10 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-content focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            variant="brand"
            disabled={!photoUrl.trim() || addPhoto.isPending}
            onClick={() => {
              void addPhoto
                .mutateAsync({ url: photoUrl.trim(), type: 'IMAGE', isCover: images.length === 0 })
                .then(() => {
                  setPhotoUrl('');
                  setShowPhotoForm(false);
                });
            }}
          >
            {addPhoto.isPending ? 'Guardando…' : 'Guardar foto'}
          </Button>
        </div>
      )}

      {/* Galería */}
      <div className="grid gap-3 lg:grid-cols-4">
        <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-border bg-surface-sunken lg:col-span-3">
          {main ? (
            <Image src={main.url} alt={property.title} fill className="object-cover" sizes="75vw" />
          ) : (
            <div className="flex h-full items-center justify-center text-content-muted">
              <Building2 className="h-12 w-12" />
            </div>
          )}
        </div>
        <div className="flex gap-3 overflow-x-auto lg:flex-col">
          {images.slice(0, 4).map((media, index) => (
            <button
              key={media.id}
              type="button"
              onClick={() => setActive(index)}
              className={`relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg border lg:w-full ${
                index === active ? 'border-brand' : 'border-border'
              }`}
            >
              <Image src={media.url} alt="" fill className="object-cover" sizes="120px" />
            </button>
          ))}
        </div>
      </div>

      {/* Cabecera */}
      <div className="flex flex-wrap items-start justify-between gap-4 rounded-xl border border-border bg-surface-raised p-6 shadow-elevation-1">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-border text-content-secondary">{property.code}</Badge>
            <Badge className="border-brand text-brand-deep">
              {operationLabel[property.operation]}
            </Badge>
            <Badge className={statusClass[property.status]}>{statusLabel[property.status]}</Badge>
          </div>
          <h1 className="mt-2 font-display text-2xl text-content">{property.title}</h1>
          <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-content-muted">
            <MapPin className="h-4 w-4" />
            {[property.address, property.district, property.city].filter(Boolean).join(', ') ||
              'Sin ubicación'}
          </p>
        </div>
        <p className="font-display text-3xl tabular-nums text-content">
          {formatMoney(property.price, property.currency)}
        </p>
      </div>

      {/* Specs */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {specs.map((spec) => {
          const Icon = spec.icon;
          return (
            <div
              key={spec.label}
              className="rounded-xl border border-border bg-surface-raised p-4 shadow-elevation-1"
            >
              <Icon className="h-5 w-5 text-brand-deep" />
              <p className="mt-2 text-lg font-semibold text-content">{spec.value}</p>
              <p className="text-xs text-content-muted">{spec.label}</p>
            </div>
          );
        })}
      </div>

      {/* Descripción + ubicación */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="mb-2 text-sm font-semibold text-content">Descripción</h2>
          <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
            <p className="whitespace-pre-line text-sm leading-relaxed text-content-secondary">
              {property.description || 'Sin descripción.'}
            </p>
          </div>
        </div>
        <div>
          <h2 className="mb-2 text-sm font-semibold text-content">Ubicación</h2>
          <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1 text-sm text-content-secondary">
            <p>
              {property.district ?? '—'}
              {property.city ? `, ${property.city}` : ''}
            </p>
            {(property.lat && property.lng) || property.address ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                  property.lat && property.lng
                    ? `${property.lat},${property.lng}`
                    : [property.address, property.district, property.city]
                        .filter(Boolean)
                        .join(', '),
                )}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-block text-xs text-brand-deep hover:underline"
              >
                Ver en Google Maps
              </a>
            ) : (
              <p className="mt-2 text-xs text-content-muted">Sin dirección ni coordenadas.</p>
            )}
            {property.owner && (
              <p className="mt-4 border-t border-border pt-3 text-xs text-content-muted">
                Propietario:{' '}
                <Link
                  href={`/clients/${property.owner.id}`}
                  className="text-brand-deep hover:underline"
                >
                  {property.owner.firstName} {property.owner.lastName}
                </Link>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
