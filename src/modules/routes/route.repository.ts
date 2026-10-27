import type { OptimizationType, Prisma } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

interface RoutePlaceWrite {
  placeId: number;
  visitOrder: number;
  estimatedArrivalTime?: Date;
  moveTimeFromPreviousMinutes?: number;
  distanceFromPreviousMeters?: number;
}

export const routeRepository = {
  create(data: {
    tripId: number;
    name?: string;
    optimizationType: OptimizationType;
    totalDistanceMeters: number;
    totalMoveTimeMinutes: number;
    places: RoutePlaceWrite[];
  }) {
    const routeData: Prisma.RouteCreateInput = {
      trip: { connect: { id: data.tripId } },
      ...(data.name === undefined ? {} : { name: data.name }),
      optimizationType: data.optimizationType,
      totalDistanceMeters: data.totalDistanceMeters,
      totalMoveTimeMinutes: data.totalMoveTimeMinutes,
      places: { create: data.places },
    };
    return prisma.route.create({ data: routeData });
  },

  findManyByTrip(tripId: number) {
    return prisma.route.findMany({
      where: { tripId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      include: {
        places: {
          orderBy: { visitOrder: 'asc' },
          include: { place: true },
        },
      },
    });
  },
};
