import type { OptimizationType } from '@prisma/client';
import {
  recommendRoute,
  type OptimizationType as PolicyOptimizationType,
  type RoutablePlace,
  type TransportType,
} from '../../constants/route-policy.js';
import { ERROR_CODE } from '../../constants/error-code.js';
import { AppError } from '../../utils/AppError.js';
import { placeRepository } from '../places/place.repository.js';
import { tripRepository } from '../trips/trip.repository.js';
import { tripService } from '../trips/trip.service.js';
import { routeRepository } from './route.repository.js';
import type { RecommendRouteInput, SaveRouteInput } from './route.validator.js';
import { resolvePlaceData } from '../places/place-data.js';

const assertTripOwner = async (
  tripId: number,
  userId: number
): Promise<void> => {
  tripService.assertOwner(await tripRepository.findById(tripId), userId);
};

export const routeService = {
  async recommend(userId: number, tripId: number, input: RecommendRouteInput) {
    await assertTripOwner(tripId, userId);
    const places = await Promise.all(
      (await placeRepository.findManyByTrip(tripId)).map((place) =>
        resolvePlaceData(place, true)
      )
    );
    if (places.length < 2) {
      throw new AppError(
        400,
        ERROR_CODE.NOT_ENOUGH_PLACES,
        '동선 추천을 위해 최소 2개 이상의 장소가 필요합니다.'
      );
    }
    return recommendRoute(
      places as RoutablePlace[],
      new Date(input.startTime),
      input.transportType as TransportType,
      input.optimizationType as PolicyOptimizationType
    );
  },

  async save(userId: number, tripId: number, input: SaveRouteInput) {
    await assertTripOwner(tripId, userId);
    const activePlaces = await placeRepository.findManyByTrip(tripId);
    const activePlaceIds = new Set(activePlaces.map((place) => place.id));
    if (input.places.some((place) => !activePlaceIds.has(place.placeId))) {
      throw new AppError(
        404,
        ERROR_CODE.PLACE_NOT_FOUND,
        '여행에 포함되지 않은 장소가 있습니다.'
      );
    }

    const route = await routeRepository.create({
      tripId,
      ...(input.name === undefined ? {} : { name: input.name }),
      optimizationType: input.optimizationType as OptimizationType,
      totalDistanceMeters: input.totalDistanceMeters,
      totalMoveTimeMinutes: input.totalMoveTimeMinutes,
      places: input.places.map((place) => ({
        placeId: place.placeId,
        visitOrder: place.visitOrder,
        ...(place.estimatedArrivalTime === undefined
          ? {}
          : { estimatedArrivalTime: new Date(place.estimatedArrivalTime) }),
        ...(place.moveTimeFromPreviousMinutes === undefined
          ? {}
          : { moveTimeFromPreviousMinutes: place.moveTimeFromPreviousMinutes }),
        ...(place.distanceFromPreviousMeters === undefined
          ? {}
          : { distanceFromPreviousMeters: place.distanceFromPreviousMeters }),
      })),
    });
    return { routeId: route.id };
  },

  async list(userId: number, tripId: number) {
    await assertTripOwner(tripId, userId);
    const routes = await routeRepository.findManyByTrip(tripId);
    return Promise.all(
      routes.map(async (route) => ({
        id: route.id,
        name: route.name,
        optimizationType: route.optimizationType,
        totalDistanceMeters: route.totalDistanceMeters,
        totalMoveTimeMinutes: route.totalMoveTimeMinutes,
        places: await Promise.all(
          route.places.map(async (item) => ({
            placeId: item.placeId,
            name: (await resolvePlaceData(item.place)).name,
            visitOrder: item.visitOrder,
            estimatedArrivalTime:
              item.estimatedArrivalTime?.toISOString() ?? null,
            moveTimeFromPreviousMinutes: item.moveTimeFromPreviousMinutes,
            distanceFromPreviousMeters: item.distanceFromPreviousMeters,
          }))
        ),
      }))
    );
  },
};
