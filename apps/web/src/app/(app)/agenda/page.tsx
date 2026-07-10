'use client';

import {
  Building2,
  Cake,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Loader2,
  MessageCircle,
  Plus,
  UserRound,
  X,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { useBirthdays, useClients } from '@/features/clients/api';
import { useProperties } from '@/features/properties/api';
import {
  type Visit,
  type VisitStatus,
  useCreateVisit,
  useUpdateVisit,
  useVisits,
} from '@/features/visits/api';

type View = 'MONTH' | 'WEEK' | 'DAY' | 'LIST';

const HOUR_START = 7;
const HOUR_END = 21;
const HOUR_PX = 56;

const statusMeta: Record<
  VisitStatus,
  { label: string; badge: string; card: string; accent: string }
> = {
  SCHEDULED: {
    label: 'Sin confirmar',
    badge: 'bg-[#3d3a33] text-white',
    card: 'bg-[#e8f5ec] text-[#1f7a4d] dark:bg-[#173225] dark:text-[#7fd6a4]',
    accent: '#2aa06a',
  },
  DONE: {
    label: 'Realizada',
    badge: 'bg-success text-white',
    card: 'bg-brand-tint text-brand-deep',
    accent: '#a9884e',
  },
  CANCELLED: {
    label: 'Cancelada',
    badge: 'bg-content-muted text-white',
    card: 'bg-surface-sunken text-content-muted line-through',
    accent: '#9a9284',
  },
  NOSHOW: {
    label: 'No asistió',
    badge: 'bg-danger text-white',
    card: 'bg-danger/10 text-danger',
    accent: '#a9432f',
  },
};

// ── helpers de fecha ────────────────────────────────────────────────
function startOfDay(d: Date): Date {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c;
}
function addDays(d: Date, n: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + n);
  return c;
}
function startOfWeek(d: Date): Date {
  const c = startOfDay(d);
  const day = (c.getDay() + 6) % 7; // lunes = 0
  return addDays(c, -day);
}
function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
function timeLabel(iso: string): string {
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

// ── página ──────────────────────────────────────────────────────────
export default function AgendaPage(): ReactNode {
  const [view, setView] = useState<View>('WEEK');
  const [anchor, setAnchor] = useState<Date>(startOfDay(new Date()));
  const [selected, setSelected] = useState<Visit | null>(null);
  const [creating, setCreating] = useState(false);

  const { data: visits, isLoading } = useVisits();
  const { data: birthdaysData } = useBirthdays(60);

  const navigate = (dir: -1 | 1): void => {
    if (view === 'MONTH') {
      const c = new Date(anchor);
      c.setMonth(c.getMonth() + dir, 1);
      setAnchor(c);
    } else if (view === 'DAY') {
      setAnchor(addDays(anchor, dir));
    } else {
      setAnchor(addDays(anchor, dir * 7));
    }
  };

  const title = useMemo(() => {
    if (view === 'MONTH') {
      return anchor.toLocaleDateString('es-PE', { month: 'long', year: 'numeric' });
    }
    if (view === 'DAY') {
      return anchor.toLocaleDateString('es-PE', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
    }
    const from = startOfWeek(anchor);
    const to = addDays(from, 6);
    const toLabel = to.toLocaleDateString('es-PE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    return from.getMonth() === to.getMonth()
      ? `${from.getDate()} – ${toLabel}`
      : `${from.toLocaleDateString('es-PE', { day: 'numeric', month: 'short' })} – ${toLabel}`;
  }, [anchor, view]);

  const allVisits = visits ?? [];
  const birthdays = birthdaysData?.items ?? [];

  const visitsOn = (day: Date): Visit[] =>
    allVisits
      .filter((v) => sameDay(new Date(v.scheduledAt), day))
      .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  const birthdaysOn = (day: Date): { id: string; name: string }[] =>
    birthdays
      .filter((b) => sameDay(new Date(b.nextDate), day))
      .map((b) => ({ id: b.id, name: `${b.firstName} ${b.lastName}` }));

  return (
    <div className="w-full max-w-7xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-content">Agenda</h1>
          <p className="mt-1 text-sm text-content-muted">
            Visitas, seguimiento y cumpleaños en un solo calendario.
          </p>
        </div>
        <Button variant="brand" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Agendar visita
        </Button>
      </div>

      {/* Barra del calendario */}
      <div className="rounded-xl border border-border bg-surface-raised p-3 shadow-elevation-1">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => navigate(-1)}
              aria-label="Anterior"
              className={navBtn}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navigate(1)}
              aria-label="Siguiente"
              className={navBtn}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setAnchor(startOfDay(new Date()))}
              className="ml-1 rounded-lg bg-[#3d3a33] px-3.5 py-1.5 text-sm font-medium text-white transition hover:bg-[#55503f]"
            >
              Hoy
            </button>
          </div>
          <h2 className="font-display text-xl capitalize text-content">{title}</h2>
          <div className="flex gap-1.5">
            {(
              [
                ['MONTH', 'Mes'],
                ['WEEK', 'Semana'],
                ['DAY', 'Día'],
                ['LIST', 'Lista'],
              ] as [View, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  view === key
                    ? 'bg-brand text-on-brand'
                    : 'border border-border text-content-secondary hover:bg-surface-sunken'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          {isLoading ? (
            <p className="py-20 text-center text-sm text-content-muted">Cargando agenda…</p>
          ) : view === 'MONTH' ? (
            <MonthView
              anchor={anchor}
              visitsOn={visitsOn}
              birthdaysOn={birthdaysOn}
              onSelect={setSelected}
              onPickDay={(d) => {
                setAnchor(d);
                setView('DAY');
              }}
            />
          ) : view === 'LIST' ? (
            <ListView
              anchor={anchor}
              visitsOn={visitsOn}
              birthdaysOn={birthdaysOn}
              onSelect={setSelected}
            />
          ) : (
            <TimeGrid
              days={
                view === 'DAY'
                  ? [anchor]
                  : Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor), i))
              }
              visitsOn={visitsOn}
              birthdaysOn={birthdaysOn}
              onSelect={setSelected}
            />
          )}
        </div>
      </div>

      {selected && <VisitPanel visit={selected} onClose={() => setSelected(null)} />}
      {creating && <CreateVisitPanel onClose={() => setCreating(false)} defaultDate={anchor} />}
    </div>
  );
}

const navBtn =
  'flex h-9 w-9 items-center justify-center rounded-lg border border-border text-content-secondary transition hover:bg-surface-sunken';

// ── chips de evento ─────────────────────────────────────────────────
function EventChip({
  visit,
  onSelect,
  compact = false,
}: {
  visit: Visit;
  onSelect: (v: Visit) => void;
  compact?: boolean;
}): ReactNode {
  const meta = statusMeta[visit.status];
  return (
    <button
      type="button"
      onClick={() => onSelect(visit)}
      style={{ borderLeft: `3px solid ${meta.accent}` }}
      className={`block w-full rounded-md px-2 py-1 text-left text-[11px] leading-tight shadow-sm transition hover:brightness-95 ${meta.card}`}
    >
      <span className="flex items-center justify-between gap-1">
        <span className="truncate font-semibold">
          {visit.client.firstName} {visit.client.lastName}
        </span>
        {!compact && (
          <span
            className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${meta.badge}`}
          >
            {meta.label}
          </span>
        )}
      </span>
      <span className="block truncate opacity-80">
        {timeLabel(visit.scheduledAt)}
        {visit.property ? ` · ${visit.property.title}` : ''}
      </span>
    </button>
  );
}

function BirthdayChip({ name }: { name: string }): ReactNode {
  return (
    <span className="flex w-full items-center gap-1 rounded-md bg-[#fdf6e7] px-2 py-1 text-[11px] font-medium text-[#9a7524] dark:bg-[#2a2416] dark:text-[#d8c08c]">
      <Cake className="h-3 w-3 shrink-0" />
      <span className="truncate">{name}</span>
    </span>
  );
}

// ── vista mes ───────────────────────────────────────────────────────
function MonthView({
  anchor,
  visitsOn,
  birthdaysOn,
  onSelect,
  onPickDay,
}: {
  anchor: Date;
  visitsOn: (d: Date) => Visit[];
  birthdaysOn: (d: Date) => { id: string; name: string }[];
  onSelect: (v: Visit) => void;
  onPickDay: (d: Date) => void;
}): ReactNode {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const gridStart = startOfWeek(first);
  const weeks = Array.from({ length: 6 }, (_, w) =>
    Array.from({ length: 7 }, (_, d) => addDays(gridStart, w * 7 + d)),
  ).filter((week) => week.some((d) => d.getMonth() === anchor.getMonth()));
  const today = startOfDay(new Date());

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[56rem]">
        <div className="grid grid-cols-7 border-b border-border text-center text-[11px] font-semibold uppercase tracking-wide text-content-muted">
          {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map((d) => (
            <div key={d} className="py-2">
              {d}
            </div>
          ))}
        </div>
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b border-border last:border-0">
            {week.map((day) => {
              const inMonth = day.getMonth() === anchor.getMonth();
              const isToday = sameDay(day, today);
              const dayVisits = visitsOn(day);
              const dayBirthdays = birthdaysOn(day);
              const extra = dayVisits.length - 3;
              return (
                <div
                  key={day.toISOString()}
                  className={`min-h-28 space-y-1 border-r border-border p-1.5 last:border-r-0 ${
                    inMonth ? '' : 'bg-surface-sunken/40'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onPickDay(day)}
                    className={`ml-auto flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium transition hover:bg-brand-tint ${
                      isToday
                        ? 'bg-brand text-on-brand'
                        : inMonth
                          ? 'text-content'
                          : 'text-content-muted'
                    }`}
                  >
                    {day.getDate()}
                  </button>
                  {dayBirthdays.map((b) => (
                    <BirthdayChip key={b.id} name={b.name} />
                  ))}
                  {dayVisits.slice(0, 3).map((v) => (
                    <EventChip key={v.id} visit={v} onSelect={onSelect} compact />
                  ))}
                  {extra > 0 && (
                    <button
                      type="button"
                      onClick={() => onPickDay(day)}
                      className="w-full text-left text-[11px] font-medium text-brand-deep hover:underline"
                    >
                      +{extra} más
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── vista semana / día (grilla horaria) ─────────────────────────────
function TimeGrid({
  days,
  visitsOn,
  birthdaysOn,
  onSelect,
}: {
  days: Date[];
  visitsOn: (d: Date) => Visit[];
  birthdaysOn: (d: Date) => { id: string; name: string }[];
  onSelect: (v: Visit) => void;
}): ReactNode {
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i);
  const today = startOfDay(new Date());

  return (
    <div className="overflow-x-auto">
      <div className={days.length === 1 ? 'min-w-[28rem]' : 'min-w-[56rem]'}>
        {/* cabecera de días + cumpleaños (todo el día) */}
        <div
          className="grid border-b border-border"
          style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, 1fr)` }}
        >
          <div />
          {days.map((day) => (
            <div key={day.toISOString()} className="border-l border-border px-2 py-2">
              <p
                className={`text-center text-xs font-semibold uppercase ${
                  sameDay(day, today) ? 'text-brand-deep' : 'text-content-muted'
                }`}
              >
                {day.toLocaleDateString('es-PE', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'numeric',
                })}
              </p>
              <div className="mt-1 space-y-1">
                {birthdaysOn(day).map((b) => (
                  <BirthdayChip key={b.id} name={b.name} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* grilla horaria */}
        <div className="grid" style={{ gridTemplateColumns: `3.5rem repeat(${days.length}, 1fr)` }}>
          <div>
            {hours.map((h) => (
              <div
                key={h}
                style={{ height: HOUR_PX }}
                className="pr-2 text-right text-[11px] text-content-muted"
              >
                {h}
              </div>
            ))}
          </div>
          {days.map((day) => {
            const dayVisits = visitsOn(day);
            return (
              <div
                key={day.toISOString()}
                className="relative border-l border-border"
                style={{ height: hours.length * HOUR_PX }}
              >
                {hours.map((h) => (
                  <div key={h} style={{ height: HOUR_PX }} className="border-b border-border/60" />
                ))}
                {dayVisits.map((v) => {
                  const d = new Date(v.scheduledAt);
                  const startMin = d.getHours() * 60 + d.getMinutes() - HOUR_START * 60;
                  const top = Math.max(0, (startMin / 60) * HOUR_PX);
                  const height = Math.max(30, (v.durationMin / 60) * HOUR_PX);
                  return (
                    <div key={v.id} className="absolute left-1 right-1" style={{ top, height }}>
                      <div className="h-full [&>button]:h-full">
                        <EventChip visit={v} onSelect={onSelect} />
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── vista lista ─────────────────────────────────────────────────────
function ListView({
  anchor,
  visitsOn,
  birthdaysOn,
  onSelect,
}: {
  anchor: Date;
  visitsOn: (d: Date) => Visit[];
  birthdaysOn: (d: Date) => { id: string; name: string }[];
  onSelect: (v: Visit) => void;
}): ReactNode {
  const days = Array.from({ length: 7 }, (_, i) => addDays(startOfWeek(anchor), i));
  const withEvents = days.filter((d) => visitsOn(d).length > 0 || birthdaysOn(d).length > 0);

  if (withEvents.length === 0) {
    return (
      <p className="py-16 text-center text-sm text-content-muted">
        Sin eventos esta semana. Usa “Agendar visita” para crear uno.
      </p>
    );
  }

  return (
    <div className="divide-y divide-border">
      {withEvents.map((day) => (
        <div key={day.toISOString()}>
          <div className="flex items-center justify-between bg-surface-sunken/60 px-4 py-2">
            <p className="text-xs font-semibold uppercase text-content-secondary">
              {day.toLocaleDateString('es-PE', { weekday: 'long' })}
            </p>
            <p className="text-xs font-medium uppercase text-content-muted">
              {day.toLocaleDateString('es-PE', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          {birthdaysOn(day).map((b) => (
            <div key={b.id} className="flex items-center gap-4 px-4 py-3">
              <span className="w-28 shrink-0 text-sm text-content-muted">Todo el día</span>
              <div className="flex-1">
                <BirthdayChip name={`Cumpleaños de ${b.name} 🎉`} />
              </div>
            </div>
          ))}
          {visitsOn(day).map((v) => {
            const meta = statusMeta[v.status];
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onSelect(v)}
                className="flex w-full items-center gap-4 px-4 py-3 text-left transition hover:bg-surface-sunken/50"
              >
                <span className="w-28 shrink-0 text-sm tabular-nums text-content">
                  {timeLabel(v.scheduledAt)} –{' '}
                  {timeLabel(
                    new Date(
                      new Date(v.scheduledAt).getTime() + v.durationMin * 60000,
                    ).toISOString(),
                  )}
                </span>
                <span
                  className="h-8 w-1 shrink-0 rounded-full"
                  style={{ background: meta.accent }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-content">
                    {v.client.firstName} {v.client.lastName}
                  </span>
                  {v.property && (
                    <span className="block truncate text-xs text-content-muted">
                      {v.property.title}
                    </span>
                  )}
                </span>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${meta.badge}`}
                >
                  {meta.label}
                </span>
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── panel de detalle ────────────────────────────────────────────────
function VisitPanel({ visit, onClose }: { visit: Visit; onClose: () => void }): ReactNode {
  const updateVisit = useUpdateVisit();
  const meta = statusMeta[visit.status];
  const hasPhone = Boolean(cleanPhone(visit.client.phone));

  const setStatus = async (status: VisitStatus): Promise<void> => {
    await updateVisit.mutateAsync({ id: visit.id, status });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-2">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${meta.badge}`}>
              {meta.label}
            </span>
            <h3 className="mt-2 font-display text-xl text-content">
              {visit.client.firstName} {visit.client.lastName}
            </h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className={navBtn}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 space-y-2 text-sm text-content-secondary">
          <p className="flex items-center gap-2">
            <Clock3 className="h-4 w-4 text-content-muted" />
            {new Date(visit.scheduledAt).toLocaleString('es-PE', {
              weekday: 'long',
              day: '2-digit',
              month: 'long',
              hour: '2-digit',
              minute: '2-digit',
            })}{' '}
            · {visit.durationMin} min
          </p>
          {visit.property && (
            <p className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-content-muted" />
              {visit.property.title}
              {visit.property.district ? ` — ${visit.property.district}` : ''}
            </p>
          )}
          {visit.client.phone && (
            <p className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-content-muted" />
              {visit.client.phone}
            </p>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {hasPhone && visit.status === 'SCHEDULED' && (
            <a
              href={reminderUrl(visit)}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-md bg-[#128C4B] px-3 text-sm font-medium text-white transition hover:bg-[#0f7a40]"
            >
              <MessageCircle className="h-4 w-4" />
              Recordatorio
            </a>
          )}
          {visit.status === 'SCHEDULED' ? (
            <>
              <Button variant="brand" size="sm" onClick={() => void setStatus('DONE')}>
                Realizada ✓
              </Button>
              <Button variant="secondary" size="sm" onClick={() => void setStatus('NOSHOW')}>
                No asistió
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="text-danger"
                onClick={() => void setStatus('CANCELLED')}
              >
                Cancelar
              </Button>
            </>
          ) : (
            <Button variant="secondary" size="sm" onClick={() => void setStatus('SCHEDULED')}>
              Volver a pendiente
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── crear visita ────────────────────────────────────────────────────
function CreateVisitPanel({
  onClose,
  defaultDate,
}: {
  onClose: () => void;
  defaultDate: Date;
}): ReactNode {
  const createVisit = useCreateVisit();
  const { data: clients } = useClients({});
  const { data: properties } = useProperties({});

  const [clientId, setClientId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [date, setDate] = useState(() => {
    const d = defaultDate < new Date() ? new Date() : defaultDate;
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(60);
  const [error, setError] = useState<string | null>(null);

  const submit = async (): Promise<void> => {
    if (!clientId) {
      setError('Elige un cliente.');
      return;
    }
    setError(null);
    try {
      await createVisit.mutateAsync({
        clientId,
        propertyId: propertyId || undefined,
        scheduledAt: new Date(`${date}T${time}:00`).toISOString(),
        durationMin: duration,
      });
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo agendar la visita.');
    }
  };

  const inputClass =
    'h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-content focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/30 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-2">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-xl text-content">Agendar visita</h3>
          <button type="button" onClick={onClose} aria-label="Cerrar" className={navBtn}>
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-content-secondary">Cliente</span>
            <select
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              className={`${inputClass} mt-1`}
            >
              <option value="">Selecciona un cliente</option>
              {clients?.items.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-content-secondary">Propiedad (opcional)</span>
            <select
              value={propertyId}
              onChange={(e) => setPropertyId(e.target.value)}
              className={`${inputClass} mt-1`}
            >
              <option value="">Sin propiedad</option>
              {properties?.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.code} · {p.title}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-3 gap-3">
            <label className="block">
              <span className="text-xs font-medium text-content-secondary">Fecha</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-content-secondary">Hora</span>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className={`${inputClass} mt-1`}
              />
            </label>
            <label className="block">
              <span className="text-xs font-medium text-content-secondary">Duración</span>
              <select
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className={`${inputClass} mt-1`}
              >
                {[30, 45, 60, 90, 120].map((d) => (
                  <option key={d} value={d}>
                    {d} min
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="brand" onClick={() => void submit()} disabled={createVisit.isPending}>
            {createVisit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Agendar'}
          </Button>
        </div>
      </div>
    </div>
  );
}
