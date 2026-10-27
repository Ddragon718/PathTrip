import type { PlaceCategory, PlacePriority } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export interface PlaceWriteData {
  name?: string;
  category?: PlaceCategory;
  address?: string | null;
  latitude?: number;
  longitude?: number;
  priority?: PlacePriority;
  stayTimeMinutes?: number;
}

export const placeRepository = {
  create(
    data: PlaceWriteData & {
      tripId: number;
      name: string;
      category: PlaceCategory;
      latitude: number;
      longitude: number;
    }
  ) {
    return prisma.place.create({ data });
  },

  findManyByTrip(tripId: number) {
    return prisma.place.findMany({
      where: { tripId, deletedAt: null },
      orderBy: [{ priority: 'asc' }, { id: 'asc' }],
    });
  },

  findById(id: number) {
    return prisma.place.findFirst({ where: { id, deletedAt: null } });
  },

  update(id: number, data: PlaceWriteData) {
    return prisma.place.update({ where: { id }, data });
  },

  softDelete(id: number) {
    return prisma.place.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
