'use client';

import { Bath, Bed, Building2, MapPin, Maximize, MessageCircle, Share2 } from 'lucide-react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { operationLabel } from '@/features/properties/labels';
import type { PropertyDetail } from '@/features/properties/types';
import { formatMoney } from '@/lib/format';

interface PublicProperty extends PropertyDetail {
  agent?: { firstName: string; lastName: string; phone?: string | null };
}

interface ApiEnvelope<T> {
  data?: T;
}

function cleanPhone(phone?: string | null): string {
  const digits = phone?.replace(/\D/g, '') ?? '';
  if (!digits) return '';
  return digits.startsWith('51') ? digits : `51${digits}`;
}

function whatsappUrl(property: PublicProperty): string {
  const number = cleanPhone(property.agent?.phone);
  const text = [
    'Hola Faviola, me interesa esta propiedad:',
    '',
    `${property.title}`,
    `${formatMoney(property.price, property.currency)}`,
    `Código: ${property.code}`,
    typeof window !== 'undefined' ? window.location.href : '',
  ].join('\n');
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

function locationText(property: PublicProperty): string {
  return [property.address, property.district, property.city].filter(Boolean).join(', ');
}

export default function PublicPropertyPage(): ReactNode {
  const params = useParams<{ code: string }>();
  const [property, setProperty] = useState<PublicProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const response = await fetch(`/api/v1/properties/public/${params.code}`, {
          headers: { Accept: 'application/json' },
        });
        if (!response.ok) throw new Error('No se pudo cargar la propiedad.');
        const body = (await response.json()) as ApiEnvelope<PublicProperty>;
        if (mounted) setProperty(body.data ?? (body as PublicProperty));
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : 'Propiedad no disponible.');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [params.code]);

  const images = useMemo(
    () => property?.media.filter((media) => media.type === 'IMAGE') ?? [],
    [property],
  );
  const cover = images[active] ?? images[0];

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f8f3eb] text-[#7d6c56]">
        Cargando propiedad…
      </main>
    );
  }

  if (error || !property) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f8f3eb] px-6 text-center">
        <div>
          <Building2 className="mx-auto h-10 w-10 text-[#a9884e]" />
          <h1 className="mt-4 font-display text-3xl text-[#241f1a]">Propiedad no disponible</h1>
          <p className="mt-2 text-sm text-[#7d6c56]">{error}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f8f3eb] text-[#241f1a]">
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-12">
        <div className="space-y-3">
          <div className="relative aspect-[16/11] overflow-hidden rounded-[2rem] border border-[#eadfce] bg-[#efe5d6] shadow-[0_24px_80px_rgba(36,31,26,0.12)]">
            {cover ? (
              <Image
                src={cover.url}
                alt={property.title}
                fill
                unoptimized
                className="object-cover"
                sizes="(min-width: 1024px) 55vw, 100vw"
              />
            ) : (
              <div className="grid h-full place-items-center">
                <Building2 className="h-16 w-16 text-[#a9884e]" />
              </div>
            )}
            <div className="absolute left-5 top-5 rounded-full bg-white/85 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#8a6125] backdrop-blur">
              {operationLabel[property.operation]}
            </div>
          </div>
          {images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {images.map((image, index) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => setActive(index)}
                  className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl border ${
                    active === index ? 'border-[#a9884e]' : 'border-[#eadfce]'
                  }`}
                >
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    unoptimized
                    className="object-cover"
                    sizes="112px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col justify-center rounded-[2rem] border border-[#eadfce] bg-white/75 p-7 shadow-[0_24px_80px_rgba(36,31,26,0.08)] backdrop-blur">
          <p className="font-script text-4xl text-[#a9884e]">Faviola Velarde</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Badge className="border-[#a9884e] text-[#8a6125]">{property.code}</Badge>
            <Badge className="border-[#d8cebb] text-[#6d6256]">
              {property.propertyType || 'Propiedad'}
            </Badge>
          </div>
          <h1 className="mt-4 font-display text-4xl leading-tight text-[#241f1a] md:text-5xl">
            {property.title}
          </h1>
          <p className="mt-4 font-display text-4xl text-[#a77934]">
            {formatMoney(property.price, property.currency)}
          </p>
          <p className="mt-4 flex gap-2 text-sm leading-relaxed text-[#6d6256]">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#a9884e]" />
            {locationText(property) || 'Ubicación a consultar'}
          </p>

          <div className="mt-7 grid grid-cols-3 gap-3">
            <Spec icon={<Bed className="h-5 w-5" />} label="Dorm." value={property.bedrooms} />
            <Spec icon={<Bath className="h-5 w-5" />} label="Baños" value={property.bathrooms} />
            <Spec
              icon={<Maximize className="h-5 w-5" />}
              label="Área"
              value={property.area ? `${property.area} m²` : undefined}
            />
          </div>

          <div className="mt-7 border-t border-[#eadfce] pt-6">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-[#8a6125]">
              Descripción
            </h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#40372f]">
              {property.description || 'Solicita más información para conocer esta propiedad.'}
            </p>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild variant="brand" size="lg">
              <a href={whatsappUrl(property)} target="_blank" rel="noreferrer">
                <MessageCircle className="h-5 w-5" />
                Consultar por WhatsApp
              </a>
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => void navigator.share?.({ title: property.title, url: location.href })}
            >
              <Share2 className="h-5 w-5" />
              Compartir
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}

function Spec({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value?: string | number | null;
}): ReactNode {
  return (
    <div className="rounded-2xl border border-[#eadfce] bg-white/70 p-4">
      <div className="text-[#a9884e]">{icon}</div>
      <p className="mt-2 font-semibold text-[#241f1a]">{value ?? '—'}</p>
      <p className="text-xs text-[#7d6c56]">{label}</p>
    </div>
  );
}
