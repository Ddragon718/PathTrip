import { z } from 'zod';
import {
  discoveryCategorySchema,
  googlePlaceIdSchema,
} from '../discovery/discovery.dto.js';
import { coercedDatabaseIdSchema } from '../shared/schema.validator.js';

export const regionQuerySchema = z
  .object({ query: z.string().trim().min(1).max(100) })
  .strict();
export const visitSchema = z
  .object({
    regionId: googlePlaceIdSchema,
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    accuracy: z
      .number()
      .nonnegative()
      .max(
        100,
        '정확도 100m 이내의 위치가 필요합니다. 정확한 위치를 허용하고 다시 시도해 주세요.'
      ),
    capturedAt: z.iso.datetime(),
  })
  .strict();
export const communityQuerySchema = z
  .object({
    regionId: googlePlaceIdSchema,
    category: discoveryCategorySchema,
    page: z.coerce.number().int().min(1).max(10000).default(1),
    limit: z.coerce.number().int().min(1).max(20).default(20),
  })
  .strict();
export const recommendationSchema = z
  .object({
    regionId: googlePlaceIdSchema,
    category: discoveryCategorySchema,
    placeName: z.string().trim().min(1).max(150),
    address: z.string().trim().min(1).max(300).optional(),
    note: z
      .string()
      .trim()
      .min(10, '추천 이유를 10자 이상 적어 주세요.')
      .max(1000),
  })
  .strict();
export const recommendationParamsSchema = z.object({
  id: coercedDatabaseIdSchema,
});
export type VisitInput = z.infer<typeof visitSchema>;
export type RecommendationInput = z.infer<typeof recommendationSchema>;
export type CommunityQuery = z.infer<typeof communityQuerySchema>;
