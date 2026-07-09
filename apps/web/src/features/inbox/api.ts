import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { httpClient } from '@/lib/api/http';

import type {
  AiResult,
  ConversationDetail,
  InboxFilters,
  InboxMessage,
  InboxOverview,
  LeadsDashboard,
} from './types';

const inboxKeys = {
  all: ['inbox'] as const,
  overview: (filters: InboxFilters) => ['inbox', 'overview', filters] as const,
  conversation: (id: string) => ['inbox', 'conversation', id] as const,
};

function toQuery(filters: InboxFilters): string {
  const params = new URLSearchParams();
  if (filters.channel) params.set('channel', filters.channel);
  if (filters.status) params.set('status', filters.status);
  if (filters.tag) params.set('tag', filters.tag);
  if (filters.q) params.set('q', filters.q);
  const s = params.toString();
  return s ? `?${s}` : '';
}

export function useInbox(filters: InboxFilters) {
  return useQuery({
    queryKey: inboxKeys.overview(filters),
    queryFn: () => httpClient.get<InboxOverview>(`/inbox${toQuery(filters)}`),
    refetchInterval: 20000,
  });
}

export function useLeadsDashboard(days: number) {
  return useQuery({
    queryKey: ['inbox', 'leads-dashboard', days] as const,
    queryFn: () => httpClient.get<LeadsDashboard>(`/inbox/leads-dashboard?days=${days}`),
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: inboxKeys.conversation(id ?? 'none'),
    queryFn: () => httpClient.get<ConversationDetail>(`/inbox/conversations/${id}`),
    enabled: Boolean(id),
  });
}

export function useSendMessage(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) =>
      httpClient.post<InboxMessage>(`/inbox/conversations/${id}/messages`, { body }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inboxKeys.conversation(id) });
      void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
    },
  });
}

export function useUpdateConversation(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      status?: ConversationDetail['status'];
      tags?: string[];
      clientId?: string | null;
      propertyId?: string | null;
      notes?: string | null;
    }) => httpClient.patch<ConversationDetail>(`/inbox/conversations/${id}`, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: inboxKeys.conversation(id) });
      void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
    },
  });
}

export function useAiAssist() {
  return useMutation({
    mutationFn: (input: { conversationId?: string; prompt?: string; mode?: 'reply' | 'ask' }) =>
      httpClient.post<AiResult>('/inbox/ai', input),
  });
}

interface AiSettings {
  instructions: string;
  configured: boolean;
  model: string;
}

export function useAiSettings() {
  return useQuery({
    queryKey: ['inbox', 'ai-settings'] as const,
    queryFn: () => httpClient.get<AiSettings>('/inbox/ai/settings'),
  });
}

export function useUpdateAiSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (instructions: string) =>
      httpClient.patch<{ instructions: string }>('/inbox/ai/settings', { instructions }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inbox', 'ai-settings'] }),
  });
}
