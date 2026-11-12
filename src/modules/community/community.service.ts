import { ERROR_CODE } from '../../constants/error-code.js';
import { AppError } from '../../utils/AppError.js';
import { userService } from '../users/user.service.js';
import { communityRepository } from './community.repository.js';
import { regionClient } from './region.client.js';
import type {
  CommunityQuery,
  RecommendationInput,
  VisitInput,
} from './community.dto.js';

export const communityService = {
  async resolveRegion(query: string) {
    return regionClient.resolve(query);
  },
  async verify(userId: number, input: VisitInput) {
    await userService.getMe(userId);
    const now = new Date();
    const age = now.getTime() - Date.parse(input.capturedAt);
    if (!Number.isFinite(age) || age < -15_000 || age > 120_000)
      throw new AppError(
        400,
        ERROR_CODE.LOCATION_EXPIRED,
        '현재 위치를 새로 가져와 다시 인증해 주세요.'
      );
    const regionIds = await regionClient.reverse(
      input.latitude,
      input.longitude
    );
    if (!regionIds.includes(input.regionId))
      throw new AppError(
        403,
        ERROR_CODE.LOCATION_NOT_IN_REGION,
        '현재 위치가 선택한 지역 안에 있지 않아요. 해당 지역을 방문했을 때 인증할 수 있습니다.'
      );
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    await communityRepository.verify(userId, input.regionId, now, expiresAt);
    return {
      verifiedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
  },
  async list(userId: number, query: CommunityQuery) {
    const [user, result, visit] = await Promise.all([
      userService.getMe(userId),
      communityRepository.list(query),
      communityRepository.findVisit(userId, query.regionId),
    ]);
    return {
      items: result.items.map((item) => ({
        id: item.id,
        placeName: item.placeName,
        address: item.address,
        category: item.category,
        note: item.note,
        author: item.user.nickname,
        verifiedAt: item.verifiedAt.toISOString(),
        createdAt: item.createdAt.toISOString(),
        canDelete: item.userId === userId || user.role === 'ADMIN',
      })),
      page: query.page,
      totalPages: Math.ceil(result.total / query.limit),
      total: result.total,
      verification:
        visit && visit.expiresAt > new Date()
          ? { expiresAt: visit.expiresAt.toISOString() }
          : null,
    };
  },
  async create(userId: number, input: RecommendationInput) {
    await userService.getMe(userId);
    const visit = await communityRepository.findVisit(userId, input.regionId);
    if (!visit || visit.expiresAt <= new Date())
      throw new AppError(
        403,
        ERROR_CODE.VISIT_VERIFICATION_REQUIRED,
        '이 지역의 현재 위치 인증이 필요합니다. 인증은 24시간 동안 유효해요.'
      );
    const post = await communityRepository.create(
      userId,
      input,
      visit.verifiedAt
    );
    return { id: post.id };
  },
  async remove(userId: number, id: number) {
    const user = await userService.getMe(userId);
    const post = await communityRepository.findById(id);
    if (!post || (post.userId !== userId && user.role !== 'ADMIN'))
      throw new AppError(
        404,
        ERROR_CODE.NOT_FOUND,
        '삭제할 추천을 찾지 못했습니다.'
      );
    await communityRepository.remove(id);
  },
};
