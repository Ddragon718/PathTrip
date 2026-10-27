import type { Request, Response } from 'express';
import { ERROR_CODE } from '../../constants/error-code.js';
import { AppError } from '../../utils/AppError.js';
import { sendSuccess } from '../../utils/response.js';
import { placeService } from './place.service.js';
import type { CreatePlaceInput, UpdatePlaceInput } from './place.validator.js';

const userIdFrom = (request: Request): number => {
  if (!request.user) {
    throw new AppError(401, ERROR_CODE.UNAUTHORIZED, '인증이 필요합니다.');
  }
  return request.user.id;
};

export const placeController = {
  async create(request: Request, response: Response) {
    const result = await placeService.create(
      userIdFrom(request),
      Number(request.params.tripId),
      request.body as CreatePlaceInput
    );
    return sendSuccess(response, result, 201);
  },

  async list(request: Request, response: Response) {
    const places = await placeService.list(
      userIdFrom(request),
      Number(request.params.tripId)
    );
    return sendSuccess(response, places);
  },

  async detail(request: Request, response: Response) {
    const place = await placeService.detail(
      userIdFrom(request),
      Number(request.params.placeId)
    );
    return sendSuccess(response, place);
  },

  async update(request: Request, response: Response) {
    const place = await placeService.update(
      userIdFrom(request),
      Number(request.params.placeId),
      request.body as UpdatePlaceInput
    );
    return sendSuccess(response, place);
  },

  async remove(request: Request, response: Response) {
    await placeService.remove(
      userIdFrom(request),
      Number(request.params.placeId)
    );
    return response.status(204).send();
  },
};
