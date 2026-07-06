'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import { useClients } from '@/features/clients/api';
import {
  type BoardColumn,
  type Deal,
  type DealStage,
  useBoard,
  useCreateDeal,
  useMoveStage,
} from '@/features/deals/api';
import { useProperties } from '@/features/properties/api';
import { formatMoney } from '@/lib/format';

const stageLabel: Record<DealStage, string> = {
  NEW: 'Nuevo',
  CONTACTED: 'Contactado',
  VISIT: 'Visita',
  OFFER: 'Oferta',
  NEGOTIATION: 'Negociación',
  CLOSING: 'Cierre',
  WON: 'Ganado',
  LOST: 'Perdido',
};

const stageAccent: Record<DealStage, string> = {
  NEW: '#a9884e',
  CONTACTED: '#4b7a52',
  VISIT: '#4e5a6e',
  OFFER: '#9b7cb0',
  NEGOTIATION: '#c98fae',
  CLOSING: '#356a5a',
  WON: '#2e7d5b',
  LOST: '#a9432f',
};

export default function PipelinePage(): ReactNode {
  const { data: board, isLoading } = useBoard();
  const moveStage = useMoveStage();
  const [dragId, setDragId] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const handleDrop = (stage: DealStage): void => {
    if (dragId) moveStage.mutate({ id: dragId, stage });
    setDragId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl text-content">Pipeline</h1>
          <p className="mt-1 text-sm text-content-muted">
            Arrastra las negociaciones entre etapas.
          </p>
        </div>
        <Button variant="brand" onClick={() => setShowCreate((v) => !v)}>
          <Plus className="h-4 w-4" />
          Nueva negociación
        </Button>
      </div>

      {showCreate && <CreateDealPanel onClose={() => setShowCreate(false)} />}

      {isLoading ? (
        <p className="py-16 text-center text-sm text-content-muted">Cargando pipeline…</p>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {(board ?? []).map((column) => (
            <BoardColumnView
              key={column.stage}
              column={column}
              onDragStart={setDragId}
              onDrop={handleDrop}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function BoardColumnView({
  column,
  onDragStart,
  onDrop,
}: {
  column: BoardColumn;
  onDragStart: (id: string) => void;
  onDrop: (stage: DealStage) => void;
}): ReactNode {
  return (
    <div
      className="flex w-64 shrink-0 flex-col rounded-xl border border-border bg-surface-sunken"
      onDragOver={(event) => event.preventDefault()}
      onDrop={() => onDrop(column.stage)}
    >
      <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
        <span className="flex items-center gap-2 text-sm font-medium text-content">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: stageAccent[column.stage] }}
          />
          {stageLabel[column.stage]}
          <span className="text-content-muted">{column.count}</span>
        </span>
        <span className="text-xs tabular-nums text-content-muted">
          {formatMoney(column.total, 'PEN')}
        </span>
      </div>
      <div className="flex-1 space-y-2 p-2">
        {column.deals.map((deal) => (
          <DealCard key={deal.id} deal={deal} onDragStart={onDragStart} />
        ))}
        {column.deals.length === 0 && (
          <p className="px-2 py-6 text-center text-xs text-content-muted">Sin negociaciones</p>
        )}
      </div>
    </div>
  );
}

function DealCard({
  deal,
  onDragStart,
}: {
  deal: Deal;
  onDragStart: (id: string) => void;
}): ReactNode {
  return (
    <div
      draggable
      onDragStart={() => onDragStart(deal.id)}
      className="cursor-grab rounded-lg border border-border bg-surface-raised p-3 shadow-elevation-1 active:cursor-grabbing"
    >
      <p className="truncate text-sm font-medium text-content">
        {deal.client.firstName} {deal.client.lastName}
      </p>
      {deal.property && (
        <p className="mt-0.5 truncate text-xs text-content-muted">{deal.property.title}</p>
      )}
      <div className="mt-2 flex items-center justify-between">
        <span className="text-sm font-semibold tabular-nums text-content">
          {formatMoney(deal.value, deal.currency)}
        </span>
        <span className="text-[11px] text-brand-deep">{deal.probability}%</span>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-surface-sunken">
        <span
          className="block h-full rounded-full bg-brand"
          style={{ width: `${deal.probability}%` }}
        />
      </div>
    </div>
  );
}

function CreateDealPanel({ onClose }: { onClose: () => void }): ReactNode {
  const { data: clients } = useClients({ type: 'BUYER' });
  const { data: properties } = useProperties({});
  const createDeal = useCreateDeal();
  const [clientId, setClientId] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [value, setValue] = useState('');

  const submit = async (): Promise<void> => {
    if (!clientId) return;
    await createDeal.mutateAsync({
      clientId,
      propertyId: propertyId || undefined,
      value: value ? Number(value) : undefined,
      currency: 'PEN',
      stage: 'NEW',
    });
    onClose();
  };

  const field =
    'h-10 w-full rounded-md border border-border bg-surface-raised px-3 text-sm text-content focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

  return (
    <div className="grid gap-3 rounded-xl border border-border bg-surface-raised p-4 shadow-elevation-1 sm:grid-cols-4">
      <select className={field} value={clientId} onChange={(e) => setClientId(e.target.value)}>
        <option value="">Comprador…</option>
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
        className={field}
        inputMode="numeric"
        placeholder="Valor (S/)"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <div className="flex gap-2">
        <Button
          variant="brand"
          className="flex-1"
          onClick={() => void submit()}
          disabled={!clientId || createDeal.isPending}
        >
          Crear
        </Button>
        <Button variant="ghost" onClick={onClose}>
          Cancelar
        </Button>
      </div>
      {clients && clients.items.length === 0 && (
        <p className="text-xs text-content-muted sm:col-span-4">
          Primero registra un comprador en{' '}
          <Link href="/clients/new" className="text-brand-deep hover:underline">
            Clientes
          </Link>
          .
        </p>
      )}
    </div>
  );
}
