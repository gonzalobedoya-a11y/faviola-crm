'use client';

import {
  ArrowLeft,
  Bath,
  Bed,
  Building2,
  ChevronLeft,
  ChevronRight,
  Copy,
  FileText,
  Globe2,
  ImagePlus,
  LoaderCircle,
  Maximize,
  MapPin,
  MessageCircle,
  RefreshCw,
  Ruler,
  Send,
  Sparkles,
  Star,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, type ChangeEvent, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  type Match,
  useMatches,
  useRunMatching,
  useUpdateMatchStatus,
} from '@/features/matching/api';
import {
  useAddPropertyMedia,
  useDeletePropertyMedia,
  useProperty,
  useReorderPropertyMedia,
  useSetPropertyCover,
} from '@/features/properties/api';
import { operationLabel, statusClass, statusLabel } from '@/features/properties/labels';
import type { PropertyDetail } from '@/features/properties/types';
import { formatMoney } from '@/lib/format';
import { compressPropertyImages } from '@/lib/images';

const brandName = 'Faviola Velarde';

function cleanPhone(phone?: string | null): string {
  const digits = phone?.replace(/\D/g, '') ?? '';
  if (!digits) return '';
  return digits.startsWith('51') ? digits : `51${digits}`;
}

function propertyLocation(property: PropertyDetail): string {
  return [property.address, property.district, property.city].filter(Boolean).join(', ');
}

function propertyShareText(property: PropertyDetail, clientName?: string): string {
  const location = propertyLocation(property);
  const greeting = clientName ? `Hola ${clientName},` : 'Hola,';
  const specs = [
    property.bedrooms ? `${property.bedrooms} dorm.` : null,
    property.bathrooms ? `${property.bathrooms} baños` : null,
    property.area ? `${property.area} m²` : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return [
    `${greeting} te comparto esta propiedad que puede interesarte:`,
    '',
    `🏡 ${property.title}`,
    `💰 ${formatMoney(property.price, property.currency)}`,
    location ? `📍 ${location}` : null,
    specs ? `📐 ${specs}` : null,
    property.description ? `\n${property.description.slice(0, 260)}` : null,
    '',
    `Código: ${property.code}`,
    'Si deseas, coordinamos una visita.',
    '',
    brandName,
  ]
    .filter(Boolean)
    .join('\n');
}

function whatsappUrl(text: string, phone?: string | null): string {
  const number = cleanPhone(phone);
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

function publicPropertyUrl(code: string): string {
  if (typeof window === 'undefined') return `/p/${code}`;
  return `${window.location.origin}/p/${code}`;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function openPropertyPdf(property: PropertyDetail): void {
  const images = property.media.filter((media) => media.type === 'IMAGE');
  const cover = images.find((media) => media.isCover) ?? images[0];
  const gallery = images.slice(1, 5);
  const location = propertyLocation(property) || 'Ubicación por confirmar';
  const specs: Array<[string, string]> = [
    ['Operación', operationLabel[property.operation]],
    ['Estado', statusLabel[property.status]],
    ['Dormitorios', property.bedrooms?.toString() ?? '—'],
    ['Baños', property.bathrooms?.toString() ?? '—'],
    ['Área', property.area ? `${property.area} m²` : '—'],
    ['Código', property.code],
  ];
  const popup = window.open('', '_blank', 'width=980,height=1200');
  if (!popup) return;

  popup.document.write(`<!doctype html>
  <html lang="es">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHtml(property.title)} · Ficha PDF</title>
      <style>
        @page { size: A4; margin: 16mm; }
        * { box-sizing: border-box; }
        body { margin: 0; color: #241f1a; font-family: Inter, Arial, sans-serif; background: #f8f3eb; }
        .sheet { min-height: 100vh; background: #fffaf3; padding: 28px; border: 1px solid #eadfce; }
        .brand { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; border-bottom: 1px solid #e7d8c2; padding-bottom: 18px; }
        .brand h1 { margin: 0; font-family: Georgia, serif; font-size: 28px; letter-spacing: .02em; }
        .brand p { margin: 4px 0 0; color: #8a7863; font-size: 12px; text-transform: uppercase; letter-spacing: .18em; }
        .code { border: 1px solid #b08a4a; color: #8a6125; padding: 8px 12px; border-radius: 999px; font-weight: 700; font-size: 12px; }
        .hero { margin-top: 22px; display: grid; grid-template-columns: 1.2fr .8fr; gap: 22px; }
        .cover { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 22px; border: 1px solid #eadfce; background: #efe5d6; }
        .empty { aspect-ratio: 4 / 3; display: grid; place-items: center; border-radius: 22px; border: 1px dashed #cdb891; color: #8a7863; background: #f5eddf; }
        h2 { margin: 0; font-family: Georgia, serif; font-size: 34px; line-height: 1.05; }
        .price { margin: 14px 0; font-family: Georgia, serif; font-size: 30px; color: #a77934; }
        .location { color: #6d6256; line-height: 1.45; }
        .specs { margin-top: 22px; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
        .spec { border: 1px solid #eadfce; border-radius: 14px; padding: 12px; background: #fff; }
        .spec small { display: block; color: #8a7863; font-size: 10px; text-transform: uppercase; letter-spacing: .12em; }
        .spec strong { display: block; margin-top: 4px; font-size: 15px; }
        .section { margin-top: 24px; }
        .section h3 { margin: 0 0 8px; font-size: 13px; text-transform: uppercase; letter-spacing: .16em; color: #8a6125; }
        .description { white-space: pre-line; line-height: 1.55; color: #40372f; }
        .gallery { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .gallery img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 14px; border: 1px solid #eadfce; }
        .footer { margin-top: 26px; padding-top: 16px; border-top: 1px solid #e7d8c2; display: flex; justify-content: space-between; color: #6d6256; font-size: 12px; }
        @media print { body { background: white; } .sheet { border: 0; padding: 0; } }
      </style>
    </head>
    <body>
      <main class="sheet">
        <header class="brand">
          <div><h1>Faviola Velarde</h1><p>Agente inmobiliaria</p></div>
          <div class="code">${escapeHtml(property.code)}</div>
        </header>
        <section class="hero">
          ${cover ? `<img class="cover" src="${cover.url}" alt="">` : '<div class="empty">Sin foto principal</div>'}
          <div>
            <h2>${escapeHtml(property.title)}</h2>
            <div class="price">${escapeHtml(formatMoney(property.price, property.currency))}</div>
            <p class="location">${escapeHtml(location)}</p>
            <div class="specs">
              ${specs
                .map(
                  ([label, value]) =>
                    `<div class="spec"><small>${escapeHtml(label)}</small><strong>${escapeHtml(value)}</strong></div>`,
                )
                .join('')}
            </div>
          </div>
        </section>
        <section class="section">
          <h3>Descripción</h3>
          <div class="description">${escapeHtml(property.description || 'Sin descripción.')}</div>
        </section>
        ${
          gallery.length
            ? `<section class="section"><h3>Galería</h3><div class="gallery">${gallery
                .map((image) => `<img src="${image.url}" alt="">`)
                .join('')}</div></section>`
            : ''
        }
        <footer class="footer">
          <span>Ficha comercial generada desde Faviola CRM</span>
          <span>${escapeHtml(new Date().toLocaleDateString('es-PE'))}</span>
        </footer>
      </main>
      <script>window.addEventListener('load', () => setTimeout(() => window.print(), 350));</script>
    </body>
  </html>`);
  popup.document.close();
}

export default function PropertyDetailPage(): ReactNode {
  const params = useParams<{ id: string }>();
  const { data: property, isLoading, isError } = useProperty(params.id);
  const { data: matches, isFetching: loadingMatches } = useMatches({
    propertyId: params.id,
    minScore: 40,
    pageSize: 6,
  });
  const runMatching = useRunMatching();
  const updateMatch = useUpdateMatchStatus();
  const [active, setActive] = useState(0);
  const [showPhotoForm, setShowPhotoForm] = useState(false);
  const [processingPhotos, setProcessingPhotos] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const addPhoto = useAddPropertyMedia(params.id);
  const setCover = useSetPropertyCover(params.id);
  const reorderMedia = useReorderPropertyMedia(params.id);
  const deleteMedia = useDeletePropertyMedia();

  if (isLoading) return <p className="p-8 text-sm text-content-muted">Cargando…</p>;
  if (isError || !property)
    return <p className="p-8 text-sm text-danger">No se encontró la propiedad.</p>;

  const images = property.media.filter((m) => m.type === 'IMAGE');
  const main = images[active] ?? images[0];
  const topMatches = matches?.items ?? [];
  const shareText = propertyShareText(property);
  const publicUrl = publicPropertyUrl(property.code);
  const busyMedia = setCover.isPending || reorderMedia.isPending || deleteMedia.isPending;
  const moveImage = async (index: number, direction: -1 | 1): Promise<void> => {
    const next = [...images];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const current = next[index];
    const targetImage = next[target];
    if (!current || !targetImage) return;
    next[index] = targetImage;
    next[target] = current;
    await reorderMedia.mutateAsync(next.map((media) => media.id));
    setActive(target);
  };
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
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/properties"
          className="inline-flex items-center gap-1 text-sm text-content-secondary hover:text-content"
        >
          <ArrowLeft className="h-4 w-4" />
          Propiedades
        </Link>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => openPropertyPdf(property)}>
            <FileText className="h-4 w-4" />
            Ficha PDF
          </Button>
          <Button asChild variant="secondary" size="sm">
            <a href={whatsappUrl(shareText)} target="_blank" rel="noreferrer">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <a href={`/p/${property.code}`} target="_blank" rel="noreferrer">
              <Globe2 className="h-4 w-4" />
              Ver página pública
            </a>
          </Button>
          <Button asChild variant="secondary" size="sm">
            <a href="/catalog" target="_blank" rel="noreferrer">
              <Globe2 className="h-4 w-4" />
              Catálogo
            </a>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void navigator.clipboard?.writeText(publicUrl)}
          >
            <Copy className="h-4 w-4" />
            Copiar link
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void runMatching.mutateAsync({ propertyId: params.id })}
            disabled={runMatching.isPending}
          >
            {runMatching.isPending ? (
              <LoaderCircle className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            Recalcular matches
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setShowPhotoForm((value) => !value)}>
            <ImagePlus className="h-4 w-4" />
            Agregar foto
          </Button>
        </div>
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
          {images.map((media, index) => (
            <div
              key={media.id}
              className={`relative aspect-[4/3] w-28 shrink-0 overflow-hidden rounded-lg border lg:w-full ${
                index === active ? 'border-brand' : 'border-border'
              }`}
            >
              <button
                type="button"
                onClick={() => setActive(index)}
                className="absolute inset-0"
                aria-label={`Ver foto ${index + 1}`}
              >
                <Image src={media.url} alt="" fill className="object-cover" sizes="120px" />
              </button>
              {media.isCover && (
                <span className="absolute left-1 top-1 rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-foreground">
                  Portada
                </span>
              )}
              <div className="absolute inset-x-1 bottom-1 flex justify-between gap-1">
                <button
                  type="button"
                  onClick={() => void moveImage(index, -1)}
                  disabled={busyMedia || index === 0}
                  className="rounded bg-black/55 p-1 text-white disabled:opacity-40"
                  aria-label="Mover foto a la izquierda"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void setCover.mutateAsync(media.id)}
                  disabled={busyMedia || media.isCover}
                  className="rounded bg-black/55 p-1 text-white disabled:opacity-40"
                  aria-label="Marcar como portada"
                >
                  <Star className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => deleteMedia.mutate({ propertyId: property.id, mediaId: media.id })}
                  disabled={busyMedia}
                  className="rounded bg-black/55 p-1 text-white disabled:opacity-40"
                  aria-label="Eliminar foto"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => void moveImage(index, 1)}
                  disabled={busyMedia || index === images.length - 1}
                  className="rounded bg-black/55 p-1 text-white disabled:opacity-40"
                  aria-label="Mover foto a la derecha"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
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

      <CompatibleClientsPanel
        matches={topMatches}
        property={property}
        loading={loadingMatches}
        updatingMatchId={updateMatch.variables?.id}
        updating={updateMatch.isPending}
        onMarkSent={(match) => updateMatch.mutate({ id: match.id, status: 'SENT' })}
      />
    </div>
  );
}

function CompatibleClientsPanel({
  matches,
  property,
  loading,
  updating,
  updatingMatchId,
  onMarkSent,
}: {
  matches: Match[];
  property: PropertyDetail;
  loading: boolean;
  updating: boolean;
  updatingMatchId?: string;
  onMarkSent: (match: Match) => void;
}): ReactNode {
  return (
    <section className="rounded-xl border border-brand/25 bg-gradient-to-br from-surface-raised to-brand/5 p-5 shadow-elevation-1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand-deep">
            <Sparkles className="h-3.5 w-3.5" />
            Inteligencia comercial
          </div>
          <h2 className="mt-3 font-display text-xl text-content">Clientes compatibles</h2>
          <p className="mt-1 text-sm text-content-muted">
            Leads recomendados para contactar con esta propiedad.
          </p>
        </div>
        <Badge className="border-brand text-brand-deep">
          {loading ? 'Calculando...' : `${matches.length} sugeridos`}
        </Badge>
      </div>

      <div className="mt-5 grid gap-3">
        {matches.map((match) => {
          const clientName = `${match.client.firstName} ${match.client.lastName}`;
          const text = propertyShareText(property, match.client.firstName);
          const phone = cleanPhone(match.client.phone);
          const sendingThis = updating && updatingMatchId === match.id;

          return (
            <article
              key={match.id}
              className="flex flex-col gap-4 rounded-xl border border-border bg-surface-raised p-4 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/clients/${match.client.id}`}
                    className="font-semibold text-content hover:text-brand-deep"
                  >
                    {clientName}
                  </Link>
                  <Badge className="border-success text-success">{match.score}% compatible</Badge>
                  <Badge className="border-border text-content-muted">{match.status}</Badge>
                </div>
                <p className="mt-2 text-sm text-content-muted">
                  {match.reasons.length ? match.reasons.join(' · ') : 'Coincidencia por requisitos'}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {phone ? (
                  <Button asChild size="sm" variant="secondary">
                    <a
                      href={whatsappUrl(text, phone)}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => onMarkSent(match)}
                    >
                      <MessageCircle className="h-4 w-4" />
                      WhatsApp
                    </a>
                  </Button>
                ) : (
                  <Button size="sm" variant="secondary" disabled>
                    <MessageCircle className="h-4 w-4" />
                    Sin teléfono
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    void navigator.clipboard?.writeText(text);
                    onMarkSent(match);
                  }}
                  disabled={sendingThis}
                >
                  {sendingThis ? (
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                  Copiar texto
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {!loading && matches.length === 0 && (
        <div className="mt-5 rounded-xl border border-dashed border-border bg-surface-raised p-5 text-sm text-content-muted">
          Aún no hay clientes compatibles. Revisa que los clientes tengan requisitos de búsqueda o
          usa “Recalcular matches” en la parte superior.
        </div>
      )}
    </section>
  );
}
