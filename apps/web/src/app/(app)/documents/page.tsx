'use client';

import {
  AlertTriangle,
  Calendar,
  Check,
  Eye,
  FileCheck2,
  FileText,
  Loader2,
  Minus,
  ShieldCheck,
  Trash2,
  Upload,
  X,
  Search as SearchIcon,
} from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  fileToDataUrl,
  openLegalDocument,
  useAddLegalDocument,
  useLegalOverview,
  useRemoveLegalDocument,
  useUpdateLegal,
} from '@/features/legal/api';
import type { DossierStatus, LegalDocType, LegalDossier } from '@/features/legal/types';

const DOC_TYPES: { key: LegalDocType; label: string }[] = [
  { key: 'TITULO_DOMINIO', label: 'Título dominio' },
  { key: 'PARTIDA', label: 'Partida' },
  { key: 'DNI', label: 'DNI' },
  { key: 'ESTUDIO_TITULO', label: 'Estudio título' },
  { key: 'CORRETAJE', label: 'Corretaje' },
  { key: 'OTROS', label: 'Otros' },
];

const STATUS_FILTERS: { key: DossierStatus; label: string }[] = [
  { key: 'PENDIENTE', label: 'Pendientes' },
  { key: 'EN_PROCESO', label: 'En proceso' },
  { key: 'COMPLETADO', label: 'Completados' },
  { key: 'CANCELADO', label: 'Cancelados' },
];

const MAX_FILE_BYTES = 8_500_000; // ~8.5MB (12M chars en base64)

function formatDate(iso?: string | null): string {
  if (!iso) return 'Sin fecha';
  return new Date(iso).toLocaleDateString('es-PE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function corretajeAlert(iso?: string | null): { label: string; className: string } | null {
  if (!iso) return null;
  const days = Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
  if (days < 0) return { label: 'Vencido', className: 'bg-danger/10 text-danger' };
  if (days <= 30) return { label: `Vence en ${days} d`, className: 'bg-warning/15 text-warning' };
  return null;
}

export default function DocumentsPage(): ReactNode {
  const { data, isLoading, isError } = useLegalOverview();
  const [tab, setTab] = useState<'EXCLUSIVAS' | 'TODAS'>('EXCLUSIVAS');
  const [statusFilter, setStatusFilter] = useState<DossierStatus>('PENDIENTE');
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const items = useMemo(() => {
    const all = data?.items ?? [];
    const byTab = tab === 'EXCLUSIVAS' ? all.filter((i) => i.legal.contract === 'EXCLUSIVO') : all;
    const byStatus = byTab.filter((i) => i.status === statusFilter);
    const q = query.trim().toLowerCase();
    if (!q) return byStatus;
    return byStatus.filter(
      (i) =>
        i.property.code.toLowerCase().includes(q) || i.property.title.toLowerCase().includes(q),
    );
  }, [data, tab, statusFilter, query]);

  const countFor = (status: DossierStatus): number => {
    const all = data?.items ?? [];
    const byTab = tab === 'EXCLUSIVAS' ? all.filter((i) => i.legal.contract === 'EXCLUSIVO') : all;
    return byTab.filter((i) => i.status === status).length;
  };

  return (
    <div className="w-full max-w-7xl space-y-5">
      {/* Cabecera + buscador */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl text-content">Documentos por propiedad</h1>
          <p className="mt-1 text-sm text-content-muted">
            Revisa y gestiona los archivos legales asociados a cada inmueble.
          </p>
        </div>
        <div className="relative w-full max-w-sm">
          <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-content-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código o título de propiedad…"
            className="h-10 w-full rounded-full border border-border bg-surface-raised pl-9 pr-4 text-sm text-content placeholder:text-content-muted focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border">
        <TabButton
          active={tab === 'EXCLUSIVAS'}
          onClick={() => setTab('EXCLUSIVAS')}
          badge={data?.exclusiveCount}
        >
          Exclusivas
        </TabButton>
        <TabButton active={tab === 'TODAS'} onClick={() => setTab('TODAS')}>
          Todas las propiedades
        </TabButton>
      </div>

      {/* Filtros de estado */}
      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => {
          const active = statusFilter === f.key;
          const count = countFor(f.key);
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? 'bg-brand text-on-brand'
                  : 'bg-surface-raised text-content-secondary shadow-elevation-1 hover:bg-brand-tint hover:text-brand-deep'
              }`}
            >
              {f.label}
              {count > 0 && (
                <span
                  className={`flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-semibold ${
                    active ? 'bg-white/25 text-on-brand' : 'bg-brand-tint text-brand-deep'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-xl border border-border bg-surface-raised shadow-elevation-1">
        <table className="w-full min-w-[64rem] border-collapse text-left">
          <thead>
            <tr className="border-b border-border bg-surface-sunken/60 text-[11px] font-semibold uppercase tracking-wide text-content-muted">
              <th className="px-4 py-3">Acciones</th>
              <th className="px-4 py-3">Dirección</th>
              {DOC_TYPES.map((d) => (
                <th key={d.key} className="px-3 py-3 text-center">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-sm text-content-muted">
                  Cargando expedientes…
                </td>
              </tr>
            ) : isError ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center text-sm text-danger">
                  No se pudieron cargar los expedientes.
                </td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-4 py-16 text-center">
                  <FileText className="mx-auto h-8 w-8 text-content-muted" />
                  <p className="mt-2 text-sm text-content-muted">
                    No hay expedientes en este estado.
                  </p>
                </td>
              </tr>
            ) : (
              items.map((item, index) => (
                <DossierRow
                  key={item.property.id}
                  item={item}
                  zebra={index % 2 === 1}
                  expanded={expandedId === item.property.id}
                  onToggle={() =>
                    setExpandedId((id) => (id === item.property.id ? null : item.property.id))
                  }
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  badge,
  children,
}: {
  active: boolean;
  onClick: () => void;
  badge?: number;
  children: ReactNode;
}): ReactNode {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative -mb-px inline-flex items-center gap-2 border-b-2 pb-2.5 text-sm font-semibold transition-colors ${
        active
          ? 'border-brand text-content'
          : 'border-transparent text-content-muted hover:text-content'
      }`}
    >
      {children}
      {badge !== undefined && badge > 0 && (
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-on-brand">
          {badge}
        </span>
      )}
    </button>
  );
}

function DossierRow({
  item,
  zebra,
  expanded,
  onToggle,
}: {
  item: LegalDossier;
  zebra: boolean;
  expanded: boolean;
  onToggle: () => void;
}): ReactNode {
  const byType = new Map<LegalDocType, typeof item.documents>();
  for (const doc of item.documents) {
    byType.set(doc.type, [...(byType.get(doc.type) ?? []), doc]);
  }
  const alert = corretajeAlert(item.legal.corretajeExpiry);
  const estudio = byType.has('ESTUDIO_TITULO');

  return (
    <>
      <tr className={`border-b border-border align-top ${zebra ? 'bg-surface-sunken/40' : ''}`}>
        {/* Acciones */}
        <td className="px-4 py-4">
          <div className="flex flex-col items-start gap-2">
            <Button variant="brand" size="sm" onClick={onToggle}>
              <Upload className="h-4 w-4" />
              Subir
            </Button>
            <button
              type="button"
              onClick={onToggle}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-deep hover:underline"
            >
              <Eye className="h-4 w-4" />
              Detalles
            </button>
          </div>
        </td>

        {/* Dirección */}
        <td className="max-w-xs px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-surface-sunken px-2.5 py-0.5 text-[11px] font-medium text-content-secondary">
              {item.property.propertyType ?? 'Inmueble'}
            </span>
            <span className="text-[11px] font-semibold uppercase text-content-muted">
              COD: <span className="font-mono text-brand-deep">{item.property.code}</span>
            </span>
          </div>
          <p className="mt-1.5 text-sm font-semibold text-content">
            {item.property.address || item.property.title}
            {item.property.district ? `, ${item.property.district}` : ''}
          </p>
          <div className="mt-2 space-y-1 text-xs text-content-muted">
            <p className="flex items-center gap-1.5">
              <FileCheck2 className="h-3.5 w-3.5" />
              Est. Título:{' '}
              <span className={estudio ? 'font-medium text-success' : 'italic'}>
                {estudio ? 'Subido' : 'No subido'}
              </span>
            </p>
            <p className="flex flex-wrap items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              Venc. corretaje:{' '}
              <span className={item.legal.corretajeExpiry ? '' : 'italic'}>
                {formatDate(item.legal.corretajeExpiry)}
              </span>
              {alert && (
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${alert.className}`}
                >
                  <AlertTriangle className="h-3 w-3" />
                  {alert.label}
                </span>
              )}
            </p>
            <p className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" />
              Contrato:{' '}
              <span className="font-medium text-success">
                {item.legal.contract === 'EXCLUSIVO' ? 'Exclusivo' : 'No exclusivo'}
              </span>
            </p>
          </div>
        </td>

        {/* Estado por tipo de documento */}
        {DOC_TYPES.map((d) => {
          const docs = byType.get(d.key) ?? [];
          const has = docs.length > 0;
          return (
            <td key={d.key} className="px-3 py-4 text-center align-middle">
              {has ? (
                <button
                  type="button"
                  title={`${docs.length} archivo${docs.length === 1 ? '' : 's'} — clic para abrir`}
                  onClick={() => void openLegalDocument(item.property.id, docs[0]?.id ?? '')}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-success/15 text-success transition hover:bg-success/25"
                >
                  <Check className="h-4 w-4" />
                </button>
              ) : (
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-surface-sunken text-content-muted">
                  <Minus className="h-4 w-4" />
                </span>
              )}
            </td>
          );
        })}
      </tr>

      {expanded && (
        <tr className="border-b border-border bg-brand-tint/30">
          <td colSpan={8} className="px-4 py-5">
            <DossierPanel item={item} onClose={onToggle} />
          </td>
        </tr>
      )}
    </>
  );
}

function DossierPanel({ item, onClose }: { item: LegalDossier; onClose: () => void }): ReactNode {
  const addDocument = useAddLegalDocument();
  const removeDocument = useRemoveLegalDocument();
  const updateLegal = useUpdateLegal();

  const [docType, setDocType] = useState<LegalDocType>('TITULO_DOMINIO');
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const propertyId = item.property.id;

  const upload = async (): Promise<void> => {
    if (!file) return;
    setMessage(null);
    if (file.size > MAX_FILE_BYTES) {
      setMessage('El archivo supera el máximo de 8.5MB.');
      return;
    }
    try {
      const url = await fileToDataUrl(file);
      await addDocument.mutateAsync({ propertyId, type: docType, name: file.name, url });
      setFile(null);
      setMessage('✓ Documento subido correctamente.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo subir el documento.');
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Subir documento */}
      <div>
        <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-content">
          <Upload className="h-4 w-4 text-brand-deep" />
          Subir documento
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <label className="block">
            <span className="text-xs font-medium text-content-secondary">Tipo</span>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as LegalDocType)}
              className="mt-1 block h-10 rounded-lg border border-border bg-surface px-3 text-sm text-content focus-visible:border-brand focus-visible:outline-none"
            >
              {DOC_TYPES.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
          </label>
          <label className="flex h-10 min-w-56 flex-1 cursor-pointer items-center gap-2 rounded-lg border border-dashed border-border-strong bg-surface px-3 text-sm text-content-secondary transition hover:border-brand">
            <FileText className="h-4 w-4 shrink-0 text-brand-deep" />
            <span className="truncate">
              {file ? file.name : 'Elegir archivo (PDF, imagen o Word)…'}
            </span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
              className="sr-only"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
          </label>
          <Button
            variant="brand"
            onClick={() => void upload()}
            disabled={!file || addDocument.isPending}
          >
            {addDocument.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Guardar'}
          </Button>
        </div>
        {message && <p className="mt-2 text-xs text-content-secondary">{message}</p>}

        {/* Archivos subidos */}
        {item.documents.length > 0 && (
          <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-surface-raised">
            {item.documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-3 px-3 py-2">
                <FileText className="h-4 w-4 shrink-0 text-brand-deep" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm text-content">{doc.name}</p>
                  <p className="text-[11px] text-content-muted">
                    {DOC_TYPES.find((d) => d.key === doc.type)?.label} · {formatDate(doc.createdAt)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void openLegalDocument(propertyId, doc.id)}
                  className="text-content-muted transition hover:text-brand-deep"
                  aria-label="Abrir documento"
                >
                  <Eye className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('¿Eliminar este documento?')) {
                      removeDocument.mutate({ propertyId, docId: doc.id });
                    }
                  }}
                  disabled={removeDocument.isPending}
                  className="text-content-muted transition hover:text-danger disabled:opacity-50"
                  aria-label="Eliminar documento"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Datos del expediente */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="flex items-center gap-2 text-sm font-semibold text-content">
            <ShieldCheck className="h-4 w-4 text-brand-deep" />
            Datos del expediente
          </p>
          <button
            type="button"
            onClick={onClose}
            className="text-content-muted hover:text-content"
            aria-label="Cerrar panel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-medium text-content-secondary">Contrato</span>
            <select
              value={item.legal.contract}
              onChange={(e) =>
                void updateLegal.mutateAsync({
                  propertyId,
                  patch: { contract: e.target.value as 'EXCLUSIVO' | 'NO_EXCLUSIVO' },
                })
              }
              className="mt-1 block h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-content focus-visible:border-brand focus-visible:outline-none"
            >
              <option value="EXCLUSIVO">Exclusivo</option>
              <option value="NO_EXCLUSIVO">No exclusivo</option>
            </select>
          </label>
          <label className="block">
            <span className="text-xs font-medium text-content-secondary">
              Vencimiento de corretaje
            </span>
            <input
              type="date"
              value={item.legal.corretajeExpiry ? item.legal.corretajeExpiry.slice(0, 10) : ''}
              onChange={(e) =>
                void updateLegal.mutateAsync({
                  propertyId,
                  patch: { corretajeExpiry: e.target.value || null },
                })
              }
              className="mt-1 block h-10 w-full rounded-lg border border-border bg-surface px-3 text-sm text-content focus-visible:border-brand focus-visible:outline-none"
            />
          </label>
        </div>
        <label className="mt-3 block">
          <span className="text-xs font-medium text-content-secondary">Notas del expediente</span>
          <textarea
            defaultValue={item.legal.notes ?? ''}
            rows={2}
            onBlur={(e) =>
              void updateLegal.mutateAsync({
                propertyId,
                patch: { notes: e.target.value.trim() || null },
              })
            }
            placeholder="Observaciones legales, pendientes con el propietario…"
            className="mt-1 w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-content placeholder:text-content-muted focus-visible:border-brand focus-visible:outline-none"
          />
        </label>
        <div className="mt-3">
          {item.legal.cancelled ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() =>
                void updateLegal.mutateAsync({ propertyId, patch: { cancelled: false } })
              }
              disabled={updateLegal.isPending}
            >
              Reactivar expediente
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="sm"
              className="text-danger"
              onClick={() => {
                if (window.confirm('¿Marcar este expediente como cancelado?')) {
                  void updateLegal.mutateAsync({ propertyId, patch: { cancelled: true } });
                }
              }}
              disabled={updateLegal.isPending}
            >
              Cancelar expediente
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
