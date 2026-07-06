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
