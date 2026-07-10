import { z } from 'zod';

export const legalDocTypes = [
  'TITULO_DOMINIO',
  'PARTIDA',
  'DNI',
  'ESTUDIO_TITULO',
  'CORRETAJE',
  'OTROS',
] as const;

// Data URI (PDF/imagen/Word) o URL http. Límite ~12MB en base64 (~9MB de archivo).
const docSourceSchema = z
  .string()
  .max(12_000_000, 'El archivo es demasiado pesado (máx. ~9MB)')
  .refine(
    (value) => /^https?:\/\//.test(value) || /^data:(application|image)\//.test(value),
    'URL o archivo inválido',
  );

export const addDocumentSchema = z.object({
  type: z.enum(legalDocTypes),
  name: z.string().min(1, 'El nombre es obligatorio').max(200),
  url: docSourceSchema,
});

export const updateLegalSchema = z.object({
  contract: z.enum(['EXCLUSIVO', 'NO_EXCLUSIVO']).optional(),
  corretajeExpiry: z.coerce.date().nullable().optional(),
  cancelled: z.boolean().optional(),
  notes: z.string().max(2000).nullable().optional(),
});

export type AddDocumentDto = z.infer<typeof addDocumentSchema>;
export type UpdateLegalDto = z.infer<typeof updateLegalSchema>;
