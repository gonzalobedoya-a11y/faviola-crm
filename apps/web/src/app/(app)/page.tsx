'use client';

import {
  ArrowRight,
  AlertTriangle,
  Building2,
  CalendarDays,
  Plus,
  Sparkles,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { useDashboard } from '@/features/dashboard/api';
import { useAuth } from '@/lib/auth/auth-context';
import { formatMoney } from '@/lib/format';

const stageLabel: Record<string, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  VISIT: 'Visita',
  OFFER: 'Oferta',
  NEGOTIATION: 'Negociación',
  CLOSING: 'Cierre',
};
const stageColor: Record<string, string> = {
  NEW: '#a9884e',
  CONTACTED: '#4b7a52',
  VISIT: '#4e5a6e',
  OFFER: '#9b7cb0',
  NEGOTIATION: '#c98fae',
  CLOSING: '#356a5a',
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

function time(iso: string): string {
  return new Date(iso).toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' });
}

function relativeTime(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'hace un momento';
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  return `hace ${Math.round(hours / 24)} d`;
}

function matchScoreColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-brand-deep';
  return 'text-content-muted';
}

export default function DashboardPage(): ReactNode {
  const { data, isLoading } = useDashboard();
  const { user } = useAuth();
  const qs = data?.quickStats;
  const counts = data?.counts;

  const quickStats: { icon: LucideIcon; value: number; label: string; sub: string }[] = [
    { icon: Users, value: qs?.followUps ?? 0, label: 'clientes', sub: 'esperan seguimiento' },
    {
      icon: AlertTriangle,
      value: qs?.overdueVisits ?? 0,
      label: 'visitas vencidas',
      sub: 'requieren cierre',
    },
    {
      icon: Sparkles,
      value: qs?.newMatches ?? 0,
      label: 'nuevas coincidencias',
      sub: 'para tus clientes',
    },
    { icon: CalendarDays, value: qs?.visitsToday ?? 0, label: 'visitas', sub: 'para hoy' },
    { icon: Users, value: qs?.hotClients ?? 0, label: 'clientes hot', sub: 'alta prioridad' },
  ];

  const pipelineTotalCount = (data?.pipeline ?? []).reduce((sum, s) => sum + s.count, 0) || 1;
  const pipelineValue = (data?.pipeline ?? []).reduce((sum, s) => sum + s.total, 0);

  const executiveKpis: {
    icon: LucideIcon;
    title: string;
    headline: string;
    detail: string;
    items: Array<{ label: string; value: string | number; delta?: number }>;
  }[] = [
    {
      icon: Users,
      title: 'Contactos',
      headline: `${counts?.clients ?? 0} clientes`,
      detail: `${counts?.owners ?? 0} propietarios registrados`,
      items: [
        { label: 'Clientes', value: counts?.clients ?? 0, delta: data?.deltas.clients },
        { label: 'Propietarios', value: counts?.owners ?? 0 },
      ],
    },
    {
      icon: Building2,
      title: 'Inventario',
      headline: `${counts?.availableProperties ?? 0} disponibles`,
      detail: `${counts?.properties ?? 0} propiedades en cartera`,
      items: [
        { label: 'Propiedades', value: counts?.properties ?? 0, delta: data?.deltas.properties },
        { label: 'Documentos', value: counts?.documents ?? 0 },
      ],
    },
    {
      icon: Sparkles,
      title: 'Oportunidades',
      headline: `${counts?.matches ?? 0} coincidencias`,
      detail: `${counts?.deals ?? 0} negociaciones activas`,
      items: [
        { label: 'Coincidencias', value: counts?.matches ?? 0, delta: data?.deltas.matches },
        { label: 'Negociaciones', value: counts?.deals ?? 0 },
      ],
    },
    {
      icon: Wallet,
      title: 'Valor comercial',
      headline: formatMoney(counts?.pipelineValue ?? 0, 'PEN'),
      detail: 'Valor estimado en cartera y pipeline',
      items: [
        { label: 'En cartera', value: formatMoney(counts?.pipelineValue ?? 0, 'PEN') },
        { label: 'Pipeline', value: formatMoney(pipelineValue, 'PEN') },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-[#e7e0d2] bg-[#faf7f0]">
        <div className="pointer-events-none absolute inset-0 hidden md:block">
          <Image
            src="/brand/inicio-fv.png"
            alt=""
            fill
            className="object-cover object-[70%_center]"
            priority
          />
          <div
            className="absolute inset-0"
            style={{
              background:
                'linear-gradient(90deg,#faf7f0 0%,#faf7f0 28%, rgba(250,247,240,0.85) 44%, rgba(250,247,240,0) 66%)',
            }}
          />
        </div>

        <div className="relative z-10 max-w-2xl p-6 md:p-8">
          <h1 className="font-display text-4xl text-[#1b1a18] md:text-5xl">
            {greeting()}, {user?.firstName ?? 'Faviola'}
            <span className="text-[#a9884e]">.</span>
          </h1>
          <p className="mt-3 text-[#5c5647]">Estás un paso más cerca de tu próxima gran venta.</p>

          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {quickStats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div key={stat.label} className="flex items-start gap-2.5">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/70 text-[#a9884e]">
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-2xl font-semibold leading-none text-[#1b1a18]">
                      {stat.value}
                    </p>
                    <p className="mt-1 text-xs font-medium text-[#3d3a33]">{stat.label}</p>
                    <p className="text-[11px] text-[#8a8069]">{stat.sub}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild variant="brand" size="lg">
              <Link href="/matching">
                Ver mis acciones de hoy
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              className="border border-[#d8cebb] bg-white/70 text-[#1b1a18] hover:bg-white"
            >
              <Link href="/clients/new">
                <Plus className="h-4 w-4" />
                Agregar nuevo
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Próxima mejor acción */}
      {data && data.nextActions.length > 0 && (
        <section className="rounded-xl border border-[#4c5b8a]/30 bg-[#eceef5] p-5 dark:bg-[#1e2333]">
          <p className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-[#4c5b8a] dark:text-[#aab4d4]">
            <Sparkles className="h-4 w-4" />
            Próxima mejor acción
          </p>
          <div className="grid gap-3 md:grid-cols-3">
            {data.nextActions.map((action) => (
              <div
                key={action.title}
                className="rounded-lg bg-surface-raised p-4 shadow-elevation-1"
              >
                <p className="text-sm font-medium text-content">{action.title}</p>
                <p className="mt-1 text-xs text-content-muted">{action.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* KPIs */}
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, index) => <SkeletonCard key={index} />)
          : executiveKpis.map((kpi) => <ExecutiveKpiCard key={kpi.title} {...kpi} />)}
      </section>

      {/* Paneles */}
      <section className="grid gap-4 lg:grid-cols-3">
        <Panel title="Agenda de hoy" action="Ver agenda" href="/agenda">
          {isLoading ? (
            <SkeletonLines />
          ) : (
            <div className="space-y-3">
              {(data?.agenda ?? []).map((item) => (
                <div key={item.id} className="flex gap-3">
                  <span className="w-12 shrink-0 pt-0.5 text-xs font-medium tabular-nums text-content-muted">
                    {time(item.time)}
                  </span>
                  <div className="flex-1 rounded-lg border-l-2 border-brand bg-surface-sunken px-3 py-2.5">
                    <p className="text-sm font-medium text-content">{item.client}</p>
                    {item.property && <p className="text-xs text-content-muted">{item.property}</p>}
                  </div>
                </div>
              ))}
              {(data?.agenda.length ?? 0) === 0 && (
                <p className="py-6 text-center text-xs text-content-muted">Sin visitas hoy.</p>
              )}
            </div>
          )}
        </Panel>

        <Panel title="Nuevas coincidencias" action="Ver todas" href="/matching">
          {isLoading ? (
            <SkeletonLines />
          ) : (
            <div className="space-y-3">
              {(data?.matches ?? []).map((match) => (
                <Link
                  key={match.id}
                  href="/matching"
                  className="flex items-center gap-3 rounded-lg px-1 py-1 hover:bg-surface-sunken"
                >
                  <span className="relative flex h-12 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-brand-tint text-brand-deep">
                    {match.cover ? (
                      <Image src={match.cover} alt="" fill className="object-cover" sizes="56px" />
                    ) : (
                      <Building2 className="h-5 w-5" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-content">{match.client}</p>
                    <p className="truncate text-xs text-content-muted">{match.property}</p>
                  </div>
                  <span className={`text-sm font-semibold ${matchScoreColor(match.score)}`}>
                    {match.score}%
                  </span>
                </Link>
              ))}
              {(data?.matches.length ?? 0) === 0 && (
                <p className="py-6 text-center text-xs text-content-muted">
                  Sin coincidencias nuevas.
                </p>
              )}
            </div>
          )}
        </Panel>

        <Panel title="Pipeline comercial" action="Ver pipeline" href="/pipeline">
          {isLoading ? (
            <SkeletonLines />
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2 text-center sm:grid-cols-6 lg:grid-cols-3">
                {(data?.pipeline ?? []).map((stage) => (
                  <div key={stage.stage}>
                    <p className="truncate text-[10px] text-content-muted">
                      {stageLabel[stage.stage]}
                    </p>
                    <p className="mt-1 text-lg font-semibold tabular-nums text-content">
                      {stage.count}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex h-1.5 gap-1 overflow-hidden rounded-full">
                {(data?.pipeline ?? []).map((stage) => (
                  <span
                    key={stage.stage}
                    className="rounded-full"
                    style={{
                      flex: (stage.count || 0.02) / pipelineTotalCount,
                      backgroundColor: stageColor[stage.stage],
                    }}
                  />
                ))}
              </div>
              <div className="mt-4 border-t border-border pt-4">
                <p className="text-xs text-content-muted">Valor en pipeline</p>
                <p className="text-sm font-semibold tabular-nums text-content">
                  {formatMoney(pipelineValue, 'PEN')}
                </p>
              </div>
            </>
          )}
        </Panel>
      </section>

      {/* Actividad reciente */}
      <section className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
        <h2 className="mb-4 text-sm font-semibold text-content">Actividad reciente</h2>
        {isLoading ? (
          <SkeletonLines />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {(data?.activity ?? []).map((entry) => (
              <div key={entry.id} className="flex items-start gap-3">
                <span
                  className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand"
                  aria-hidden="true"
                />
                <div className="min-w-0">
                  <p className="truncate text-sm text-content">{entry.message}</p>
                  <p className="text-[11px] text-content-muted">
                    {entry.client ? `${entry.client} · ` : ''}
                    {relativeTime(entry.createdAt)}
                  </p>
                </div>
              </div>
            ))}
            {(data?.activity.length ?? 0) === 0 && (
              <p className="py-4 text-xs text-content-muted">Aún no hay actividad.</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

function Panel({
  title,
  action,
  href,
  children,
}: {
  title: string;
  action: string;
  href: string;
  children: ReactNode;
}): ReactNode {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-content">{title}</h2>
        <Link href={href} className="text-xs font-medium text-brand-deep hover:underline">
          {action}
        </Link>
      </div>
      {children}
    </div>
  );
}

function ExecutiveKpiCard({
  icon: Icon,
  title,
  headline,
  detail,
  items,
}: {
  icon: LucideIcon;
  title: string;
  headline: string;
  detail: string;
  items: Array<{ label: string; value: string | number; delta?: number }>;
}): ReactNode {
  return (
    <article className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-content-muted">
            {title}
          </p>
          <p className="mt-2 truncate text-2xl font-semibold tabular-nums text-content">
            {headline}
          </p>
          <p className="mt-1 text-sm text-content-muted">{detail}</p>
        </div>
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand-deep">
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border pt-4">
        {items.map((item) => (
          <div key={item.label} className="min-w-0">
            <p className="truncate text-lg font-semibold tabular-nums text-content">{item.value}</p>
            <p className="truncate text-xs text-content-muted">{item.label}</p>
            {item.delta !== undefined && item.delta > 0 && (
              <p className="mt-0.5 text-[11px] font-medium text-success">
                +{item.delta} esta semana
              </p>
            )}
          </div>
        ))}
      </div>
    </article>
  );
}

function SkeletonCard(): ReactNode {
  return (
    <div className="animate-pulse rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
      <div className="h-10 w-10 rounded-lg bg-surface-sunken" />
      <div className="mt-4 h-6 w-16 rounded bg-surface-sunken" />
      <div className="mt-2 h-3 w-20 rounded bg-surface-sunken" />
    </div>
  );
}

function SkeletonLines(): ReactNode {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-12 rounded-lg bg-surface-sunken" />
      ))}
    </div>
  );
}
