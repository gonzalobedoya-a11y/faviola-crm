'use client';

import { Building2, ExternalLink, FileText, Trash2, Upload } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';

import { Button } from '@/components/ui/button';
import {
  useAddPropertyMedia,
  useDeletePropertyMedia,
  useProperties,
} from '@/features/properties/api';
import type { Property, PropertyMedia } from '@/features/properties/types';

interface DocumentRow {
  property: Property;
  media: PropertyMedia;
}

export default function DocumentsPage(): ReactNode {
  const { data, isLoading, isError } = useProperties({});
  const [propertyId, setPropertyId] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const addDocument = useAddPropertyMedia(propertyId);
  const remove = useDeletePropertyMedia();

  const documents = useMemo<DocumentRow[]>(
    () =>
      (data?.items ?? []).flatMap((property) =>
        property.media
          .filter((media) => media.type === 'DOC')
          .map((media) => ({ property, media })),
      ),
    [data],
  );

  const submit = async (): Promise<void> => {
    if (!propertyId || !documentUrl.trim()) return;
    setMessage(null);
    try {
      await addDocument.mutateAsync({ url: documentUrl.trim(), type: 'DOC' });
      setDocumentUrl('');
      setMessage('Documento guardado correctamente.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'No se pudo subir el documento.');
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-3xl text-content">Documentos</h1>
        <p className="mt-1 text-sm text-content-muted">
          Centraliza contratos, fichas y archivos asociados a tus propiedades.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-surface-raised p-5 shadow-elevation-1">
        <div className="flex items-center gap-2">
          <Upload className="h-5 w-5 text-brand" />
          <h2 className="font-semibold text-content">Subir documento</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <select
            value={propertyId}
            onChange={(event) => setPropertyId(event.target.value)}
            aria-label="Propiedad del documento"
            className="h-11 rounded-md border border-border bg-surface px-3 text-sm text-content"
          >
            <option value="">Selecciona una propiedad</option>
            {data?.items.map((property) => (
              <option key={property.id} value={property.id}>
                {property.code} · {property.title}
              </option>
            ))}
          </select>
          <input
            type="url"
            value={documentUrl}
            onChange={(event) => setDocumentUrl(event.target.value)}
            placeholder="https://.../contrato.pdf"
            aria-label="URL pública del documento"
            className="h-11 rounded-md border border-border bg-surface px-3 text-sm text-content focus-visible:border-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button
            variant="brand"
            onClick={() => void submit()}
            disabled={!propertyId || !documentUrl.trim() || addDocument.isPending}
          >
            {addDocument.isPending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
        {message && <p className="mt-3 text-sm text-content-secondary">{message}</p>}
        <p className="mt-3 text-xs text-content-muted">
          Usa un enlace público de Google Drive, Dropbox u otro repositorio seguro.
        </p>
        {data && data.items.length === 0 && (
          <p className="mt-3 text-sm text-content-muted">
            Primero crea una propiedad para poder asociarle documentos.
          </p>
        )}
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-surface-raised shadow-elevation-1">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold text-content">Biblioteca</h2>
          <p className="mt-0.5 text-xs text-content-muted">{documents.length} archivos</p>
        </div>
        {isLoading ? (
          <p className="p-10 text-center text-sm text-content-muted">Cargando documentos…</p>
        ) : isError ? (
          <p className="p-10 text-center text-sm text-danger">
            No se pudieron cargar los documentos.
          </p>
        ) : documents.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-12 text-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-tint text-brand-deep">
              <FileText className="h-6 w-6" />
            </span>
            <div>
              <p className="font-medium text-content">Aún no hay documentos</p>
              <p className="mt-1 text-sm text-content-muted">
                Sube el primer archivo desde el formulario.
              </p>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {documents.map(({ property, media }) => (
              <li key={media.id} className="flex items-center gap-4 px-5 py-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-tint text-brand-deep">
                  <FileText className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-content">{fileName(media.url)}</p>
                  <Link
                    href={`/properties/${property.id}`}
                    className="mt-0.5 flex items-center gap-1 truncate text-xs text-content-muted hover:text-brand-deep"
                  >
                    <Building2 className="h-3 w-3" />
                    {property.code} · {property.title}
                  </Link>
                </div>
                <a
                  href={media.url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={`Abrir ${fileName(media.url)}`}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-content-muted hover:bg-surface-sunken hover:text-content"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
                <button
                  type="button"
                  aria-label={`Eliminar ${fileName(media.url)}`}
                  disabled={remove.isPending}
                  onClick={() => {
                    if (window.confirm('¿Eliminar este documento?')) {
                      remove.mutate({ propertyId: property.id, mediaId: media.id });
                    }
                  }}
                  className="flex h-9 w-9 items-center justify-center rounded-md text-content-muted hover:bg-danger/10 hover:text-danger disabled:opacity-50"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function fileName(url: string): string {
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() ?? 'Documento');
  } catch {
    return 'Documento';
  }
}
