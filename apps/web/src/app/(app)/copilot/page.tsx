'use client';

import { Copy, FileText, MessageCircle, Sparkles, WandSparkles } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { useClients } from '@/features/clients/api';
import type { Client } from '@/features/clients/types';
import { useProperties } from '@/features/properties/api';
import type { Property } from '@/features/properties/types';
import { formatMoney } from '@/lib/format';

type Mode = 'description' | 'whatsapp' | 'ownerReport' | 'nextSteps';

const modes: Array<{ key: Mode; title: string; detail: string }> = [
  {
    key: 'description',
    title: 'Descripción vendedora',
    detail: 'Redacta una descripción elegante para publicar una propiedad.',
  },
  {
    key: 'whatsapp',
    title: 'WhatsApp a comprador',
    detail: 'Prepara un mensaje breve para enviar una propiedad.',
  },
  {
    key: 'ownerReport',
    title: 'Reporte al propietario',
    detail: 'Resume estado, valor y próximos pasos para el dueño.',
  },
  {
    key: 'nextSteps',
    title: 'Próximos pasos',
    detail: 'Sugiere acciones comerciales para no perder oportunidades.',
  },
];

function propertySummary(property?: Property): string {
  if (!property) return '';
  return [
    property.title,
    formatMoney(property.price, property.currency),
    [property.district, property.city].filter(Boolean).join(', '),
    property.bedrooms ? `${property.bedrooms} dormitorios` : null,
    property.bathrooms ? `${property.bathrooms} baños` : null,
    property.area ? `${property.area} m²` : null,
  ]
    .filter(Boolean)
    .join(' · ');
}

function generateOutput(mode: Mode, property?: Property, client?: Client): string {
  const location = property
    ? [property.address, property.district, property.city].filter(Boolean).join(', ')
    : '';
  const publicLink =
    typeof window !== 'undefined' && property ? `${window.location.origin}/p/${property.code}` : '';

  if (mode === 'description') {
    if (!property) return 'Selecciona una propiedad para generar una descripción.';
    return [
      `${property.title}`,
      '',
      `Una propiedad pensada para quienes buscan comodidad, ubicación y una inversión bien sustentada. ${location ? `Ubicada en ${location},` : 'Con una ubicación estratégica,'} ofrece ambientes funcionales y una distribución ideal para vivir, alquilar o proyectar valor patrimonial.`,
      '',
      [
        property.bedrooms ? `${property.bedrooms} dormitorios` : null,
        property.bathrooms ? `${property.bathrooms} baños` : null,
        property.area ? `${property.area} m²` : null,
      ]
        .filter(Boolean)
        .join(' · '),
      '',
      `Precio: ${formatMoney(property.price, property.currency)}. Código: ${property.code}.`,
      'Coordina una visita y conoce el potencial de esta propiedad.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (mode === 'whatsapp') {
    if (!property) return 'Selecciona una propiedad para generar un mensaje.';
    const greeting = client ? `Hola ${client.firstName},` : 'Hola,';
    return [
      `${greeting} te comparto una propiedad que podría encajar con lo que estás buscando:`,
      '',
      `🏡 ${property.title}`,
      `💰 ${formatMoney(property.price, property.currency)}`,
      location ? `📍 ${location}` : null,
      property.area ? `📐 ${property.area} m²` : null,
      '',
      publicLink ? `Puedes verla aquí: ${publicLink}` : null,
      '',
      'Si te interesa, coordinamos una visita.',
      'Faviola Velarde',
    ]
      .filter(Boolean)
      .join('\n');
  }

  if (mode === 'ownerReport') {
    if (!property) return 'Selecciona una propiedad para generar un reporte.';
    return [
      `Reporte rápido · ${property.code}`,
      '',
      `Propiedad: ${property.title}`,
      `Estado: ${property.status}`,
      `Precio publicado: ${formatMoney(property.price, property.currency)}`,
      location ? `Ubicación: ${location}` : null,
      '',
      'Lectura comercial:',
      '- Mantener fotografías, ficha pública y documentos completos eleva la confianza del comprador.',
      '- Recomiendo compartir la ficha pública con leads calificados y registrar feedback de visitas.',
      '- Si no hay movimiento en 7-10 días, revisar precio, descripción o estrategia de difusión.',
      '',
      publicLink ? `Link público: ${publicLink}` : null,
    ]
      .filter(Boolean)
      .join('\n');
  }

  return [
    'Próximas acciones sugeridas:',
    '',
    property
      ? `1. Revisar y compartir la ficha pública de ${property.title}.`
      : '1. Seleccionar una propiedad prioritaria.',
    client
      ? `2. Contactar a ${client.firstName} ${client.lastName} con un mensaje personalizado.`
      : '2. Elegir un cliente caliente o una coincidencia nueva.',
    '3. Agendar seguimiento o visita para no perder temperatura comercial.',
    '4. Completar documentos críticos antes de negociación.',
    '5. Registrar toda respuesta como actividad del cliente.',
  ].join('\n');
}

export default function CopilotPage(): ReactNode {
  const { data: properties } = useProperties({});
  const { data: clients } = useClients({});
  const [mode, setMode] = useState<Mode>('description');
  const [propertyId, setPropertyId] = useState('');
  const [clientId, setClientId] = useState('');

  const property = useMemo(
    () => properties?.items.find((item) => item.id === propertyId),
    [properties, propertyId],
  );
  const client = useMemo(
    () => clients?.items.find((item) => item.id === clientId),
    [clients, clientId],
  );
  const output = generateOutput(mode, property, client);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="inline-flex items-center gap-2 font-display text-3xl text-content">
            <WandSparkles className="h-7 w-7 text-brand" />
            FV Copilot
          </h1>
          <p className="mt-1 text-sm text-content-muted">
            Asistente comercial para redactar, priorizar y vender con más velocidad.
          </p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/matching">Ver coincidencias</Link>
        </Button>
      </div>

      <section className="grid gap-3 md:grid-cols-4">
        {modes.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setMode(item.key)}
            className={`rounded-xl border p-4 text-left transition-colors ${
              mode === item.key
                ? 'border-brand bg-brand-tint text-brand-deep'
                : 'border-border bg-surface-raised text-content hover:bg-surface-sunken'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            <p className="mt-3 font-semibold">{item.title}</p>
            <p className="mt-1 text-xs opacity-75">{item.detail}</p>
          </button>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <div className="space-y-4 rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
          <h2 className="font-semibold text-content">Contexto</h2>
          <div>
            <label htmlFor="property" className="mb-1.5 block text-sm font-medium text-content">
              Propiedad
            </label>
            <select
              id="property"
              value={propertyId}
              onChange={(event) => setPropertyId(event.target.value)}
              className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-content"
            >
              <option value="">Selecciona propiedad</option>
              {properties?.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.code} · {item.title}
                </option>
              ))}
            </select>
            {property && (
              <p className="mt-2 text-xs text-content-muted">{propertySummary(property)}</p>
            )}
          </div>

          <div>
            <label htmlFor="client" className="mb-1.5 block text-sm font-medium text-content">
              Cliente opcional
            </label>
            <select
              id="client"
              value={clientId}
              onChange={(event) => setClientId(event.target.value)}
              className="h-11 w-full rounded-md border border-border bg-surface px-3 text-sm text-content"
            >
              <option value="">Sin cliente específico</option>
              {clients?.items.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.firstName} {item.lastName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="font-semibold text-content">Resultado sugerido</h2>
              <p className="text-xs text-content-muted">
                Puedes copiarlo y ajustarlo antes de enviar.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => void navigator.clipboard?.writeText(output)}
              >
                <Copy className="h-4 w-4" />
                Copiar
              </Button>
              {mode === 'whatsapp' && (
                <Button asChild variant="brand" size="sm">
                  <a
                    href={`https://wa.me/?text=${encodeURIComponent(output)}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </a>
                </Button>
              )}
            </div>
          </div>
          <pre className="min-h-[360px] whitespace-pre-wrap rounded-xl border border-border bg-surface-sunken p-4 text-sm leading-6 text-content">
            {output}
          </pre>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Tip
              icon={<FileText className="h-4 w-4" />}
              text="Úsalo para ficha, redes, WhatsApp o reporte al propietario."
            />
            <Tip
              icon={<Sparkles className="h-4 w-4" />}
              text="Mientras más completa esté la propiedad, mejor será el texto."
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function Tip({ icon, text }: { icon: ReactNode; text: string }): ReactNode {
  return (
    <div className="flex gap-2 rounded-lg border border-border bg-surface-sunken p-3 text-xs text-content-muted">
      <span className="text-brand-deep">{icon}</span>
      {text}
    </div>
  );
}
