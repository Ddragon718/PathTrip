import type { PlaceCategory } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import type { CommunityQuery, RecommendationInput } from './community.dto.js';

export const communityRepository = {
  findVisit(userId: number, regionId: string) {
    return prisma.regionVisit.findUnique({
      where: { userId_regionId: { userId, regionId } },
    });
  },
  verify(userId: number, regionId: string, verifiedAt: Date, expiresAt: Date) {
    return prisma.regionVisit.upsert({
      where: { userId_regionId: { userId, regionId } },
      create: { userId, regionId, verifiedAt, expiresAt },
      update: { verifiedAt, expiresAt },
    });
  },
  async list(query: CommunityQuery) {
    const where = {
      regionId: query.regionId,
      category: query.category as PlaceCategory,
      deletedAt: null,
      user: { deletedAt: null },
    };
    const [items, total] = await prisma.$transaction([
      prisma.visitorRecommendation.findMany({
        where,
        include: { user: { select: { nickname: true } } },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.visitorRecommendation.count({ where }),
    ]);
    return { items, total };
  },
  create(userId: number, input: RecommendationInput, verifiedAt: Date) {
    return prisma.visitorRecommendation.create({
      data: {
        regionId: input.regionId,
        placeName: input.placeName,
        note: input.note,
        address: input.address ?? null,
        category: input.category as PlaceCategory,
        userId,
        verifiedAt,
      },
    });
  },
  findById(id: number) {
    return prisma.visitorRecommendation.findFirst({
      where: { id, deletedAt: null },
    });
  },
  remove(id: number) {
    return prisma.visitorRecommendation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  },
};
