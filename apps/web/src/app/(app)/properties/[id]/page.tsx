'use client';

import {
  ArrowLeft,
  Bath,
  Bed,
  Building2,
  ImagePlus,
  LoaderCircle,
  Maximize,
  MapPin,
  Ruler,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, type ChangeEvent, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAddPropertyMedia, useProperty } from '@/features/properties/api';
import { operationLabel, statusClass, statusLabel } from '@/features/properties/labels';
import { formatMoney } from '@/lib/format';
import { compressPropertyImages } from '@/lib/images';

export default function PropertyDetailPage(): ReactNode {
  const params = useParams<{ id: string }>();
  const { data: property, isLoading, isError } = useProperty(params.id);
  const [active, setActive] = useState(0);
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [processingPhotos, setProcessingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const addPhoto = useAddPropertyMedia(params.id);

  if (isLoading) return <p className="p-8 text-sm text-content-muted">Cargando…</p>;
  if (isError || !property)
    return <p className="p-8 text-sm text-danger">No se encontró la propiedad.</p>;

  const images = property.media.filter((m) => m.type === 'IMAGE');
  const main = images[active] ?? images[0];
  const selectPhotos = async (event: ChangeEvent<HTMLInputElement>): Promise<void> => {
    const files = event.target.files;
    event.target.value = '';
    if (!files?.length) return;
    setPhotoError(null);
    if (images.length + files.length > 8) {
      setPhotoError('La propiedad puede tener hasta 8 imágenes.');
      return;
    }
    setProcessingPhotos(true);
    try {
      const prepared = await compressPropertyImages(files);
      for (const [index, url] of prepared.entries()) {
        await addPhoto.mutateAsync({
          url,
          type: 'IMAGE',
          isCover: images.length === 0 && index === 0,
        });
      }
      setShowPhotoForm(false);
    } catch (error) {
      setPhotoError(error instanceof Error ? error.message : 'No se pudieron guardar las fotos.');
    } finally {
      setProcessingPhotos(false);
    }
  };
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
        <div className="rounded-xl border border-border bg-surface-raised p-4 shadow-elevation-1">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-surface-sunken px-4 py-6 text-center hover:border-brand">
            {processingPhotos ? (
              <LoaderCircle className="h-6 w-6 animate-spin text-brand" />
            ) : (
              <ImagePlus className="h-6 w-6 text-brand" />
            )}
            <span className="text-sm font-medium text-content">
              {processingPhotos ? 'Comprimiendo y guardando…' : 'Elegir fotos del equipo'}
            </span>
            <span className="text-xs text-content-muted">JPG, PNG o WebP · máximo 8 fotos</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              disabled={processingPhotos}
              onChange={(event) => void selectPhotos(event)}
              className="sr-only"
              aria-label="Seleccionar nuevas fotos"
            />
          </label>
          {photoError && <p className="mt-3 text-sm text-danger">{photoError}</p>}
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
