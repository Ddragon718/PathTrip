import type { Prisma, DestinationType, MapPreference } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export const tripRepository = {
  create(data: {
    userId: number;
    title: string;
    region: string;
    destinationType: DestinationType;
    mapPreference: MapPreference;
    startDate: Date;
    endDate: Date;
  }) {
    return prisma.trip.create({ data });
  },

  async findManyByUser(userId: number, page: number, limit: number) {
    const where: Prisma.TripWhereInput = { userId, deletedAt: null };
    const [items, total] = await prisma.$transaction([
      prisma.trip.findMany({
        where,
        orderBy: [{ startDate: 'asc' }, { id: 'asc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.trip.count({ where }),
    ]);
    return { items, total };
  },

  findById(id: number, includePlaces = false) {
    return prisma.trip.findFirst({
      where: { id, deletedAt: null },
      ...(includePlaces
        ? {
            include: {
              places: {
                where: { deletedAt: null },
                orderBy: { id: 'asc' as const },
              },
            },
          }
        : {}),
    });
  },

  update(
    id: number,
    data: { title?: string; region?: string; startDate?: Date; endDate?: Date; destinationType?: DestinationType; mapPreference?: MapPreference }
  ) {
    return prisma.trip.update({ where: { id }, data });
  },

  softDelete(id: number) {
    return prisma.trip.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
