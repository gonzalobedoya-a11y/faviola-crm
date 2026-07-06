import { z } from 'zod';

export const listMatchesSchema = z.object({
  minScore: z.coerce.number().int().min(0).max(100).optional(),
  status: z.enum(['NEW', 'SENT', 'VIEWED', 'DISCARDED', 'CONVERTED']).optional(),
  clientId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const runMatchingSchema = z.object({
  clientId: z.string().uuid().optional(),
  propertyId: z.string().uuid().optional(),
});

export const updateMatchSchema = z.object({
  status: z.enum(['NEW', 'SENT', 'VIEWED', 'DISCARDED', 'CONVERTED']),
});

export type ListMatchesDto = z.infer<typeof listMatchesSchema>;
export type RunMatchingDto = z.infer<typeof runMatchingSchema>;
export type UpdateMatchDto = z.infer<typeof updateMatchSchema>;
