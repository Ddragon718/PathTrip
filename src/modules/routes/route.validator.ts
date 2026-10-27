import { z } from 'zod';
import {
  coercedDatabaseIdSchema,
  databaseIdSchema,
  nonNegativeDatabaseIntegerSchema,
} from '../shared/schema.validator.js';

export const tripIdParamsSchema = z.object({
  tripId: coercedDatabaseIdSchema,
});

export const recommendRouteSchema = z
  .object({
    startTime: z.string().datetime({ offset: true }),
    transportType: z.enum(['CAR', 'PUBLIC_TRANSIT', 'BICYCLE', 'WALK']),
    optimizationType: z.enum([
      'DISTANCE',
      'TIME',
      'FOOD',
      'CAFE',
      'TOUR',
      'PHOTO',
    ]),
  })
  .strict();

const savedRoutePlaceSchema = z
  .object({
    placeId: databaseIdSchema,
    visitOrder: databaseIdSchema,
    estimatedArrivalTime: z.string().datetime({ offset: true }).optional(),
    moveTimeFromPreviousMinutes: nonNegativeDatabaseIntegerSchema.optional(),
    distanceFromPreviousMeters: nonNegativeDatabaseIntegerSchema.optional(),
  })
  .strict();

export const saveRouteSchema = z
  .object({
    name: z.string().trim().min(1).max(150).optional(),
    optimizationType: z.enum([
      'DISTANCE',
      'TIME',
      'FOOD',
      'CAFE',
      'TOUR',
      'PHOTO',
    ]),
    totalDistanceMeters: nonNegativeDatabaseIntegerSchema,
    totalMoveTimeMinutes: nonNegativeDatabaseIntegerSchema,
    places: z.array(savedRoutePlaceSchema).min(2),
  })
  .strict()
  .superRefine((value, context) => {
    const placeIds = new Set(value.places.map((place) => place.placeId));
    const orders = value.places
      .map((place) => place.visitOrder)
      .sort((a, b) => a - b);
    if (placeIds.size !== value.places.length) {
      context.addIssue({
        code: 'custom',
        path: ['places'],
        message: '장소는 중복될 수 없습니다.',
      });
    }
    if (orders.some((order, index) => order !== index + 1)) {
      context.addIssue({
        code: 'custom',
        path: ['places'],
        message: '방문 순서는 1부터 빠짐없이 이어져야 합니다.',
      });
    }
  });

export type RecommendRouteInput = z.infer<typeof recommendRouteSchema>;
export type SaveRouteInput = z.infer<typeof saveRouteSchema>;
