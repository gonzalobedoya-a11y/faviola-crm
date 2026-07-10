import { z } from 'zod';

export const listConversationsSchema = z.object({
  channel: z.enum(['WHATSAPP', 'INSTAGRAM', 'FACEBOOK', 'TIKTOK', 'INTERNAL']).optional(),
  status: z.enum(['OPEN', 'PENDING', 'CLOSED']).optional(),
  tag: z.string().optional(),
  q: z.string().optional(),
});

export const sendMessageSchema = z.object({
  body: z.string().min(1, 'El mensaje no puede estar vacío'),
});

export const updateConversationSchema = z.object({
  status: z.enum(['OPEN', 'PENDING', 'CLOSED']).optional(),
  tags: z.array(z.string()).optional(),
  clientId: z.string().uuid().nullable().optional(),
  propertyId: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const leadsDashboardSchema = z.object({
  days: z.coerce.number().int().min(1).max(90).default(30),
});

export const aiSettingsSchema = z.object({
  instructions: z.string().max(6000, 'Máximo 6000 caracteres').optional(),
  autoMode: z.enum(['OFF', 'AFTER_HOURS', 'ALWAYS']).optional(),
  hoursStart: z.number().int().min(0).max(23).optional(),
  hoursEnd: z.number().int().min(0).max(23).optional(),
  // Días de atención de Faviola (0=domingo … 6=sábado). Fuera de estos días,
  // el modo "Fuera de horario" responde automático todo el día.
  workDays: z.array(z.number().int().min(0).max(6)).max(7).optional(),
});

export const aiAssistSchema = z.object({
  conversationId: z.string().uuid().optional(),
  prompt: z.string().optional(),
  mode: z.enum(['reply', 'ask']).default('ask'),
});

export type AiSettingsDto = z.infer<typeof aiSettingsSchema>;
export type LeadsDashboardDto = z.infer<typeof leadsDashboardSchema>;
export type ListConversationsDto = z.infer<typeof listConversationsSchema>;
export type SendMessageDto = z.infer<typeof sendMessageSchema>;
export type UpdateConversationDto = z.infer<typeof updateConversationSchema>;
export type AiAssistDto = z.infer<typeof aiAssistSchema>;
