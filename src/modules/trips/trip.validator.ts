import { z } from 'zod';
import { coercedDatabaseIdSchema } from '../shared/schema.validator.js';

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '날짜는 YYYY-MM-DD 형식이어야 합니다.')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    return (
      !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
    );
  }, '유효한 날짜여야 합니다.');

export const tripIdParamsSchema = z.object({
  tripId: coercedDatabaseIdSchema,
});

export const createTripSchema = z
  .object({
    title: z.string().trim().min(1).max(100),
    region: z.string().trim().min(1).max(100),
    destinationType: z.enum(['DOMESTIC', 'INTERNATIONAL']).default('DOMESTIC'),
    mapPreference: z.enum(['AUTO', 'KAKAO', 'GOOGLE']).default('AUTO'),
    startDate: dateString,
    endDate: dateString,
  })
  .strict();

export const updateTripSchema = z
  .object({
    title: z.string().trim().min(1).max(100).optional(),
    region: z.string().trim().min(1).max(100).optional(),
    destinationType: z.enum(['DOMESTIC', 'INTERNATIONAL']).optional(),
    mapPreference: z.enum(['AUTO', 'KAKAO', 'GOOGLE']).optional(),
    startDate: dateString.optional(),
    endDate: dateString.optional(),
  })
  .strict()
  .refine(
    (value) => Object.keys(value).length > 0,
    '수정할 값을 하나 이상 입력해야 합니다.'
  );

export const tripListQuerySchema = z.object({
  page: z.coerce.number().int().positive().max(1_000_000).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;
export type UpdateTripInput = z.infer<typeof updateTripSchema>;
export type TripListQuery = z.infer<typeof tripListQuerySchema>;
