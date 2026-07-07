import { z } from 'zod';

export const academyFormatSchema = z.enum(['WORKSHOP', 'TALK', 'TRAINING']);

export const createAcademyLeadSchema = z.object({
  programId: z.string().uuid().optional(),
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().optional(),
  phone: z.string().min(6, 'El WhatsApp es obligatorio'),
  email: z.union([z.string().email('Correo invalido'), z.literal('')]).optional(),
  formatInterest: academyFormatSchema.optional(),
  experienceLevel: z.string().optional(),
  objective: z.string().optional(),
  source: z.string().default('Landing Academia FV'),
});

export const createAcademyProgramSchema = z.object({
  title: z.string().min(1, 'El titulo es obligatorio'),
  format: academyFormatSchema,
  description: z.string().optional(),
  modality: z.string().default('En vivo'),
  audience: z.string().optional(),
  startsAt: z.coerce.date().optional(),
  duration: z.string().optional(),
  capacity: z.coerce.number().int().positive().optional(),
  status: z.enum(['DRAFT', 'OPEN', 'CLOSED']).default('OPEN'),
});

export const createAcademyStudentSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Correo invalido'),
  accessCode: z.string().min(4, 'El codigo debe tener al menos 4 caracteres'),
  programIds: z.array(z.string().uuid()).default([]),
  notes: z.string().optional(),
});

export const portalAccessSchema = z.object({
  email: z.string().email('Correo invalido'),
  accessCode: z.string().min(4, 'Codigo invalido'),
});

export type CreateAcademyLeadDto = z.infer<typeof createAcademyLeadSchema>;
export type CreateAcademyProgramDto = z.infer<typeof createAcademyProgramSchema>;
export type CreateAcademyStudentDto = z.infer<typeof createAcademyStudentSchema>;
export type PortalAccessDto = z.infer<typeof portalAccessSchema>;
