'use client';

import { CalendarDays } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { type Visit, useVisits } from '@/features/visits/api';

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

export default function AgendaPage(): ReactNode {
  const { data: visits, isLoading } = useVisits();

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const upcoming = (visits ?? []).filter(
    (visit) => visit.status !== 'CANCELLED' && new Date(visit.scheduledAt) >= startOfToday,
  );

  const groups = new Map<string, Visit[]>();
  for (const visit of upcoming) {
    const key = dayKey(visit.scheduledAt);
    groups.set(key, [...(groups.get(key) ?? []), visit]);
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-content">Agenda</h1>
          <p className="mt-1 text-sm text-content-muted">Tus próximos días.</p>
        </div>
        <Button asChild variant="secondary">
          <Link href="/visits">Ver visitas</Link>
        </Button>
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-content-muted">Cargando agenda…</p>
      ) : groups.size === 0 ? (
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
        <div className="space-y-6">
          {Array.from(groups.entries()).map(([day, dayVisits]) => (
            <div key={day}>
              <h2 className="mb-2 text-sm font-semibold capitalize text-brand-deep">{day}</h2>
              <div className="overflow-hidden rounded-xl border border-border bg-surface-raised shadow-elevation-1">
                {dayVisits.map((visit) => (
                  <div
                    key={visit.id}
                    className="flex items-center gap-4 border-b border-border px-4 py-3 last:border-0"
                  >
                    <span className="w-14 shrink-0 text-sm font-medium tabular-nums text-content">
                      {time(visit.scheduledAt)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm text-content">
                        {visit.client.firstName} {visit.client.lastName}
                      </p>
                      {visit.property && (
                        <p className="truncate text-xs text-content-muted">
                          {visit.property.title}
                        </p>
                      )}
                    </div>
                    <span className="ml-auto text-xs text-content-muted">
                      {visit.durationMin} min
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
