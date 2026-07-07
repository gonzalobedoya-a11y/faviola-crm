import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { httpClient } from '@/lib/api/http';

export type MatchStatus = 'NEW' | 'SENT' | 'VIEWED' | 'DISCARDED' | 'CONVERTED';

export interface Match {
  id: string;
  score: number;
  reasons: string[];
  status: MatchStatus;
  client: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    temperature: 'HOT' | 'WARM' | 'COLD';
  };
  property: {
    id: string;
    title: string;
    price: number;
    currency: string;
    district?: string | null;
    media: { url: string }[];
  };
}

export interface MatchFilters {
  minScore?: number;
  status?: MatchStatus;
  clientId?: string;
  propertyId?: string;
  pageSize?: number;
  page?: number;
}

interface Paginated<T> {
  items: T[];
  meta: { page: number; pageSize: number; total: number; totalPages: number };
}

const matchKeys = {
  all: ['matches'] as const,
  list: (filters: MatchFilters) => ['matches', 'list', filters] as const,
};

export function useMatches(filters: MatchFilters) {
  const params = new URLSearchParams();
  if (filters.minScore) params.set('minScore', String(filters.minScore));
  if (filters.status) params.set('status', filters.status);
  if (filters.clientId) params.set('clientId', filters.clientId);
  if (filters.propertyId) params.set('propertyId', filters.propertyId);
  if (filters.pageSize) params.set('pageSize', String(filters.pageSize));
  if (filters.page) params.set('page', String(filters.page));
  const qs = params.toString();
  return useQuery({
    queryKey: matchKeys.list(filters),
    queryFn: () => httpClient.get<Paginated<Match>>(`/matches${qs ? `?${qs}` : ''}`),
  });
}

export function useRunMatching() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input?: { clientId?: string; propertyId?: string }) =>
      httpClient.post<{ matches: number }>('/matches/run', input ?? {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: matchKeys.all }),
  });
}

export function useClearMatches() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => httpClient.delete<{ deleted: number }>('/matches'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: matchKeys.all }),
  });
}

export function useUpdateMatchStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: MatchStatus }) =>
      httpClient.patch<Match>(`/matches/${id}`, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: matchKeys.all }),
  });
}
