'use client';

import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Clock3,
  Coins,
  Flame,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import { useLeadsDashboard } from '@/features/inbox/api';
import { ChannelLogo, channelMeta } from '@/features/inbox/channel';
import type { InboxChannel } from '@/features/inbox/types';
import { formatMoney } from '@/lib/format';

const PERIODS = [
  { label: 'Hoy', days: 1 },
  { label: 'Semana', days: 7 },
  { label: 'Mes', days: 30 },
] as const;

const TEMPERATURES = [
  { key: 'HOT', label: 'HOT', color: '#a9432f' },
  { key: 'WARM', label: 'WARM', color: '#b8892f' },
  { key: 'COLD', label: 'COLD', color: '#4e5a6e' },
] as const;

const AUTHORS = [
  { key: 'CONTACT', label: 'Cliente', color: '#4e5a6e' },
  { key: 'AGENT', label: 'Faviola', color: '#a9884e' },
  { key: 'AI', label: 'Claude', color: '#4c5b8a' },
] as const;

const CHANNELS: InboxChannel[] = ['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK'];

export default function LeadsDashboardPage(): ReactNode {
  const [days, setDays] = useState<number>(30);
  const { data, isLoading } = useLeadsDashboard(days);
  const s = data?.summary;

  const metrics: { icon: LucideIcon; label: string; value: string | number; sub: string }[] = [
    {
      icon: Users,
      label: 'Leads activos',
      value: s?.activeConversations ?? 0,
      sub: `${s?.totalLeads ?? 0} compradores en el CRM`,
    },
    {
      icon: UserPlus,
      label: 'Nuevos',
      value: s?.newInPeriod ?? 0,
      sub: 'conversaciones del período',
    },
    {
      icon: CheckCircle2,
      label: 'Gestionados',
      value: s?.managedInPeriod ?? 0,
      sub: 'con actividad en el período',
    },
    {
      icon: Clock3,
      label: 'Pendientes de respuesta',
      value: s?.pendingResponse ?? 0,
      sub: 'el cliente habló último',
    },
    {
      icon: Flame,
      label: 'Leads calientes',
      value: s?.hotLeads ?? 0,
      sub: 'temperatura HOT',
    },
    {
      icon: Bell,
      label: 'No leídos',
      value: s?.unread ?? 0,
      sub: 'mensajes sin abrir',
    },
    {
      icon: Wallet,
      label: 'Con presupuesto',
      value: s?.withBudget ?? 0,
      sub: 'leads con budget registrado',
    },
    {
      icon: Coins,
      label: 'Presupuesto promedio',
      value: formatMoney(s?.avgBudget ?? 0, 'PEN'),
      sub: 'sobre leads con presupuesto',
    },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <Link
          href="/messages"
          className="inline-flex items-center gap-1.5 text-sm text-content-muted transition hover:text-brand-deep"
        >
          <ArrowLeft className="h-4 w-4" />
          Volver a la bandeja
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl text-content">Dashboard de leads</h1>
            <p className="mt-1 text-sm text-content-muted">
              Monitorea la gestión comercial, temperatura, respuesta y origen de tus leads.
            </p>
          </div>
          <div className="flex gap-1.5">
            {PERIODS.map((p) => (
              <button
                key={p.days}
                type="button"
                onClick={() => setDays(p.days)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  days === p.days
                    ? 'bg-brand text-on-brand'
                    : 'bg-surface-raised text-content-secondary shadow-elevation-1 hover:bg-brand-tint hover:text-brand-deep'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Métricas */}
      <section className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="rounded-xl border border-border bg-surface-raised p-4 shadow-elevation-1"
            >
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-content-muted">{m.label}</p>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-tint text-brand-deep">
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-2 font-display text-3xl text-content">{isLoading ? '…' : m.value}</p>
              <p className="mt-1 text-[11px] text-content-muted">{m.sub}</p>
            </div>
          );
        })}
      </section>

      {/* Temperatura + Último mensaje */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
          <h2 className="font-display text-2xl text-content">Temperatura de leads</h2>
          <p className="mt-1 text-sm text-content-muted">
            Distribución por nivel de intención comercial.
          </p>
          <div className="mt-5 space-y-4">
            {TEMPERATURES.map((t) => (
              <BarRow
                key={t.key}
                label={t.label}
                value={data?.temperature[t.key] ?? 0}
                total={s?.totalLeads ?? 0}
                color={t.color}
              />
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
          <h2 className="font-display text-2xl text-content">Último mensaje</h2>
          <p className="mt-1 text-sm text-content-muted">
            Quién habló último en cada conversación — control rápido de respuesta.
          </p>
          <div className="mt-5 space-y-4">
            {AUTHORS.map((a) => (
              <BarRow
                key={a.key}
                label={a.label}
                value={data?.lastMessageBy[a.key] ?? 0}
                total={Object.values(data?.lastMessageBy ?? {}).reduce((x, y) => x + y, 0)}
                color={a.color}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Canales */}
      <section className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
        <h2 className="font-display text-2xl text-content">Canales de lead</h2>
        <p className="mt-1 text-sm text-content-muted">De qué red llegan tus conversaciones.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {CHANNELS.map((c) => (
            <div
              key={c}
              className="flex items-center gap-3 rounded-xl border border-border bg-surface-sunken/60 p-4"
            >
              <ChannelLogo channel={c} size={34} />
              <div>
                <p className="text-xs font-medium text-content-muted">{channelMeta[c].label}</p>
                <p className="font-display text-2xl text-content">{data?.byChannel[c] ?? 0}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Fuentes */}
      <section className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
        <h2 className="font-display text-2xl text-content">Leads por fuente</h2>
        <p className="mt-1 text-sm text-content-muted">Origen comercial de tus compradores.</p>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(data?.bySource ?? {})
            .sort(([, a], [, b]) => b - a)
            .map(([source, count]) => (
              <div
                key={source}
                className="rounded-xl border border-border bg-surface-sunken/60 p-4"
              >
                <p className="truncate text-xs font-medium text-content-muted" title={source}>
                  {source}
                </p>
                <p className="mt-1 font-display text-2xl text-content">{count}</p>
              </div>
            ))}
          {!isLoading && Object.keys(data?.bySource ?? {}).length === 0 && (
            <p className="col-span-full text-sm text-content-muted">
              Aún no hay leads con fuente registrada.
            </p>
          )}
        </div>
      </section>
    </div>
  );
}

function BarRow({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}): ReactNode {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-sm">
        <span className="font-semibold text-content">{label}</span>
        <span className="text-content-muted">
          <b className="text-content">{value}</b> · {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-sunken">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
}
