import { z } from 'zod';

export const createPropertySchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  description: z.string().optional(),
  operation: z.enum(['SALE', 'RENT']).default('SALE'),
  propertyType: z.string().optional(),
  status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'OFF']).default('AVAILABLE'),
  price: z.number().int().nonnegative(),
  currency: z.string().default('PEN'),
  bedrooms: z.number().int().nonnegative().optional(),
  bathrooms: z.number().int().nonnegative().optional(),
  area: z.number().int().nonnegative().optional(),
  builtArea: z.number().int().nonnegative().optional(),
  address: z.string().optional(),
  district: z.string().optional(),
  city: z.string().optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  ownerClientId: z.string().uuid().optional(),
  images: z.array(z.string().url()).optional(),
});

export const updatePropertySchema = createPropertySchema.partial().omit({ images: true });

export const listPropertiesSchema = z.object({
  operation: z.enum(['SALE', 'RENT']).optional(),
  status: z.enum(['AVAILABLE', 'RESERVED', 'SOLD', 'RENTED', 'OFF']).optional(),
  district: z.string().optional(),
  q: z.string().optional(),
  priceMin: z.coerce.number().int().nonnegative().optional(),
  priceMax: z.coerce.number().int().nonnegative().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(100).default(20),
});

export const addMediaSchema = z.object({
  url: z.string().url('URL inválida'),
  type: z.enum(['IMAGE', 'DOC', 'VIDEO']).default('IMAGE'),
  isCover: z.boolean().default(false),
});

export const uploadUrlSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
});

export type CreatePropertyDto = z.infer<typeof createPropertySchema>;
export type UpdatePropertyDto = z.infer<typeof updatePropertySchema>;
export type ListPropertiesDto = z.infer<typeof listPropertiesSchema>;
export type AddMediaDto = z.infer<typeof addMediaSchema>;
export type UploadUrlDto = z.infer<typeof uploadUrlSchema>;
