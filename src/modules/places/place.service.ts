import type { Place, PlaceCategory, PlacePriority } from '@prisma/client';
import { ERROR_CODE } from '../../constants/error-code.js';
import { tripRepository } from '../trips/trip.repository.js';
import { tripService } from '../trips/trip.service.js';
import { AppError } from '../../utils/AppError.js';
import { placeRepository, type PlaceWriteData } from './place.repository.js';
import type { CreatePlaceInput, UpdatePlaceInput } from './place.validator.js';
import { resolvePlaceData } from './place-data.js';
import { discoveryClient } from '../discovery/discovery.client.js';

export const serializePlace = resolvePlaceData;

const assertPlaceOwner = async (
  placeId: number,
  userId: number
): Promise<Place> => {
  const place = await placeRepository.findById(placeId);
  if (!place) {
    throw new AppError(
      404,
      ERROR_CODE.PLACE_NOT_FOUND,
      '장소를 찾을 수 없습니다.'
    );
  }
  const trip = await tripRepository.findById(place.tripId);
  tripService.assertOwner(trip, userId);
  return place;
};

export const placeService = {
  async create(userId: number, tripId: number, input: CreatePlaceInput) {
    tripService.assertOwner(await tripRepository.findById(tripId), userId);
    if (input.googlePlaceId)
      await discoveryClient.googleDetails(input.googlePlaceId);
    const place = await placeRepository.create({
      tripId,
      name: input.googlePlaceId ? 'Google Maps 장소' : input.name,
      ...(input.googlePlaceId ? { googlePlaceId: input.googlePlaceId } : {}),
      category: input.category as PlaceCategory,
      ...(input.googlePlaceId || input.address === undefined
        ? {}
        : { address: input.address }),
      latitude: input.googlePlaceId ? 0 : input.latitude,
      longitude: input.googlePlaceId ? 0 : input.longitude,
      priority: input.priority as PlacePriority,
      stayTimeMinutes: input.stayTimeMinutes,
    });
    return { placeId: place.id };
  },

  async list(userId: number, tripId: number) {
    tripService.assertOwner(await tripRepository.findById(tripId), userId);
    return Promise.all(
      (await placeRepository.findManyByTrip(tripId)).map((place) =>
        serializePlace(place)
      )
    );
  },

  async detail(userId: number, placeId: number) {
    return serializePlace(await assertPlaceOwner(placeId, userId));
  },

  async update(userId: number, placeId: number, input: UpdatePlaceInput) {
    const current = await assertPlaceOwner(placeId, userId);
    if (
      current.googlePlaceId &&
      ['name', 'address', 'latitude', 'longitude'].some((key) => key in input)
    ) {
      throw new AppError(
        400,
        ERROR_CODE.INVALID_INPUT,
        'Google 장소의 기본 정보는 공급자의 최신 정보를 사용합니다. 분류와 체류 시간만 변경할 수 있어요.'
      );
    }
    const data: PlaceWriteData = {
      ...(input.name === undefined ? {} : { name: input.name }),
      ...(input.category === undefined
        ? {}
        : { category: input.category as PlaceCategory }),
      ...(input.address === undefined ? {} : { address: input.address }),
      ...(input.latitude === undefined ? {} : { latitude: input.latitude }),
      ...(input.longitude === undefined ? {} : { longitude: input.longitude }),
      ...(input.priority === undefined
        ? {}
        : { priority: input.priority as PlacePriority }),
      ...(input.stayTimeMinutes === undefined
        ? {}
        : { stayTimeMinutes: input.stayTimeMinutes }),
    };
    return serializePlace(await placeRepository.update(placeId, data));
  },

  async remove(userId: number, placeId: number) {
    await assertPlaceOwner(placeId, userId);
    await placeRepository.softDelete(placeId);
  },
};
