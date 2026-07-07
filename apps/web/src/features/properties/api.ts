import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { httpClient } from '@/lib/api/http';

import type {
  CreatePropertyInput,
  Paginated,
  Property,
  PropertyDetail,
  PropertyFilters,
} from './types';

const propertyKeys = {
  all: ['properties'] as const,
  list: (filters: PropertyFilters) => ['properties', 'list', filters] as const,
  detail: (id: string) => ['properties', 'detail', id] as const,
};

function buildQuery(filters: PropertyFilters): string {
  const params = new URLSearchParams();
  if (filters.operation) params.set('operation', filters.operation);
  if (filters.status) params.set('status', filters.status);
  if (filters.q) params.set('q', filters.q);
  if (filters.page) params.set('page', String(filters.page));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useProperties(filters: PropertyFilters) {
  return useQuery({
    queryKey: propertyKeys.list(filters),
    queryFn: () => httpClient.get<Paginated<Property>>(`/properties${buildQuery(filters)}`),
    enabled: filters.q === undefined || filters.q.trim().length >= 2,
  });
}

export function useProperty(id: string) {
  return useQuery({
    queryKey: propertyKeys.detail(id),
    queryFn: () => httpClient.get<PropertyDetail>(`/properties/${id}`),
  });
}

export function useCreateProperty() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreatePropertyInput) => httpClient.post<Property>('/properties', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: propertyKeys.all }),
  });
}

interface PresignedUpload {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

/** Sube una foto a MinIO: presign → PUT directo → registra el media. */
export function useUploadPropertyPhoto(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const contentType = file.type || 'application/octet-stream';
      const presign = await httpClient.post<PresignedUpload>(
        `/properties/${propertyId}/media/upload-url`,
        { filename: file.name, contentType },
      );
      const put = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file,
      });
      if (!put.ok) throw new Error('Falló la subida a MinIO');
      await httpClient.post(`/properties/${propertyId}/media`, { url: presign.fileUrl });
      return presign.fileUrl;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: propertyKeys.detail(propertyId) }),
  });
}

/** Sube un documento y lo asocia a una propiedad. */
export function useUploadPropertyDocument(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const contentType = file.type || 'application/octet-stream';
      const presign = await httpClient.post<PresignedUpload>(
        `/properties/${propertyId}/media/upload-url`,
        { filename: file.name, contentType },
      );
      const put = await fetch(presign.uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': contentType },
        body: file,
      });
      if (!put.ok) throw new Error('No se pudo subir el documento');
      await httpClient.post(`/properties/${propertyId}/media`, {
        url: presign.fileUrl,
        type: 'DOC',
      });
      return presign.fileUrl;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: propertyKeys.all }),
  });
}

export function useDeletePropertyMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ propertyId, mediaId }: { propertyId: string; mediaId: string }) =>
      httpClient.delete<void>(`/properties/${propertyId}/media/${mediaId}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: propertyKeys.all }),
  });
}

export function useSetPropertyCover(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mediaId: string) =>
      httpClient.put(`/properties/${propertyId}/media/${mediaId}/cover`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: propertyKeys.all }),
  });
}

export function useReorderPropertyMedia(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mediaIds: string[]) =>
      httpClient.patch<PropertyDetail>(`/properties/${propertyId}/media/order`, { mediaIds }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: propertyKeys.all }),
  });
}

export function useAddPropertyMedia(propertyId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { url: string; type: 'IMAGE' | 'DOC' | 'VIDEO'; isCover?: boolean }) =>
      httpClient.post(`/properties/${propertyId}/media`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: propertyKeys.all }),
  });
}
