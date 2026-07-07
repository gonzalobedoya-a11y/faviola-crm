'use client';

import { AlertTriangle, CalendarDays, Check, Clock3, MessageCircle, X } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { type Visit, useUpdateVisit, useVisits } from '@/features/visits/api';

function dayKey(iso: string): string {
  return new Date(iso).toLocaleDateString('es-PE', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
}

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

function cleanPhone(phone?: string | null): string {
  const digits = phone?.replace(/\D/g, '') ?? '';
  if (!digits) return '';
  return digits.startsWith('51') ? digits : `51${digits}`;
}

function reminderUrl(visit: Visit): string {
  const text = [
    `Hola ${visit.client.firstName}, te recuerdo nuestra visita agendada:`,
    '',
    `📅 ${new Date(visit.scheduledAt).toLocaleString('es-PE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })}`,
    visit.property ? `🏡 ${visit.property.title}` : null,
    visit.property?.district ? `📍 ${visit.property.district}` : null,
    '',
    '¿Me confirmas tu asistencia?',
    'Faviola Velarde',
  ]
    .filter(Boolean)
    .join('\n');
  return `https://wa.me/${cleanPhone(visit.client.phone)}?text=${encodeURIComponent(text)}`;
}

function minutesUntil(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60_000);
}

function reminderBadge(visit: Visit): ReactNode {
  if (visit.status !== 'SCHEDULED')
    return <Badge className="border-border text-content-muted">Cerrada</Badge>;
  const minutes = minutesUntil(visit.scheduledAt);
  if (minutes < 0) return <Badge className="border-danger text-danger">Vencida</Badge>;
  if (minutes <= 60) return <Badge className="border-warning text-warning">En {minutes} min</Badge>;
  if (minutes <= 24 * 60) return <Badge className="border-info text-info">Hoy</Badge>;
  return <Badge className="border-border text-content-muted">Próxima</Badge>;
}

export default function AgendaPage(): ReactNode {
  const { data: visits, isLoading } = useVisits();

  const scheduled = (visits ?? []).filter((visit) => visit.status === 'SCHEDULED');
  const overdue = scheduled.filter((visit) => minutesUntil(visit.scheduledAt) < 0);
  const today = scheduled.filter((visit) => {
    const date = new Date(visit.scheduledAt);
    const now = new Date();
    return date.toDateString() === now.toDateString() && minutesUntil(visit.scheduledAt) >= 0;
  });
  const upcoming = scheduled.filter((visit) => {
    const date = new Date(visit.scheduledAt);
    const now = new Date();
    return date.toDateString() !== now.toDateString() && minutesUntil(visit.scheduledAt) >= 0;
  });

  const groups = new Map<string, Visit[]>();
  for (const visit of upcoming) {
    const key = dayKey(visit.scheduledAt);
    groups.set(key, [...(groups.get(key) ?? []), visit]);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-content">Agenda inteligente</h1>
          <p className="mt-1 text-sm text-content-muted">
            Recordatorios, visitas vencidas y seguimiento del día.
          </p>
        </div>
        <Button asChild variant="brand">
          <Link href="/visits">Agendar visita</Link>
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric
          icon={<AlertTriangle className="h-5 w-5" />}
          label="Vencidas"
          value={overdue.length}
          tone="danger"
        />
        <Metric
          icon={<Clock3 className="h-5 w-5" />}
          label="Hoy"
          value={today.length}
          tone="brand"
        />
        <Metric
          icon={<CalendarDays className="h-5 w-5" />}
          label="Próximas"
          value={upcoming.length}
          tone="info"
        />
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-content-muted">Cargando agenda…</p>
      ) : scheduled.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-raised p-12 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-content-muted" />
          <p className="mt-3 font-medium text-content">Nada agendado por ahora</p>
          <p className="mt-1 text-sm text-content-muted">
            Agenda una visita desde{' '}
            <Link href="/visits" className="text-brand-deep hover:underline">
              Visitas
            </Link>
            .
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <section className="space-y-3">
            <h2 className="text-sm font-semibold text-brand-deep">Prioridad de seguimiento</h2>
            {[...overdue, ...today].length === 0 ? (
              <EmptyCard text="No tienes urgencias para hoy." />
            ) : (
              [...overdue, ...today].map((visit) => (
                <AgendaCard key={visit.id} visit={visit} priority />
              ))
            )}
          </section>

          <section className="space-y-6">
            {Array.from(groups.entries()).map(([day, dayVisits]) => (
              <div key={day}>
                <h2 className="mb-2 text-sm font-semibold capitalize text-brand-deep">{day}</h2>
                <div className="overflow-hidden rounded-xl border border-border bg-surface-raised shadow-elevation-1">
                  {dayVisits.map((visit) => (
                    <AgendaCard key={visit.id} visit={visit} />
                  ))}
                </div>
              </div>
            ))}
            {groups.size === 0 && <EmptyCard text="Sin visitas futuras fuera de hoy." />}
          </section>
        </div>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: 'danger' | 'brand' | 'info';
}): ReactNode {
  const toneClass = {
    danger: 'text-danger bg-danger/5 border-danger/25',
    brand: 'text-brand-deep bg-brand/5 border-brand/25',
    info: 'text-info bg-info/5 border-info/25',
  }[tone];
  return (
    <div className={`rounded-xl border p-4 ${toneClass}`}>
      {icon}
      <p className="mt-2 font-display text-3xl">{value}</p>
      <p className="text-xs font-medium uppercase tracking-[0.16em]">{label}</p>
    </div>
  );
}

function AgendaCard({ visit, priority = false }: { visit: Visit; priority?: boolean }): ReactNode {
  const updateVisit = useUpdateVisit();
  const hasPhone = Boolean(cleanPhone(visit.client.phone));

  return (
    <article
      className={`border-b border-border bg-surface-raised px-4 py-3 last:border-0 ${
        priority ? 'rounded-xl border border-border shadow-elevation-1' : ''
      }`}
    >
      <div className="flex flex-wrap items-start gap-4">
        <span className="w-14 shrink-0 text-sm font-medium tabular-nums text-content">
          {time(visit.scheduledAt)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-medium text-content">
              {visit.client.firstName} {visit.client.lastName}
            </p>
            {reminderBadge(visit)}
          </div>
          {visit.property && (
            <p className="mt-0.5 truncate text-xs text-content-muted">{visit.property.title}</p>
          )}
          <p className="mt-1 text-xs text-content-muted">
            {visit.durationMin} min {visit.property?.district ? `· ${visit.property.district}` : ''}
          </p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2 border-t border-border pt-3">
        {hasPhone ? (
          <Button asChild size="sm" variant="secondary">
            <a href={reminderUrl(visit)} target="_blank" rel="noreferrer">
              <MessageCircle className="h-3.5 w-3.5" />
              Recordar
            </a>
          </Button>
        ) : (
          <Button size="sm" variant="secondary" disabled>
            <MessageCircle className="h-3.5 w-3.5" />
            Sin teléfono
          </Button>
        )}
        <Button
          size="sm"
          variant="brand"
          onClick={() => updateVisit.mutate({ id: visit.id, status: 'DONE' })}
          disabled={updateVisit.isPending}
        >
          <Check className="h-3.5 w-3.5" />
          Realizada
        </Button>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => updateVisit.mutate({ id: visit.id, status: 'NOSHOW' })}
          disabled={updateVisit.isPending}
        >
          No asistió
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => updateVisit.mutate({ id: visit.id, status: 'CANCELLED' })}
          disabled={updateVisit.isPending}
        >
          <X className="h-3.5 w-3.5" />
          Cancelar
        </Button>
      </div>
    </article>
  );
}

function EmptyCard({ text }: { text: string }): ReactNode {
  return (
    <div className="rounded-xl border border-dashed border-border bg-surface-raised p-6 text-sm text-content-muted">
      {text}
    </div>
  );
}
