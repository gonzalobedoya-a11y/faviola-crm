'use client';

import { Cake, Loader2, MessageCircle, Save, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  useBirthdays,
  useBirthdaySettings,
  useUpdateBirthdaySettings,
} from '@/features/clients/api';
import type { BirthdayItem } from '@/features/clients/types';
import { useAiAssist } from '@/features/inbox/api';

function whatsAppUrl(phone: string | null | undefined, text: string): string {
  const digits = phone?.replace(/\D/g, '') ?? '';
  const full = digits.startsWith('51') ? digits : `51${digits}`;
  return `https://wa.me/${full}?text=${encodeURIComponent(text)}`;
}

function dateLabel(item: BirthdayItem): string {
  if (item.daysUntil === 0) return '¡Hoy! 🎉';
  if (item.daysUntil === 1) return 'Mañana';
  return new Date(item.nextDate).toLocaleDateString('es-PE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

export default function BirthdaysPage(): ReactNode {
  const { data, isLoading } = useBirthdays(30);
  const { data: settings } = useBirthdaySettings();
  const update = useUpdateBirthdaySettings();

  const [template, setTemplate] = useState('');
  const [saved, setSaved] = useState(false);
  const loadedTemplate = settings?.template;

  useEffect(() => {
    if (typeof loadedTemplate === 'string') setTemplate(loadedTemplate);
  }, [loadedTemplate]);

  const saveTemplate = async (): Promise<void> => {
    await update.mutateAsync({ template });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const items = data?.items ?? [];
  const today = items.filter((i) => i.daysUntil === 0);
  const week = items.filter((i) => i.daysUntil > 0 && i.daysUntil <= 7);
  const month = items.filter((i) => i.daysUntil > 7);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-3xl text-content">
          <Cake className="h-7 w-7 text-brand" />
          Cumpleaños y saludos
        </h1>
        <p className="mt-1 text-sm text-content-muted">
          Los próximos 30 días. El cumpleaños se registra en la ficha de cada cliente.
        </p>
      </div>

      {/* Plantilla de saludo */}
      <section className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
        <p className="text-sm font-semibold text-content">Plantilla del saludo</p>
        <p className="mt-0.5 text-xs text-content-muted">
          Usa <code className="rounded bg-surface-sunken px-1">{'{nombre}'}</code> y se reemplaza
          solo con el nombre del cliente.
        </p>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          rows={3}
          className="mt-3 w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-xs text-content-secondary">
            <input
              type="checkbox"
              checked={settings?.autoSend ?? false}
              onChange={(e) => void update.mutateAsync({ autoSend: e.target.checked })}
              className="h-4 w-4 accent-[#a9884e]"
            />
            Enviar saludo automático el día del cumpleaños
            <span className="rounded-full bg-brand-tint px-2 py-0.5 text-[10px] font-semibold text-brand-deep">
              se activa al conectar WhatsApp (Fase 2)
            </span>
          </label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-success">{saved ? '✓ Guardado' : ''}</span>
            <Button
              variant="brand"
              size="sm"
              onClick={() => void saveTemplate()}
              disabled={update.isPending}
            >
              <Save className="h-4 w-4" />
              Guardar plantilla
            </Button>
          </div>
        </div>
      </section>

      {/* Listas */}
      {isLoading ? (
        <p className="py-16 text-center text-sm text-content-muted">Cargando cumpleaños…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong p-12 text-center">
          <Cake className="mx-auto h-8 w-8 text-content-muted" />
          <p className="mt-3 font-medium text-content">Sin cumpleaños en los próximos 30 días</p>
          <p className="mt-1 text-sm text-content-muted">
            Registra la fecha en la ficha del cliente (campo 🎂) o al crear uno nuevo en{' '}
            <Link href="/clients" className="text-brand-deep hover:underline">
              Clientes
            </Link>
            .
          </p>
        </div>
      ) : (
        <>
          {today.length > 0 && (
            <BirthdayGroup title="🎉 ¡Hoy cumplen!" items={today} template={template} highlight />
          )}
          {week.length > 0 && (
            <BirthdayGroup title="Esta semana" items={week} template={template} />
          )}
          {month.length > 0 && <BirthdayGroup title="Este mes" items={month} template={template} />}
        </>
      )}
    </div>
  );
}

function BirthdayGroup({
  title,
  items,
  template,
  highlight = false,
}: {
  title: string;
  items: BirthdayItem[];
  template: string;
  highlight?: boolean;
}): ReactNode {
  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold text-brand-deep">{title}</h2>
      <div
        className={`overflow-hidden rounded-xl border shadow-elevation-1 ${
          highlight
            ? 'border-[#d8a94a]/50 bg-[#fdf6e7] dark:bg-[#2a2416]'
            : 'border-border bg-surface-raised'
        }`}
      >
        {items.map((item) => (
          <BirthdayRow key={item.id} item={item} template={template} />
        ))}
      </div>
    </section>
  );
}

function BirthdayRow({ item, template }: { item: BirthdayItem; template: string }): ReactNode {
  const aiAssist = useAiAssist();
  const [aiGreeting, setAiGreeting] = useState<string | null>(null);

  const name = `${item.firstName} ${item.lastName}`;
  const defaultGreeting = template.replaceAll('{nombre}', item.firstName);

  const generate = async (): Promise<void> => {
    const result = await aiAssist.mutateAsync({
      mode: 'ask',
      prompt: `Redacta un saludo de cumpleaños por WhatsApp para ${name}, cliente de Faviola. Corto (2-3 líneas), cálido, personal y con algún emoji. Firma como Faviola Velarde. Devuelve SOLO el texto del saludo, sin comillas ni explicación.`,
    });
    setAiGreeting(result.text.trim());
  };

  return (
    <article className="border-b border-border px-4 py-3 last:border-0">
      <div className="flex flex-wrap items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-tint text-lg">
          🎂
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5">
            <Link
              href={`/clients/${item.id}`}
              className="text-sm font-semibold text-content hover:text-brand-deep"
            >
              {name}
            </Link>
            {(item.tags ?? []).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-brand-tint px-2 py-0.5 text-[10px] font-semibold text-brand-deep"
              >
                {tag}
              </span>
            ))}
          </p>
          <p className="text-xs capitalize text-content-muted">
            {dateLabel(item)}
            {item.turns ? ` · cumple ${item.turns} años` : ''}
            {item.phone ? ` · ${item.phone}` : ' · sin teléfono'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void generate()}
            disabled={aiAssist.isPending}
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-[#4c5b8a]/40 px-3 text-sm font-medium text-[#4c5b8a] transition hover:bg-[#4c5b8a] hover:text-white disabled:opacity-60 dark:text-[#aab4d4]"
          >
            {aiAssist.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Saludo con Claude
          </button>
          {item.phone && (
            <a
              href={whatsAppUrl(item.phone, aiGreeting ?? defaultGreeting)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#128C4B] px-3 text-sm font-medium text-white transition hover:bg-[#0f7a40]"
            >
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </a>
          )}
        </div>
      </div>
      {aiGreeting && (
        <div className="ml-13 mt-2 rounded-lg bg-surface-sunken/70 p-3 text-sm text-content">
          <p className="mb-1 flex items-center gap-1 text-[11px] font-semibold text-[#4c5b8a] dark:text-[#aab4d4]">
            <Sparkles className="h-3 w-3" /> Saludo generado — se enviará este texto:
          </p>
          <p className="whitespace-pre-wrap">{aiGreeting}</p>
        </div>
      )}
    </article>
  );
}
