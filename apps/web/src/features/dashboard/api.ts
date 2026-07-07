import { useQuery } from '@tanstack/react-query';

import { httpClient } from '@/lib/api/http';

export interface DashboardData {
  counts: {
    clients: number;
    owners: number;
    properties: number;
    availableProperties: number;
    documents: number;
    matches: number;
    deals: number;
    pipelineValue: number;
  };
  deltas: {
    clients: number;
    properties: number;
    matches: number;
  };
  quickStats: {
    followUps: number;
    newMatches: number;
    visitsToday: number;
    overdueVisits: number;
    dealsClosing: number;
    hotClients: number;
  };
  agenda: { id: string; time: string; client: string; property: string | null }[];
  matches: {
    id: string;
    score: number;
    clientId: string;
    client: string;
    propertyId: string;
    property: string;
    price: number;
    currency: string;
    cover: string | null;
  }[];
  pipeline: { stage: string; count: number; total: number }[];
  activity: {
    id: string;
    type: string;
    message: string;
    client: string | null;
    createdAt: string;
  }[];
  nextActions: { title: string; detail: string }[];
}

export function useDashboard() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: () => httpClient.get<DashboardData>('/dashboard'),
  });
}
