import { z } from 'zod';
import { coercedDatabaseIdSchema } from '../shared/schema.validator.js';
import { googlePlaceIdSchema } from '../discovery/discovery.dto.js';

const placeCategory = z.enum([
  'RESTAURANT',
  'CAFE',
  'TOURIST_SPOT',
  'HOTEL',
  'PHOTO_SPOT',
  'ETC',
]);
const placePriority = z.enum(['HIGH', 'MEDIUM', 'LOW']);

export const tripIdParamsSchema = z.object({
  tripId: coercedDatabaseIdSchema,
});

export const placeIdParamsSchema = z.object({
  placeId: coercedDatabaseIdSchema,
});

export const createPlaceSchema = z
  .object({
    name: z.string().trim().min(1).max(150),
    googlePlaceId: googlePlaceIdSchema.optional(),
    category: placeCategory,
    address: z.string().trim().min(1).max(300).optional(),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    priority: placePriority.default('MEDIUM'),
    stayTimeMinutes: z.number().int().min(0).max(1440).default(60),
  })
  .strict();

export const updatePlaceSchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    category: placeCategory.optional(),
    address: z.string().trim().min(1).max(300).nullable().optional(),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    priority: placePriority.optional(),
    stayTimeMinutes: z.number().int().min(0).max(1440).optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    '수정할 값을 하나 이상 입력해야 합니다.'
  );

export type CreatePlaceInput = z.infer<typeof createPlaceSchema>;
export type UpdatePlaceInput = z.infer<typeof updatePlaceSchema>;
