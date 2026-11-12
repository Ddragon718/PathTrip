import { z } from 'zod';

export const discoveryCategorySchema = z.enum([
  'TOURIST_SPOT',
  'RESTAURANT',
  'CAFE',
  'PHOTO_SPOT',
  'HOTEL',
  'ETC',
]);
export const discoveryQuerySchema = z
  .object({
    region: z.string().trim().min(1).max(100),
    category: discoveryCategorySchema.default('TOURIST_SPOT'),
    provider: z.enum(['GOOGLE', 'KAKAO']).default('GOOGLE'),
    sort: z.enum(['REVIEWS', 'RATING', 'RELEVANCE']).default('REVIEWS'),
    q: z.string().trim().max(100).default(''),
  })
  .strict();
export type DiscoveryQuery = z.infer<typeof discoveryQuerySchema>;
export type DiscoveryCategory = z.infer<typeof discoveryCategorySchema>;
export const googlePlaceIdSchema = z
  .string()
  .min(1)
  .max(256)
  .regex(/^[A-Za-z0-9_-]+$/);
export const googleDiscoveryPlaceSchema = z.object({
  id: googlePlaceIdSchema,
  displayName: z.object({ text: z.string().min(1) }),
  formattedAddress: z.string().default(''),
  location: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
  rating: z.number().min(0).max(5).optional(),
  userRatingCount: z.number().int().nonnegative().optional(),
  googleMapsUri: z.string().url().optional(),
  businessStatus: z.string().optional(),
  attributions: z
    .array(
      z.object({
        provider: z.string(),
        providerUri: z.string().url().optional(),
      })
    )
    .default([]),
});
export const googleDiscoveryResponseSchema = z.object({
  places: z.array(googleDiscoveryPlaceSchema).default([]),
});
export const kakaoDiscoveryResponseSchema = z.object({
  documents: z.array(
    z.object({
      id: z.string(),
      place_name: z.string(),
      address_name: z.string(),
      road_address_name: z.string(),
      x: z
        .string()
        .trim()
        .min(1)
        .transform(Number)
        .pipe(z.number().min(-180).max(180)),
      y: z
        .string()
        .trim()
        .min(1)
        .transform(Number)
        .pipe(z.number().min(-90).max(90)),
    })
  ),
});
