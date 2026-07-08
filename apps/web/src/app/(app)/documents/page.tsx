'use client';

import {
  Building2,
  CheckCircle2,
  ExternalLink,
  FileText,
  ShieldCheck,
  Trash2,
  Upload,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  useAddPropertyMedia,
  useDeletePropertyMedia,
  useProperties,
  useUploadPropertyDocument,
} from '@/features/properties/api';
import type { Property, PropertyMedia } from '@/features/properties/types';

const requiredDocs = [
  'DNI propietario',
  'Partida registral',
  'HR / PU',
  'Contrato',
  'Ficha tecnica',
];

interface PropertyDossier {
  property: Property;
  docs: PropertyMedia[];
}

function docName(url: string): string {
  try {
    const parsed = new URL(url);
    const label = new URLSearchParams(parsed.hash.replace(/^#/, '')).get('tipo');
    return label ?? decodeURIComponent(parsed.pathname.split('/').pop() ?? 'Documento');
  } catch {
    return 'Documento';
  }
}

function cleanUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = '';
    return parsed.toString();
  } catch {
    return url;
  }
}

function completion(docs: PropertyMedia[]): number {
  const labels = docs.map((doc) => docName(doc.url).toLowerCase());
  const present = requiredDocs.filter((doc) =>
    labels.some((label) => label.includes(doc.toLowerCase().slice(0, 5))),
  ).length;
  return Math.min(100, Math.round((present / requiredDocs.length) * 100));
}

export default function DocumentsPage(): ReactNode {
  const { data, isLoading, isError } = useProperties({});
  const [propertyId, setPropertyId] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docLabel, setDocLabel] = useState('DNI propietario');
  const [message, setMessage] = useState<string | null>(null);
  const addDocument = useAddPropertyMedia(propertyId);
  const uploadDocument = useUploadPropertyDocument(propertyId);
  const remove = useDeletePropertyMedia();

  const dossiers = useMemo<PropertyDossier[]>(
    () =>
      (data?.items ?? []).map((property) => ({
        property,
        docs: property.media.filter((media) => media.type === 'DOC'),
      })),
    [data],
  );
  const documents = dossiers.flatMap((dossier) =>
    dossier.docs.map((media) => ({ property: dossier.property, media })),
  );
  const completeDossiers = dossiers.filter((dossier) => completion(dossier.docs) >= 80).length;

  const submit = async (): Promise<void> => {
    if (!propertyId || (!selectedFile && !documentUrl.trim())) return;
    setMessage(null);
    try {
      if (selectedFile) {
        await uploadDocument.mutateAsync({ file: selectedFile, label: docLabel });
        setSelectedFile(null);
      } else {
        const separator = documentUrl.includes('#') ? '&' : '#';
        const urlWithLabel = `${documentUrl.trim()}${separator}tipo=${encodeURIComponent(docLabel)}`;
        await addDocument.mutateAsync({ url: urlWithLabel, type: 'DOC' });
      }
      setDocumentUrl('');
      setMessage('Documento guardado correctamente.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo guardar el documento.');
    }
  };

  return (
    <div className="w-full max-w-7xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-content">Expedientes y documentos</h1>
        <p className="mt-1 text-sm text-content-muted">
          Controla documentos clave por propiedad antes de negociar o cerrar.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Propiedades" value={dossiers.length} />
        <Metric label="Documentos" value={documents.length} />
        <Metric label="Expedientes avanzados" value={completeDossiers} />
      </div>

      <section className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-brand" />
          <div>
            <h2 className="font-semibold text-content">Agregar documento</h2>
            <p className="mt-0.5 text-xs text-content-muted">
              Adjunta PDF, Word, imagen o pega una URL publica del expediente.
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_0.8fr_1fr]">
          <select
            value={propertyId}
            onChange={(event) => setPropertyId(event.target.value)}
            aria-label="Propiedad del documento"
            className="h-11 rounded-md border border-border bg-surface px-3 text-sm text-content"
          >
            <option value="">Selecciona una propiedad</option>
            {data?.items.map((property) => (
              <option key={property.id} value={property.id}>
                {property.code} - {property.title}
              </option>
            ))}
          </select>
          <select
            value={docLabel}
            onChange={(event) => setDocLabel(event.target.value)}
            aria-label="Tipo de documento"
            className="h-11 rounded-md border border-border bg-surface px-3 text-sm text-content"
          >
            {requiredDocs.map((doc) => (
              <option key={doc} value={doc}>
                {doc}
              </option>
            ))}
          </select>
          <input
            type="url"
            value={documentUrl}
            onChange={(event) => setDocumentUrl(event.target.value)}
            placeholder="URL alternativa: https://.../documento.pdf"
            aria-label="URL publica del documento"
            disabled={Boolean(selectedFile)}
            className="h-11 rounded-md border border-border bg-surface px-3 text-sm text-content focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
          />
        </div>

        <div className="mt-3 grid gap-3 lg:grid-cols-[1fr_auto]">
          <label className="flex min-h-20 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-surface-sunken px-4 py-3 text-center transition hover:border-brand">
            <Upload className="h-5 w-5 text-brand-deep" />
            <span className="mt-1 text-sm font-medium text-content">
              {selectedFile ? selectedFile.name : 'Seleccionar documento del equipo'}
            </span>
            <span className="mt-0.5 text-xs text-content-muted">PDF, Word, JPG o PNG</span>
            <input
              type="file"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setSelectedFile(file);
                if (file) setDocumentUrl('');
              }}
            />
          </label>
          <Button
            variant="brand"
            onClick={() => void submit()}
            disabled={
              !propertyId ||
              (!selectedFile && !documentUrl.trim()) ||
              addDocument.isPending ||
              uploadDocument.isPending
            }
            className="min-h-20"
          >
            {addDocument.isPending || uploadDocument.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
        {message && <p className="mt-3 text-sm text-content-secondary">{message}</p>}
      </section>

      {isLoading ? (
        <p className="py-16 text-center text-sm text-content-muted">Cargando expedientes...</p>
      ) : isError ? (
        <p className="py-16 text-center text-sm text-danger">
          No se pudieron cargar los documentos.
        </p>
      ) : dossiers.length === 0 ? (
        <div className="rounded-xl border border-border bg-surface-raised p-12 text-center">
          <FileText className="mx-auto h-8 w-8 text-content-muted" />
          <p className="mt-3 font-medium text-content">Aun no hay propiedades</p>
          <p className="mt-1 text-sm text-content-muted">
            Crea una propiedad para armar su expediente.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {dossiers.map((dossier) => (
            <DossierCard
              key={dossier.property.id}
              dossier={dossier}
              onDelete={(mediaId) => remove.mutate({ propertyId: dossier.property.id, mediaId })}
              deleting={remove.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }): ReactNode {
  return (
    <div className="rounded-xl border border-border bg-surface-raised p-4 shadow-elevation-1">
      <p className="font-display text-3xl text-content">{value}</p>
      <p className="text-xs font-medium uppercase tracking-[0.16em] text-content-muted">{label}</p>
    </div>
  );
}

function DossierCard({
  dossier,
  onDelete,
  deleting,
}: {
  dossier: PropertyDossier;
  onDelete: (mediaId: string) => void;
  deleting: boolean;
}): ReactNode {
  const pct = completion(dossier.docs);
  const labels = dossier.docs.map((doc) => docName(doc.url).toLowerCase());

  return (
    <article className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href={`/properties/${dossier.property.id}`}
            className="flex items-center gap-2 font-semibold text-content hover:text-brand-deep"
          >
            <Building2 className="h-4 w-4" />
            <span className="truncate">{dossier.property.title}</span>
          </Link>
          <p className="mt-1 text-xs text-content-muted">
            {dossier.property.code} - {dossier.docs.length} documento
            {dossier.docs.length === 1 ? '' : 's'}
          </p>
        </div>
        <div className="text-right">
          <p className="font-semibold text-content">{pct}%</p>
          <p className="text-xs text-content-muted">completo</p>
        </div>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-sunken">
        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {requiredDocs.map((doc) => {
          const present = labels.some((label) => label.includes(doc.toLowerCase().slice(0, 5)));
          return (
            <div key={doc} className="flex items-center gap-2 text-xs text-content-muted">
              {present ? (
                <CheckCircle2 className="h-4 w-4 text-success" />
              ) : (
                <ShieldCheck className="h-4 w-4 text-content-muted" />
              )}
              {doc}
            </div>
          );
        })}
      </div>

      {dossier.docs.length > 0 && (
        <ul className="mt-4 divide-y divide-border rounded-lg border border-border">
          {dossier.docs.map((media) => (
            <li key={media.id} className="flex items-center gap-3 px-3 py-2">
              <FileText className="h-4 w-4 shrink-0 text-brand-deep" />
              <span className="min-w-0 flex-1 truncate text-sm text-content">
                {docName(media.url)}
              </span>
              <a
                href={cleanUrl(media.url)}
                target="_blank"
                rel="noreferrer"
                className="text-content-muted hover:text-content"
                aria-label="Abrir documento"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  if (window.confirm('¿Eliminar este documento?')) onDelete(media.id);
                }}
                className="text-content-muted hover:text-danger disabled:opacity-50"
                aria-label="Eliminar documento"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
