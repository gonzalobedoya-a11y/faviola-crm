'use client';

import { Building2, RefreshCw, Send, Sparkles, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  type Match,
  useClearMatches,
  useMatches,
  useRunMatching,
  useUpdateMatchStatus,
} from '@/features/matching/api';
import { formatMoney } from '@/lib/format';

const scoreFilters = [
  { label: 'Todas', value: undefined },
  { label: '60% +', value: 60 },
  { label: '80% +', value: 80 },
] as const;

const statusLabel: Record<string, string> = {
  NEW: 'Nueva',
  SENT: 'Enviada',
  VIEWED: 'Vista',
  DISCARDED: 'Descartada',
  CONVERTED: 'Convertida',
};

function scoreColor(score: number): string {
  if (score >= 80) return 'text-success';
  if (score >= 60) return 'text-brand-deep';
  return 'text-content-muted';
}

export default function MatchingPage(): ReactNode {
  const [minScore, setMinScore] = useState<number | undefined>(undefined);
  const { data, isLoading } = useMatches({ minScore });
  const runMatching = useRunMatching();
  const clearMatches = useClearMatches();
  const [note, setNote] = useState<string | null>(null);

  const recalculate = async (): Promise<void> => {
    const result = await runMatching.mutateAsync({});
    setNote(
      `${result.matches} coincidencia${result.matches === 1 ? '' : 's'} calculada${result.matches === 1 ? '' : 's'}.`,
    );
    setTimeout(() => setNote(null), 4000);
  };

  const clearAll = async (): Promise<void> => {
    if (!window.confirm('¿Borrar todas las coincidencias calculadas?')) return;
    const result = await clearMatches.mutateAsync();
    setNote(
      `${result.deleted} coincidencia${result.deleted === 1 ? '' : 's'} borrada${result.deleted === 1 ? '' : 's'}.`,
    );
    setTimeout(() => setNote(null), 4000);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="inline-flex items-center gap-2 font-display text-3xl text-content">
            <Sparkles className="h-6 w-6 text-brand" />
            Coincidencias
          </h1>
          <p className="mt-1 text-sm text-content-muted">
            Compradores conectados con propiedades, automáticamente.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => void clearAll()}
            disabled={clearMatches.isPending || !data?.items.length}
          >
            <Trash2 className="h-4 w-4" />
            Borrar coincidencias
          </Button>
          <Button
            variant="secondary"
            onClick={() => void recalculate()}
            disabled={runMatching.isPending}
          >
            <RefreshCw className={`h-4 w-4 ${runMatching.isPending ? 'animate-spin' : ''}`} />
            Recalcular
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-lg border border-border bg-surface-sunken p-1">
          {scoreFilters.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => setMinScore(f.value)}
              className={
                minScore === f.value
                  ? 'rounded-md bg-surface-raised px-4 py-1.5 text-sm font-medium text-content shadow-elevation-1'
                  : 'rounded-md px-4 py-1.5 text-sm text-content-secondary hover:text-content'
              }
            >
              {f.label}
            </button>
          ))}
        </div>
        {note && <p className="text-sm text-success">{note}</p>}
      </div>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-content-muted">Cargando coincidencias…</p>
      ) : !data || data.items.length === 0 ? (
        <EmptyState onRun={() => void recalculate()} running={runMatching.isPending} />
      ) : (
        <div className="space-y-3">
          {data.items.map((match) => (
            <MatchRow key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchRow({ match }: { match: Match }): ReactNode {
  const updateStatus = useUpdateMatchStatus();
  const cover = match.property.media[0]?.url;
  const reasons = Array.isArray(match.reasons) ? match.reasons : [];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-raised p-4 shadow-elevation-1 sm:flex-row sm:items-center">
      <div className="relative h-20 w-28 shrink-0 overflow-hidden rounded-lg bg-surface-sunken">
        {cover ? (
          <Image
            src={cover}
            alt={match.property.title}
            fill
            className="object-cover"
            sizes="112px"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-content-muted">
            <Building2 className="h-6 w-6" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
          <Link
            href={`/clients/${match.client.id}`}
            className="font-medium text-content hover:text-brand-deep"
          >
            {match.client.firstName} {match.client.lastName}
          </Link>
          <span className="text-content-muted">→</span>
          <Link
            href={`/properties/${match.property.id}`}
            className="truncate font-medium text-content hover:text-brand-deep"
          >
            {match.property.title}
          </Link>
        </div>
        <p className="mt-0.5 text-xs text-content-muted">
          {formatMoney(match.property.price, match.property.currency)}
          {match.property.district ? ` · ${match.property.district}` : ''}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {reasons.slice(0, 4).map((reason) => (
            <span
              key={reason}
              className="rounded-full bg-brand-tint px-2 py-0.5 text-[11px] font-medium text-brand-deep"
            >
              {reason}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-4 sm:flex-col sm:items-end">
        <div className="text-right">
          <p className={`text-2xl font-semibold tabular-nums ${scoreColor(match.score)}`}>
            {match.score}%
          </p>
          <p className="text-[10px] text-content-muted">compatibilidad</p>
        </div>
        {match.status === 'NEW' ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="brand"
              onClick={() => updateStatus.mutate({ id: match.id, status: 'SENT' })}
              disabled={updateStatus.isPending}
            >
              <Send className="h-3.5 w-3.5" />
              Enviar
            </Button>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Descartar"
              onClick={() => updateStatus.mutate({ id: match.id, status: 'DISCARDED' })}
              disabled={updateStatus.isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Badge className="border-border text-content-secondary">
            {statusLabel[match.status] ?? match.status}
          </Badge>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onRun, running }: { onRun: () => void; running: boolean }): ReactNode {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-surface-raised p-16 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-tint text-brand-deep">
        <Sparkles className="h-6 w-6" />
      </span>
      <div>
        <p className="font-medium text-content">Aún no hay coincidencias</p>
        <p className="mt-1 text-sm text-content-muted">
          Registra compradores con requisitos y propiedades, o recalcula ahora.
        </p>
      </div>
      <Button variant="brand" size="sm" onClick={onRun} disabled={running}>
        <RefreshCw className={`h-4 w-4 ${running ? 'animate-spin' : ''}`} />
        Recalcular coincidencias
      </Button>
    </div>
  );
}
