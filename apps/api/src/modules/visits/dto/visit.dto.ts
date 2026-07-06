import { z } from 'zod';

const visitStatus = ['SCHEDULED', 'DONE', 'CANCELLED', 'NOSHOW'] as const;

export const createVisitSchema = z.object({
  clientId: z.string().uuid(),
  propertyId: z.string().uuid().optional(),
  scheduledAt: z.coerce.date(),
  durationMin: z.number().int().positive().max(600).default(60),
});

export const updateVisitSchema = z.object({
  scheduledAt: z.coerce.date().optional(),
  durationMin: z.number().int().positive().max(600).optional(),
  status: z.enum(visitStatus).optional(),
  feedback: z.string().optional(),
  outcome: z.string().optional(),
});

export const listVisitsSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  status: z.enum(visitStatus).optional(),
});

export type CreateVisitDto = z.infer<typeof createVisitSchema>;
export type UpdateVisitDto = z.infer<typeof updateVisitSchema>;
export type ListVisitsDto = z.infer<typeof listVisitsSchema>;
