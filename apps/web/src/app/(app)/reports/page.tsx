'use client';

import { BarChart3, Download, Lightbulb, TrendingUp } from 'lucide-react';
import { useMemo, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { useDashboard } from '@/features/dashboard/api';
import { useBoard } from '@/features/deals/api';
import { formatMoney } from '@/lib/format';

const stageNames: Record<string, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  VISIT: 'Visita',
  OFFER: 'Oferta',
  NEGOTIATION: 'Negociación',
  CLOSING: 'Cierre',
  WON: 'Ganado',
  LOST: 'Perdido',
};

export default function ReportsPage(): ReactNode {
  const { data: dashboard, isLoading, isError } = useDashboard();
  const { data: board } = useBoard();
  const totalDeals = useMemo(
    () => board?.reduce((sum, column) => sum + column.count, 0) ?? 0,
    [board],
  );
  const maxStage = useMemo(
    () => Math.max(1, ...(board?.map((column) => column.count) ?? [1])),
    [board],
  );

  const exportCsv = (): void => {
    if (!dashboard) return;
    const rows = [
      ['Indicador', 'Valor'],
      ['Clientes', dashboard.counts.clients],
      ['Propiedades', dashboard.counts.properties],
      ['Coincidencias', dashboard.counts.matches],
      ['Negociaciones', dashboard.counts.deals],
      ['Valor en cartera', dashboard.counts.pipelineValue],
      ...(board ?? []).map((column) => [
        `Pipeline - ${stageNames[column.stage] ?? column.stage}`,
        column.count,
      ]),
    ];
    const csv = rows
      .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(','))
      .join('\n');
    const href = URL.createObjectURL(
      new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = href;
    link.download = `reporte-faviola-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(href);
  };

  if (isLoading)
    return <p className="py-16 text-center text-sm text-content-muted">Preparando reportes…</p>;
  if (isError || !dashboard)
    return (
      <p className="py-16 text-center text-sm text-danger">No se pudieron cargar los reportes.</p>
    );

  return (
    <div className="w-full max-w-7xl space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-content">Reportes</h1>
          <p className="mt-1 text-sm text-content-muted">
            Una vista clara de tu operación comercial.
          </p>
        </div>
        <Button variant="secondary" onClick={exportCsv}>
          <Download className="h-4 w-4" />
          Exportar CSV
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric
          label="Clientes"
          value={String(dashboard.counts.clients)}
          detail={`${dashboard.deltas.clients} nuevos este mes`}
        />
        <Metric
          label="Propiedades"
          value={String(dashboard.counts.properties)}
          detail={`${dashboard.deltas.properties} nuevas este mes`}
        />
        <Metric label="Negociaciones" value={String(totalDeals)} detail="En todas las etapas" />
        <Metric
          label="Valor en cartera"
          value={formatMoney(dashboard.counts.pipelineValue, 'PEN')}
          detail="Pipeline activo"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <section className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-brand" />
            <h2 className="font-semibold text-content">Embudo comercial</h2>
          </div>
          <div className="mt-5 space-y-4">
            {board?.map((column) => (
              <div key={column.stage}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span className="text-content-secondary">
                    {stageNames[column.stage] ?? column.stage}
                  </span>
                  <span className="font-medium tabular-nums text-content">
                    {column.count} · {formatMoney(column.total, 'PEN')}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-surface-sunken">
                  <div
                    className="h-full rounded-full bg-brand"
                    style={{ width: `${(column.count / maxStage) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-brand" />
            <h2 className="font-semibold text-content">Recomendaciones</h2>
          </div>
          {dashboard.nextActions.length === 0 ? (
            <p className="mt-5 text-sm text-content-muted">
              No hay acciones urgentes. Buen trabajo.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {dashboard.nextActions.map((action) => (
                <li
                  key={`${action.title}-${action.detail}`}
                  className="rounded-lg bg-surface-sunken p-3"
                >
                  <p className="text-sm font-medium text-content">{action.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-content-muted">{action.detail}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  detail,
}: {
  label: string;
  value: string;
  detail: string;
}): ReactNode {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
      <div className="flex items-center justify-between">
        <p className="text-sm text-content-muted">{label}</p>
        <TrendingUp className="h-4 w-4 text-brand" />
      </div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-content">{value}</p>
      <p className="mt-1 text-xs text-content-muted">{detail}</p>
    </div>
  );
}
