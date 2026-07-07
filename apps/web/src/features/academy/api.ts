import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { httpClient } from '@/lib/api/http';

import type {
  AcademyDashboard,
  AcademyPortalResult,
  AcademyProgram,
  CreateAcademyLeadInput,
  CreateAcademyStudentInput,
} from './types';

const academyKeys = {
  all: ['academy'] as const,
  publicPrograms: ['academy', 'public-programs'] as const,
  dashboard: ['academy', 'dashboard'] as const,
};

export function useAcademyDashboard() {
  return useQuery({
    queryKey: academyKeys.dashboard,
    queryFn: () => httpClient.get<AcademyDashboard>('/academy'),
  });
}

export function usePublicAcademyPrograms() {
  return useQuery({
    queryKey: academyKeys.publicPrograms,
    queryFn: () => httpClient.get<AcademyProgram[]>('/academy/public/programs'),
  });
}

export function useCreateAcademyLead() {
  return useMutation({
    mutationFn: (input: CreateAcademyLeadInput) =>
      httpClient.post<{ id: string; message: string }>('/academy/public/leads', input),
  });
}

export function useAcademyPortalAccess() {
  return useMutation({
    mutationFn: (input: { email: string; accessCode: string }) =>
      httpClient.post<AcademyPortalResult>('/academy/portal', input),
  });
}

export function useCreateAcademyStudent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateAcademyStudentInput) => httpClient.post('/academy/students', input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: academyKeys.all }),
  });
}
