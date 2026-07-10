import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { httpClient } from '@/lib/api/http';

import type { LegalDocType, LegalDossier, LegalOverview } from './types';

const legalKeys = {
  all: ['legal'] as const,
  overview: ['legal', 'overview'] as const,
};

export function useLegalOverview() {
  return useQuery({
    queryKey: legalKeys.overview,
    queryFn: () => httpClient.get<LegalOverview>('/legal'),
  });
}

export function useAddLegalDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { propertyId: string; type: LegalDocType; name: string; url: string }) =>
      httpClient.post(`/legal/${input.propertyId}/documents`, {
        type: input.type,
        name: input.name,
        url: input.url,
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: legalKeys.all }),
  });
}

export function useRemoveLegalDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { propertyId: string; docId: string }) =>
      httpClient.delete(`/legal/${input.propertyId}/documents/${input.docId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: legalKeys.all }),
  });
}

export function useUpdateLegal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      propertyId: string;
      patch: Partial<Pick<LegalDossier['legal'], 'contract' | 'cancelled' | 'notes'>> & {
        corretajeExpiry?: string | null;
      };
    }) => httpClient.patch(`/legal/${input.propertyId}`, input.patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: legalKeys.all }),
  });
}

/** Abre un documento en una pestaña nueva (pide el contenido bajo demanda). */
export async function openLegalDocument(propertyId: string, docId: string): Promise<void> {
  const doc = await httpClient.get<{ url: string; name: string }>(
    `/legal/${propertyId}/documents/${docId}`,
  );
  if (doc.url.startsWith('data:')) {
    // Data URI → blob para poder abrirlo en una pestaña con nombre legible.
    const response = await fetch(doc.url);
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    window.open(objectUrl, '_blank', 'noopener');
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } else {
    window.open(doc.url, '_blank', 'noopener,noreferrer');
  }
}

/** Lee un archivo local y lo convierte a data URI (para guardarlo en la BD). */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}
