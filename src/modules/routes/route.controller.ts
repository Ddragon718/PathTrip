import type { Request, Response } from 'express';
import { ERROR_CODE } from '../../constants/error-code.js';
import { AppError } from '../../utils/AppError.js';
import { sendSuccess } from '../../utils/response.js';
import { routeService } from './route.service.js';
import type { RecommendRouteInput, SaveRouteInput } from './route.validator.js';

const userIdFrom = (request: Request): number => {
  if (!request.user) {
    throw new AppError(401, ERROR_CODE.UNAUTHORIZED, '인증이 필요합니다.');
  }
  return request.user.id;
};

export const routeController = {
  async recommend(request: Request, response: Response) {
    const result = await routeService.recommend(
      userIdFrom(request),
      Number(request.params.tripId),
      request.body as RecommendRouteInput
    );
    return sendSuccess(response, result);
  },

  async save(request: Request, response: Response) {
    const result = await routeService.save(
      userIdFrom(request),
      Number(request.params.tripId),
      request.body as SaveRouteInput
    );
    return sendSuccess(response, result, 201);
  },

  async list(request: Request, response: Response) {
    const routes = await routeService.list(
      userIdFrom(request),
      Number(request.params.tripId)
    );
    return sendSuccess(response, routes);
  },
};
