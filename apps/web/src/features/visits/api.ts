import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { httpClient } from '@/lib/api/http';

export type VisitStatus = 'SCHEDULED' | 'DONE' | 'CANCELLED' | 'NOSHOW';

export interface Visit {
  id: string;
  scheduledAt: string;
  durationMin: number;
  status: VisitStatus;
  feedback?: string | null;
  outcome?: string | null;
  client: { id: string; firstName: string; lastName: string; phone?: string | null };
  property?: { id: string; title: string; district?: string | null } | null;
}

export interface CreateVisitInput {
  clientId: string;
  propertyId?: string;
  scheduledAt: string;
  durationMin?: number;
}

const visitKeys = { all: ['visits'] as const };

export function useVisits() {
  return useQuery({
    queryKey: visitKeys.all,
    queryFn: () => httpClient.get<Visit[]>('/visits'),
  });
}

export function useCreateVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateVisitInput) => httpClient.post<Visit>('/visits', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: visitKeys.all }),
  });
}

export function useUpdateVisit() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: {
      id: string;
      status?: VisitStatus;
      feedback?: string;
      scheduledAt?: string;
    }) => httpClient.patch<Visit>(`/visits/${id}`, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: visitKeys.all }),
  });
}
