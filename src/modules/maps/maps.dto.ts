import { z } from 'zod';

const coordinateString = z
  .string()
  .refine(
    (value) => value.trim() !== '' && Number.isFinite(Number(value)),
    '좌표가 숫자 형식이어야 합니다.'
  );

export const mapSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(100),
  provider: z.enum(['KAKAO', 'GOOGLE']).default('KAKAO'),
});

export const geocodeQuerySchema = z.object({
  address: z.string().trim().min(1).max(300),
});

export const kakaoKeywordResponseSchema = z.object({
  documents: z.array(
    z.object({
      place_name: z.string(),
      address_name: z.string(),
      road_address_name: z.string(),
      x: coordinateString,
      y: coordinateString,
    })
  ),
});

export const kakaoAddressResponseSchema = z.object({
  documents: z.array(
    z.object({
      address_name: z.string(),
      x: coordinateString,
      y: coordinateString,
    })
  ),
});

export type MapSearchQuery = z.infer<typeof mapSearchQuerySchema>;
export const googlePlacesResponseSchema = z.object({
  places: z
    .array(
      z.object({
        displayName: z.object({ text: z.string().min(1) }),
        formattedAddress: z.string().optional(),
        location: z.object({
          latitude: z.number().min(-90).max(90),
          longitude: z.number().min(-180).max(180),
        }),
      })
    )
    .default([]),
});
export type GeocodeQuery = z.infer<typeof geocodeQuerySchema>;
