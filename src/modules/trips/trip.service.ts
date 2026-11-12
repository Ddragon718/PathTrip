import type { Place, Trip } from '@prisma/client';
import { resolvePlaceData } from '../places/place-data.js';
import { ERROR_CODE } from '../../constants/error-code.js';
import { AppError } from '../../utils/AppError.js';
import { tripRepository } from './trip.repository.js';
import type {
  CreateTripInput,
  TripListQuery,
  UpdateTripInput,
} from './trip.validator.js';

const toDate = (value: string): Date => new Date(`${value}T00:00:00.000Z`);
const toDateString = (date: Date): string => date.toISOString().slice(0, 10);

const serializeTrip = (trip: Trip) => ({
  id: trip.id,
  title: trip.title,
  region: trip.region,
  destinationType: trip.destinationType,
  mapPreference: trip.mapPreference,
  startDate: toDateString(trip.startDate),
  endDate: toDateString(trip.endDate),
});

const assertOwner = (trip: Trip | null, userId: number): Trip => {
  if (!trip) {
    throw new AppError(
      404,
      ERROR_CODE.TRIP_NOT_FOUND,
      '여행을 찾을 수 없습니다.'
    );
  }
  if (trip.userId !== userId) {
    throw new AppError(
      403,
      ERROR_CODE.FORBIDDEN,
      '해당 여행에 접근할 권한이 없습니다.'
    );
  }
  return trip;
};

export const tripService = {
  async create(userId: number, input: CreateTripInput) {
    if (input.startDate > input.endDate) {
      throw new AppError(
        400,
        ERROR_CODE.INVALID_DATE_RANGE,
        '날짜 범위가 올바르지 않습니다.'
      );
    }
    const trip = await tripRepository.create({
      userId,
      title: input.title,
      region: input.region,
      destinationType: input.destinationType,
      mapPreference: input.mapPreference,
      startDate: toDate(input.startDate),
      endDate: toDate(input.endDate),
    });
    return { tripId: trip.id };
  },

  async list(userId: number, query: TripListQuery) {
    const { items, total } = await tripRepository.findManyByUser(
      userId,
      query.page,
      query.limit
    );
    return {
      items: items.map(serializeTrip),
      meta: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  },

  async detail(userId: number, tripId: number) {
    const trip = assertOwner(
      await tripRepository.findById(tripId, true),
      userId
    );
    const withPlaces = trip as Trip & { places?: Place[] };
    return {
      ...serializeTrip(trip),
      places: await Promise.all(
        (withPlaces.places ?? []).map((place) => resolvePlaceData(place))
      ),
    };
  },

  async update(userId: number, tripId: number, input: UpdateTripInput) {
    const trip = assertOwner(await tripRepository.findById(tripId), userId);
    const startDate = input.startDate
      ? toDate(input.startDate)
      : trip.startDate;
    const endDate = input.endDate ? toDate(input.endDate) : trip.endDate;
    if (startDate > endDate) {
      throw new AppError(
        400,
        ERROR_CODE.INVALID_DATE_RANGE,
        '날짜 범위가 올바르지 않습니다.'
      );
    }

    const updated = await tripRepository.update(tripId, {
      ...(input.title === undefined ? {} : { title: input.title }),
      ...(input.region === undefined ? {} : { region: input.region }),
      ...(input.destinationType === undefined
        ? {}
        : { destinationType: input.destinationType }),
      ...(input.mapPreference === undefined
        ? {}
        : { mapPreference: input.mapPreference }),
      ...(input.startDate === undefined ? {} : { startDate }),
      ...(input.endDate === undefined ? {} : { endDate }),
    });
    return serializeTrip(updated);
  },

  async remove(userId: number, tripId: number) {
    assertOwner(await tripRepository.findById(tripId), userId);
    await tripRepository.softDelete(tripId);
  },

  assertOwner,
};
