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
  const qs = params.toString();
  return useQuery({
    queryKey: matchKeys.list(filters),
    queryFn: () => httpClient.get<Paginated<Match>>(`/matches${qs ? `?${qs}` : ''}`),
  });
}

export function useRunMatching() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => httpClient.post<{ matches: number }>('/matches/run', {}),
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
