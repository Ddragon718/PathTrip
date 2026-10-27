import type { Place, PlaceCategory, PlacePriority } from '@prisma/client';
import { ERROR_CODE } from '../../constants/error-code.js';
import { tripRepository } from '../trips/trip.repository.js';
import { tripService } from '../trips/trip.service.js';
import { AppError } from '../../utils/AppError.js';
import { placeRepository, type PlaceWriteData } from './place.repository.js';
import type { CreatePlaceInput, UpdatePlaceInput } from './place.validator.js';

export const serializePlace = (place: Place) => ({
  id: place.id,
  name: place.name,
  category: place.category,
  address: place.address,
  latitude: place.latitude,
  longitude: place.longitude,
  priority: place.priority,
  stayTimeMinutes: place.stayTimeMinutes,
});

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
    const place = await placeRepository.create({
      tripId,
      name: input.name,
      category: input.category as PlaceCategory,
      ...(input.address === undefined ? {} : { address: input.address }),
      latitude: input.latitude,
      longitude: input.longitude,
      priority: input.priority as PlacePriority,
      stayTimeMinutes: input.stayTimeMinutes,
    });
    return { placeId: place.id };
  },

  async list(userId: number, tripId: number) {
    tripService.assertOwner(await tripRepository.findById(tripId), userId);
    return (await placeRepository.findManyByTrip(tripId)).map(serializePlace);
  },

  async detail(userId: number, placeId: number) {
    return serializePlace(await assertPlaceOwner(placeId, userId));
  },

  async update(userId: number, placeId: number, input: UpdatePlaceInput) {
    await assertPlaceOwner(placeId, userId);
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
