'use client';

import { CheckCircle2, Home, LoaderCircle, MessageCircle, Send } from 'lucide-react';
import Link from 'next/link';
import { useState, type FormEvent, type InputHTMLAttributes, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';

interface LeadPayload {
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  operation: 'SALE' | 'RENT';
  propertyType?: string;
  budgetMax?: number;
  currency: 'PEN' | 'USD';
  bedroomsMin?: number;
  zones: string[];
  notes?: string;
  source: string;
}

function whatsappLeadUrl(): string {
  const text = [
    'Hola Faviola, acabo de dejar mis datos en la web.',
    'Me gustaría recibir asesoría inmobiliaria.',
  ].join('\n');
  return `https://wa.me/?text=${encodeURIComponent(text)}`;
}

export default function PublicLeadPage(): ReactNode {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const budgetMax = String(form.get('budgetMax') ?? '').replace(/\D/g, '');
    const bedroomsMin = String(form.get('bedroomsMin') ?? '');
    const zones = String(form.get('zones') ?? '')
      .split(',')
      .map((zone) => zone.trim())
      .filter(Boolean);

    const payload: LeadPayload = {
      firstName: String(form.get('firstName') ?? '').trim(),
      lastName: String(form.get('lastName') ?? '').trim() || undefined,
      phone: String(form.get('phone') ?? '').trim(),
      email: String(form.get('email') ?? '').trim() || undefined,
      operation: String(form.get('operation')) === 'RENT' ? 'RENT' : 'SALE',
      propertyType: String(form.get('propertyType') ?? '').trim() || undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      currency: String(form.get('currency')) === 'PEN' ? 'PEN' : 'USD',
      bedroomsMin: bedroomsMin ? Number(bedroomsMin) : undefined,
      zones,
      notes: String(form.get('notes') ?? '').trim() || undefined,
      source: 'Formulario público web',
    };

    try {
      const response = await fetch('/api/v1/clients/public-leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('No pudimos registrar tus datos. Intenta nuevamente.');
      setSent(true);
      event.currentTarget.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No pudimos registrar tus datos.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f8f3eb] text-[#241f1a]">
      <section className="mx-auto grid max-w-6xl gap-8 px-5 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:py-12">
        <aside className="rounded-[2rem] border border-[#eadfce] bg-white/75 p-7 shadow-[0_24px_80px_rgba(36,31,26,0.08)] backdrop-blur">
          <p className="font-script text-4xl text-[#a9884e]">Faviola Velarde</p>
          <h1 className="mt-5 font-display text-4xl leading-tight md:text-5xl">
            Cuéntanos qué propiedad estás buscando
          </h1>
          <p className="mt-4 text-sm leading-7 text-[#6d6256]">
            Este formulario crea automáticamente tu ficha de cliente en el CRM para que Faviola
            pueda cruzarte con propiedades compatibles y contactarte con opciones reales.
          </p>
          <div className="mt-7 grid gap-3 text-sm text-[#40372f]">
            <div className="rounded-2xl border border-[#eadfce] bg-white/70 p-4">
              <strong className="block text-[#8a6125]">Respuesta más rápida</strong>
              Al enviar tus datos, quedas como lead caliente dentro del CRM.
            </div>
            <div className="rounded-2xl border border-[#eadfce] bg-white/70 p-4">
              <strong className="block text-[#8a6125]">Búsqueda inteligente</strong>
              Se registran presupuesto, zonas y dormitorios para sugerir propiedades.
            </div>
          </div>
          <div className="mt-7 flex flex-wrap gap-3">
            <Button asChild variant="secondary">
              <Link href="/catalog">
                <Home className="h-4 w-4" />
                Ver catálogo
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <a href={whatsappLeadUrl()} target="_blank" rel="noreferrer">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          </div>
        </aside>

        <form
          onSubmit={(event) => void submit(event)}
          className="rounded-[2rem] border border-[#eadfce] bg-white p-6 shadow-[0_24px_80px_rgba(36,31,26,0.1)]"
        >
          {sent && (
            <div className="mb-5 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <CheckCircle2 className="mb-2 h-5 w-5" />
              Datos recibidos. Faviola podrá ver este lead en el CRM y contactarte pronto.
            </div>
          )}
          {error && (
            <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre" name="firstName" required />
            <Field label="Apellido" name="lastName" />
            <Field label="WhatsApp" name="phone" required placeholder="Ej. 999 999 999" />
            <Field label="Correo" name="email" type="email" placeholder="correo@ejemplo.com" />
            <label className="space-y-1 text-sm font-medium text-[#40372f]">
              Operación
              <select
                name="operation"
                className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-sm outline-none focus:border-[#a9884e] focus:ring-2 focus:ring-[#a9884e]/20"
              >
                <option value="SALE">Comprar</option>
                <option value="RENT">Alquilar</option>
              </select>
            </label>
            <Field
              label="Tipo de propiedad"
              name="propertyType"
              placeholder="Departamento, casa..."
            />
            <label className="space-y-1 text-sm font-medium text-[#40372f]">
              Moneda
              <select
                name="currency"
                className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-sm outline-none focus:border-[#a9884e] focus:ring-2 focus:ring-[#a9884e]/20"
              >
                <option value="USD">USD</option>
                <option value="PEN">PEN</option>
              </select>
            </label>
            <Field label="Presupuesto máximo" name="budgetMax" inputMode="numeric" />
            <Field label="Dormitorios mínimos" name="bedroomsMin" type="number" min={0} />
            <Field label="Zonas favoritas" name="zones" placeholder="Miraflores, San Isidro..." />
          </div>

          <label className="mt-4 block space-y-1 text-sm font-medium text-[#40372f]">
            Comentarios
            <textarea
              name="notes"
              rows={4}
              placeholder="Cuéntanos si necesitas estacionamiento, pet friendly, fecha de mudanza..."
              className="w-full rounded-xl border border-[#eadfce] bg-white px-3 py-3 text-sm outline-none focus:border-[#a9884e] focus:ring-2 focus:ring-[#a9884e]/20"
            />
          </label>

          <Button
            type="submit"
            variant="brand"
            size="lg"
            className="mt-6 w-full"
            disabled={submitting}
          >
            {submitting ? (
              <LoaderCircle className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
            Enviar búsqueda
          </Button>
        </form>
      </section>
    </main>
  );
}

function Field({
  label,
  name,
  type = 'text',
  ...props
}: {
  label: string;
  name: string;
  type?: string;
} & InputHTMLAttributes<HTMLInputElement>): ReactNode {
  return (
    <label className="space-y-1 text-sm font-medium text-[#40372f]">
      {label}
      <input
        name={name}
        type={type}
        className="h-11 w-full rounded-xl border border-[#eadfce] bg-white px-3 text-sm outline-none focus:border-[#a9884e] focus:ring-2 focus:ring-[#a9884e]/20"
        {...props}
      />
    </label>
  );
}
