import { z } from 'zod';

export const dealStages = [
  'NEW',
  'CONTACTED',
  'VISIT',
  'OFFER',
  'NEGOTIATION',
  'CLOSING',
  'WON',
  'LOST',
] as const;

export const createDealSchema = z.object({
  clientId: z.string().uuid(),
  propertyId: z.string().uuid().optional(),
  sellerClientId: z.string().uuid().optional(),
  stage: z.enum(dealStages).default('NEW'),
  value: z.number().int().nonnegative().optional(),
  currency: z.string().default('PEN'),
  commissionPct: z.number().nonnegative().optional(),
  probability: z.number().int().min(0).max(100).optional(),
  expectedCloseDate: z.coerce.date().optional(),
});

export const updateDealSchema = createDealSchema.partial().omit({ clientId: true });

export const moveStageSchema = z.object({
  stage: z.enum(dealStages),
});

export const closeDealSchema = z.object({
  result: z.enum(['WON', 'LOST']),
  lostReason: z.string().optional(),
  commissionAmount: z.number().int().nonnegative().optional(),
});

export const listDealsSchema = z.object({
  stage: z.enum(dealStages).optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(50),
});

export type CreateDealDto = z.infer<typeof createDealSchema>;
export type UpdateDealDto = z.infer<typeof updateDealSchema>;
export type MoveStageDto = z.infer<typeof moveStageSchema>;
export type CloseDealDto = z.infer<typeof closeDealSchema>;
export type ListDealsDto = z.infer<typeof listDealsSchema>;
