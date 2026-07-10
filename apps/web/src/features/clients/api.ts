import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { httpClient } from '@/lib/api/http';

import type {
  Activity,
  BirthdayItem,
  BirthdaySettings,
  Client,
  ClientDetail,
  ClientFilters,
  ClientRequirement,
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
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.q) params.set('q', filters.q);
  if (filters.page) params.set('page', String(filters.page));
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export function useClients(filters: ClientFilters) {
  return useQuery({
    queryKey: clientKeys.list(filters),
    queryFn: () => httpClient.get<Paginated<Client>>(`/clients${buildQuery(filters)}`),
    enabled: filters.q === undefined || filters.q.trim().length >= 2,
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

export function useUpdateClient(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<CreateClientInput>) =>
      httpClient.patch<Client>(`/clients/${id}`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientKeys.all }),
  });
}

export function useBirthdays(days = 30) {
  return useQuery({
    queryKey: ['clients', 'birthdays', days] as const,
    queryFn: () => httpClient.get<{ items: BirthdayItem[] }>(`/clients/birthdays?days=${days}`),
  });
}

export function useBirthdaySettings() {
  return useQuery({
    queryKey: ['clients', 'birthday-settings'] as const,
    queryFn: () => httpClient.get<BirthdaySettings>('/clients/birthday-settings'),
  });
}

export function useUpdateBirthdaySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (patch: Partial<BirthdaySettings>) =>
      httpClient.patch<BirthdaySettings>('/clients/birthday-settings', patch),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['clients', 'birthday-settings'] }),
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

export function useUpsertRequirement(clientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ClientRequirement) =>
      httpClient.put<ClientRequirement>(`/clients/${clientId}/requirement`, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: clientKeys.detail(clientId) }),
  });
}
