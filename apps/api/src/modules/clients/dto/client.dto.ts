import { z } from 'zod';

export const requirementSchema = z.object({
  operation: z.enum(['SALE', 'RENT']).default('SALE'),
  propertyType: z.string().optional(),
  budgetMin: z.number().int().nonnegative().optional(),
  budgetMax: z.number().int().nonnegative().optional(),
  currency: z.string().default('PEN'),
  bedroomsMin: z.number().int().nonnegative().optional(),
  bathroomsMin: z.number().int().nonnegative().optional(),
  areaMin: z.number().int().nonnegative().optional(),
  zones: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

export const createClientSchema = z.object({
  type: z.enum(['BUYER', 'SELLER', 'BOTH']).default('BUYER'),
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().min(1, 'El apellido es obligatorio'),
  phone: z.string().optional(),
  email: z.union([z.string().email('Correo inválido'), z.literal('')]).optional(),
  source: z.string().optional(),
  temperature: z.enum(['HOT', 'WARM', 'COLD']).default('WARM'),
  notes: z.string().optional(),
  birthday: z.coerce.date().nullable().optional(),
  requirement: requirementSchema.optional(),
});

export const birthdaySettingsSchema = z.object({
  template: z.string().max(1000).optional(),
  autoSend: z.boolean().optional(),
});

const optionalEmailSchema = z
  .union([z.string().email('Correo inválido'), z.literal('')])
  .optional();

export const publicLeadSchema = z.object({
  firstName: z.string().min(1, 'El nombre es obligatorio'),
  lastName: z.string().optional(),
  phone: z.string().min(6, 'El WhatsApp es obligatorio'),
  email: optionalEmailSchema,
  operation: z.enum(['SALE', 'RENT']).default('SALE'),
  propertyType: z.string().optional(),
  budgetMax: z.coerce.number().int().nonnegative().optional(),
  currency: z.enum(['PEN', 'USD']).default('USD'),
  bedroomsMin: z.coerce.number().int().nonnegative().optional(),
  zones: z.array(z.string()).default([]),
  notes: z.string().optional(),
  source: z.string().default('Formulario público'),
});

export const updateClientSchema = createClientSchema.partial().omit({ requirement: true });

export const listClientsSchema = z.object({
  type: z.enum(['BUYER', 'SELLER']).optional(),
  temperature: z.enum(['HOT', 'WARM', 'COLD']).optional(),
  q: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const addActivitySchema = z.object({
  type: z.enum(['NOTE', 'CALL', 'MESSAGE', 'VISIT', 'EMAIL']).default('NOTE'),
  message: z.string().min(1, 'El mensaje es obligatorio'),
});

export type BirthdaySettingsDto = z.infer<typeof birthdaySettingsSchema>;
export type RequirementDto = z.infer<typeof requirementSchema>;
export type CreateClientDto = z.infer<typeof createClientSchema>;
export type PublicLeadDto = z.infer<typeof publicLeadSchema>;
export type UpdateClientDto = z.infer<typeof updateClientSchema>;
export type ListClientsDto = z.infer<typeof listClientsSchema>;
export type AddActivityDto = z.infer<typeof addActivitySchema>;
