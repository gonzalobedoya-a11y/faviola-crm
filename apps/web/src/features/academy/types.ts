export type AcademyFormat = 'WORKSHOP' | 'TALK' | 'TRAINING';
export type AcademyProgramStatus = 'DRAFT' | 'OPEN' | 'CLOSED';
export type AcademyLeadStatus = 'NEW' | 'CONTACTED' | 'ENROLLED' | 'DISCARDED';

export interface AcademyProgram {
  id: string;
  title: string;
  format: AcademyFormat;
  description?: string | null;
  modality: string;
  audience?: string | null;
  startsAt?: string | null;
  duration?: string | null;
  capacity?: number | null;
  status: AcademyProgramStatus;
  createdAt: string;
  _count?: { leads: number; enrollments: number };
}

export interface AcademyLead {
  id: string;
  programId?: string | null;
  firstName: string;
  lastName?: string | null;
  phone: string;
  email?: string | null;
  formatInterest?: AcademyFormat | null;
  experienceLevel?: string | null;
  objective?: string | null;
  source: string;
  status: AcademyLeadStatus;
  createdAt: string;
  program?: Pick<AcademyProgram, 'title' | 'format'> | null;
}

export interface AcademyStudent {
  id: string;
  firstName: string;
  lastName?: string | null;
  phone?: string | null;
  email: string;
  accessCode: string;
  status: 'ACTIVE' | 'PAUSED';
  notes?: string | null;
  createdAt: string;
  enrollments: Array<{ program: Pick<AcademyProgram, 'id' | 'title' | 'format'> }>;
}

export interface AcademyDashboard {
  programs: AcademyProgram[];
  recentLeads: AcademyLead[];
  students: AcademyStudent[];
  summary: {
    programs: number;
    openPrograms: number;
    students: number;
    leads: number;
    newLeads: number;
  };
}

export interface CreateAcademyLeadInput {
  programId?: string;
  firstName: string;
  lastName?: string;
  phone: string;
  email?: string;
  formatInterest?: AcademyFormat;
  experienceLevel?: string;
  objective?: string;
  source: string;
}

export interface CreateAcademyStudentInput {
  firstName: string;
  lastName?: string;
  phone?: string;
  email: string;
  accessCode: string;
  programIds: string[];
  notes?: string;
}

export interface AcademyProgramInput {
  title: string;
  format: AcademyFormat;
  description?: string;
  modality: string;
  audience?: string;
  startsAt?: string;
  duration?: string;
  capacity?: number;
  status: AcademyProgramStatus;
}

export interface AcademyPortalResult {
  student: { firstName: string; lastName?: string | null; email: string };
  programs: AcademyProgram[];
}
