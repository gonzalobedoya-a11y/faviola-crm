import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { httpClient } from '@/lib/api/http';

import type {
  Activity,
  Client,
  ClientDetail,
  ClientFilters,
  CreateClientInput,
  Paginated,
} from './types';

const clientKeys = {
  all: ['clients'] as const,
  list: (filters: ClientFilters) => ['clients', 'list', filters] as const,
  detail: (id: string) => ['clients', 'detail', id] as const,
  timeline: (id: string) => ['clients', 'timeline', id] as const,
};

function buildQuery(filters: ClientFilters): string {
  const params = new URLSearchParams();
  if (filters.type) params.set('type', filters.type);
  if (filters.temperature) params.set('temperature', filters.temperature);
  if (filters.q) params.set('q', filters.q);
  if (filters.page) params.set('page', String(filters.page));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useClients(filters: ClientFilters) {
  return useQuery({
    queryKey: clientKeys.list(filters),
    queryFn: () => httpClient.get<Paginated<Client>>(`/clients${buildQuery(filters)}`),
  });
}

export function useClient(id: string) {
  return useQuery({
    queryKey: clientKeys.detail(id),
    queryFn: () => httpClient.get<ClientDetail>(`/clients/${id}`),
  });
}

export function useCreateClient() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateClientInput) => httpClient.post<Client>('/clients', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientKeys.all }),
  });
}

export function useAddActivity(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { type: string; message: string }) =>
      httpClient.post<Activity>(`/clients/${clientId}/activities`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientKeys.detail(clientId) }),
  });
}
