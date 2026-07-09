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
});

export const aiAssistSchema = z.object({
  conversationId: z.string().uuid().optional(),
  prompt: z.string().optional(),
  mode: z.enum(['reply', 'ask']).default('ask'),
});

export type ListConversationsDto = z.infer<typeof listConversationsSchema>;
export type SendMessageDto = z.infer<typeof sendMessageSchema>;
export type UpdateConversationDto = z.infer<typeof updateConversationSchema>;
export type AiAssistDto = z.infer<typeof aiAssistSchema>;
