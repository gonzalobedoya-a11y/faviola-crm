import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { httpClient } from '@/lib/api/http';

export type DealStage =
  'NEW' | 'CONTACTED' | 'VISIT' | 'OFFER' | 'NEGOTIATION' | 'CLOSING' | 'WON' | 'LOST';

export interface Deal {
  id: string;
  stage: DealStage;
  value?: number | null;
  currency: string;
  probability: number;
  client: { id: string; firstName: string; lastName: string };
  property?: {
    id: string;
    title: string;
    price: number;
    currency: string;
    media: { url: string }[];
  } | null;
}

export interface BoardColumn {
  stage: DealStage;
  deals: Deal[];
  count: number;
  total: number;
}

export interface CreateDealInput {
  clientId: string;
  propertyId?: string;
  value?: number;
  currency: string;
  stage: DealStage;
}

const dealKeys = { board: ['deals', 'board'] as const };

export function useBoard() {
  return useQuery({
    queryKey: dealKeys.board,
    queryFn: () => httpClient.get<BoardColumn[]>('/deals/board'),
  });
}

export function useCreateDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateDealInput) => httpClient.post<Deal>('/deals', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dealKeys.board }),
  });
}

export function useMoveStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: DealStage }) =>
      httpClient.patch<Deal>(`/deals/${id}/stage`, { stage }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: dealKeys.board }),
  });
}
