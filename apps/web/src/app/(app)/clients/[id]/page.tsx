'use client';

import { ArrowLeft, Mail, Phone, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, type ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAddActivity, useClient, useUpsertRequirement } from '@/features/clients/api';
import {
  formatMoney,
  temperatureClass,
  temperatureLabel,
  typeLabel,
} from '@/features/clients/labels';
import type { ClientRequirement } from '@/features/clients/types';

export default function ClientDetailPage(): ReactNode {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { data: client, isLoading, isError } = useClient(id);
  const addActivity = useAddActivity(id);
  const [note, setNote] = useState('');
  const [editingRequirement, setEditingRequirement] = useState(false);

  if (isLoading) {
    return <p className="p-8 text-sm text-content-muted">Cargando…</p>;
  }
  if (isError || !client) {
    return <p className="p-8 text-sm text-danger">No se encontró el cliente.</p>;
  }

  const submitNote = async (): Promise<void> => {
    const message = note.trim();
    if (!message) return;
    await addActivity.mutateAsync({ type: 'NOTE', message });
    setNote('');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-1 text-sm text-content-secondary hover:text-content"
      >
        <ArrowLeft className="h-4 w-4" />
        Clientes
      </Link>

      {/* Cabecera */}
      <div className="flex items-start gap-4 rounded-xl border border-border bg-surface-raised p-6 shadow-elevation-1">
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-brand text-lg font-medium uppercase text-brand-foreground">
          {client.firstName[0]}
          {client.lastName[0]}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl text-content">
              {client.firstName} {client.lastName}
            </h1>
            <Badge className="border-border text-content-secondary">{typeLabel[client.type]}</Badge>
            <Badge className={temperatureClass[client.temperature]}>
              {temperatureLabel[client.temperature]}
            </Badge>
          </div>
          <div className="mt-2 flex flex-wrap gap-4 text-sm text-content-secondary">
            {client.phone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-4 w-4 text-content-muted" />
                {client.phone}
              </span>
            )}
            {client.email && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-4 w-4 text-content-muted" />
                {client.email}
              </span>
            )}
            {client.source && <span className="text-content-muted">Origen: {client.source}</span>}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Requisitos */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-content">Requisitos</h2>
            <button
              type="button"
              onClick={() => setEditingRequirement((value) => !value)}
              className="inline-flex items-center gap-1 text-xs font-medium text-brand-deep hover:underline"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              {client.requirement ? 'Editar' : 'Agregar'}
            </button>
          </div>
          {editingRequirement ? (
            <RequirementEditor
              clientId={id}
              current={client.requirement ?? undefined}
              onDone={() => setEditingRequirement(false)}
            />
          ) : client.requirement ? (
            <RequirementCard requirement={client.requirement} />
          ) : (
            <div className="rounded-xl border border-dashed border-border bg-surface-raised p-5 text-sm text-content-muted">
              Sin requisitos registrados.
            </div>
          )}
          {client.notes && (
            <div className="mt-4 rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
              <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-content-muted">
                Notas
              </h3>
              <p className="text-sm text-content-secondary">{client.notes}</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="lg:col-span-3">
          <h2 className="mb-3 text-sm font-semibold text-content">Actividad</h2>
          <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
            <div className="flex gap-2">
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void submitNote();
                }}
                placeholder="Agregar una nota…"
                className="h-10 flex-1 rounded-md border border-border bg-surface px-3 text-sm text-content placeholder:text-content-muted focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <Button
                variant="brand"
                onClick={() => void submitNote()}
                disabled={addActivity.isPending || note.trim().length === 0}
              >
                Agregar
              </Button>
            </div>

            <ol className="mt-5 space-y-4">
              {client.activities.map((activity) => (
                <li key={activity.id} className="flex gap-3">
                  <span
                    className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand"
                    aria-hidden="true"
                  />
                  <div className="min-w-0">
                    <p className="text-sm text-content">{activity.message}</p>
                    <p className="text-[11px] text-content-muted">
                      {new Date(activity.createdAt).toLocaleString('es-PE')}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function RequirementEditor({
  clientId,
  current,
  onDone,
}: {
  clientId: string;
  current?: ClientRequirement;
  onDone: () => void;
}): ReactNode {
  const save = useUpsertRequirement(clientId);
  const [operation, setOperation] = useState<'SALE' | 'RENT'>(current?.operation ?? 'SALE');
  const [propertyType, setPropertyType] = useState(current?.propertyType ?? '');
  const [budgetMin, setBudgetMin] = useState(current?.budgetMin?.toString() ?? '');
  const [budgetMax, setBudgetMax] = useState(current?.budgetMax?.toString() ?? '');
  const [bedroomsMin, setBedroomsMin] = useState(current?.bedroomsMin?.toString() ?? '');
  const [areaMin, setAreaMin] = useState(current?.areaMin?.toString() ?? '');
  const [zones, setZones] = useState(current?.zones.join(', ') ?? '');
  const field =
    'h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-content focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';
  const optionalNumber = (value: string): number | undefined =>
    value.trim() ? Number(value) : undefined;

  const submit = async (): Promise<void> => {
    await save.mutateAsync({
      operation,
      propertyType: propertyType || undefined,
      budgetMin: optionalNumber(budgetMin),
      budgetMax: optionalNumber(budgetMax),
      currency: current?.currency ?? 'PEN',
      bedroomsMin: optionalNumber(bedroomsMin),
      bathroomsMin: current?.bathroomsMin ?? undefined,
      areaMin: optionalNumber(areaMin),
      zones: zones
        .split(',')
        .map((zone) => zone.trim())
        .filter(Boolean),
      notes: current?.notes ?? undefined,
    });
    onDone();
  };

  return (
    <div className="space-y-3 rounded-xl border border-border bg-surface-raised p-4 shadow-elevation-1">
      <select
        className={field}
        value={operation}
        onChange={(event) => setOperation(event.target.value as 'SALE' | 'RENT')}
      >
        <option value="SALE">Compra</option>
        <option value="RENT">Alquiler</option>
      </select>
      <input
        className={field}
        value={propertyType}
        onChange={(event) => setPropertyType(event.target.value)}
        placeholder="Tipo de propiedad"
      />
      <div className="grid grid-cols-2 gap-2">
        <input
          className={field}
          type="number"
          min="0"
          value={budgetMin}
          onChange={(event) => setBudgetMin(event.target.value)}
          placeholder="Presupuesto mín."
        />
        <input
          className={field}
          type="number"
          min="0"
          value={budgetMax}
          onChange={(event) => setBudgetMax(event.target.value)}
          placeholder="Presupuesto máx."
        />
        <input
          className={field}
          type="number"
          min="0"
          value={bedroomsMin}
          onChange={(event) => setBedroomsMin(event.target.value)}
          placeholder="Dormitorios"
        />
        <input
          className={field}
          type="number"
          min="0"
          value={areaMin}
          onChange={(event) => setAreaMin(event.target.value)}
          placeholder="Área m²"
        />
      </div>
      <input
        className={field}
        value={zones}
        onChange={(event) => setZones(event.target.value)}
        placeholder="Zonas separadas por comas"
      />
      <div className="flex gap-2">
        <Button variant="brand" size="sm" onClick={() => void submit()} disabled={save.isPending}>
          {save.isPending ? 'Guardando…' : 'Guardar'}
        </Button>
        <Button variant="ghost" size="sm" onClick={onDone}>
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function RequirementCard({ requirement }: { requirement: ClientRequirement }): ReactNode {
  const chips = [
    requirement.operation === 'RENT' ? 'Alquiler' : 'Venta',
    requirement.propertyType,
    requirement.bedroomsMin ? `${requirement.bedroomsMin}+ dorm.` : null,
    requirement.bathroomsMin ? `${requirement.bathroomsMin}+ baños` : null,
    requirement.areaMin ? `${requirement.areaMin}+ m²` : null,
    ...requirement.zones,
  ].filter((chip): chip is string => Boolean(chip));

  return (
    <div className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
      <p className="text-sm text-content-secondary">
        Presupuesto: {formatMoney(requirement.budgetMin, requirement.currency)} —{' '}
        {formatMoney(requirement.budgetMax, requirement.currency)}
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <span
            key={chip}
            className="rounded-full bg-brand-tint px-2.5 py-0.5 text-[11px] font-medium text-brand-deep"
          >
            {chip}
          </span>
        ))}
      </div>
    </div>
  );
}
