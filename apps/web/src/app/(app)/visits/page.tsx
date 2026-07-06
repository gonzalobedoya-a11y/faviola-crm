'use client';

import { CalendarClock, Check, MapPin, Phone, Plus, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useClients } from '@/features/clients/api';
import { useProperties } from '@/features/properties/api';
import {
  type Visit,
  type VisitStatus,
  useCreateVisit,
  useUpdateVisit,
  useVisits,
} from '@/features/visits/api';

const statusLabel: Record<VisitStatus, string> = {
  SCHEDULED: 'Agendada',
  DONE: 'Realizada',
  CANCELLED: 'Cancelada',
  NOSHOW: 'No asistió',
};

const statusClass: Record<VisitStatus, string> = {
  SCHEDULED: 'border-info text-info',
  DONE: 'border-success text-success',
  CANCELLED: 'border-border text-content-muted',
  NOSHOW: 'border-warning text-warning',
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString('es-PE', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function VisitsPage(): ReactNode {
  const { data: visits, isLoading } = useVisits();
  const [showForm, setShowForm] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-content">Visitas</h1>
          <p className="mt-1 text-sm text-content-muted">Agenda y seguimiento de visitas.</p>
        </div>
        <Button variant="brand" onClick={() => setShowForm((v) => !v)}>
          <Plus className="h-4 w-4" />
          Agendar visita
        </Button>
      </div>

      {showForm && <ScheduleForm onClose={() => setShowForm(false)} />}

      {isLoading ? (
        <p className="py-16 text-center text-sm text-content-muted">Cargando visitas…</p>
      ) : !visits || visits.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-raised p-12 text-center">
          <CalendarClock className="mx-auto h-8 w-8 text-content-muted" />
          <p className="mt-3 font-medium text-content">Sin visitas agendadas</p>
          <p className="mt-1 text-sm text-content-muted">Agenda tu primera visita.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visits.map((visit) => (
            <VisitCard key={visit.id} visit={visit} />
          ))}
        </div>
      )}
    </div>
  );
}

function VisitCard({ visit }: { visit: Visit }): ReactNode {
  const updateVisit = useUpdateVisit();
  const [feedback, setFeedback] = useState(visit.feedback ?? '');

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4 shadow-elevation-1">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium tabular-nums text-content">
            {formatWhen(visit.scheduledAt)}
          </p>
          <p className="mt-0.5 text-sm text-content">
            {visit.client.firstName} {visit.client.lastName}
            {visit.property ? ` · ${visit.property.title}` : ''}
          </p>
          <div className="mt-1 flex flex-wrap gap-3 text-xs text-content-muted">
            {visit.client.phone && (
              <span className="inline-flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {visit.client.phone}
              </span>
            )}
            {visit.property?.district && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" />
                {visit.property.district}
              </span>
            )}
            <span>{visit.durationMin} min</span>
          </div>
        </div>
        <Badge className={statusClass[visit.status]}>{statusLabel[visit.status]}</Badge>
      </div>

      {visit.status === 'SCHEDULED' && (
        <div className="mt-3 flex gap-2 border-t border-border pt-3">
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
            variant="ghost"
            onClick={() => updateVisit.mutate({ id: visit.id, status: 'CANCELLED' })}
            disabled={updateVisit.isPending}
          >
            <X className="h-4 w-4" />
            Cancelar
          </Button>
        </div>
      )}

      {visit.status === 'DONE' && (
        <div className="mt-3 flex gap-2 border-t border-border pt-3">
          <input
            value={feedback}
            onChange={(event) => setFeedback(event.target.value)}
            placeholder="¿Cómo fue la visita?"
            className="h-9 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-content placeholder:text-content-muted focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={() => updateVisit.mutate({ id: visit.id, feedback })}
            disabled={updateVisit.isPending}
          >
            Guardar nota
          </Button>
        </div>
      )}
    </div>
  );
}

function ScheduleForm({ onClose }: { onClose: () => void }): ReactNode {
  const { data: clients } = useClients({});
  const { data: properties } = useProperties({});
  const createVisit = useCreateVisit();
  const [clientId, setClientId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [when, setWhen] = useState('');
  const [duration, setDuration] = useState('60');

  const submit = async (): Promise<void> => {
    if (!clientId || !when) return;
    await createVisit.mutateAsync({
      clientId,
      propertyId: propertyId || undefined,
      scheduledAt: new Date(when).toISOString(),
      durationMin: Number(duration),
    });
    onClose();
  };

  const field =
    'h-10 w-full rounded-md border border-border bg-surface-raised px-3 text-sm text-content focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-surface-raised p-4 shadow-elevation-1 sm:grid-cols-2">
      <select className={field} value={clientId} onChange={(e) => setClientId(e.target.value)}>
        <option value="">Cliente…</option>
        {clients?.items.map((c) => (
          <option key={c.id} value={c.id}>
            {c.firstName} {c.lastName}
          </option>
        ))}
      </select>
      <select className={field} value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
        <option value="">Propiedad (opcional)…</option>
        {properties?.items.map((p) => (
          <option key={p.id} value={p.id}>
            {p.title}
          </option>
        ))}
      </select>
      <input
        type="datetime-local"
        className={field}
        value={when}
        onChange={(e) => setWhen(e.target.value)}
      />
      <div className="flex gap-2">
        <select className={field} value={duration} onChange={(e) => setDuration(e.target.value)}>
          <option value="30">30 min</option>
          <option value="60">60 min</option>
          <option value="90">90 min</option>
        </select>
        <Button
          variant="brand"
          onClick={() => void submit()}
          disabled={!clientId || !when || createVisit.isPending}
        >
          Agendar
        </Button>
      </div>
    </div>
  );
}
