import type { Request, Response } from 'express';
import { ERROR_CODE } from '../../constants/error-code.js';
import { AppError } from '../../utils/AppError.js';
import { sendList, sendSuccess } from '../../utils/response.js';
import { tripService } from './trip.service.js';
import type {
  CreateTripInput,
  TripListQuery,
  UpdateTripInput,
} from './trip.validator.js';

const userIdFrom = (request: Request): number => {
  if (!request.user) {
    throw new AppError(401, ERROR_CODE.UNAUTHORIZED, '인증이 필요합니다.');
  }
  return request.user.id;
};

export const tripController = {
  async create(request: Request, response: Response) {
    const result = await tripService.create(
      userIdFrom(request),
      request.body as CreateTripInput
    );
    return sendSuccess(response, result, 201);
  },

  async list(request: Request, response: Response) {
    const result = await tripService.list(
      userIdFrom(request),
      request.query as unknown as TripListQuery
    );
    return sendList(response, result.items, result.meta);
  },

  async detail(request: Request, response: Response) {
    const result = await tripService.detail(
      userIdFrom(request),
      Number(request.params.tripId)
    );
    return sendSuccess(response, result);
  },

  async update(request: Request, response: Response) {
    const result = await tripService.update(
      userIdFrom(request),
      Number(request.params.tripId),
      request.body as UpdateTripInput
    );
    return sendSuccess(response, result);
  },

  async remove(request: Request, response: Response) {
    await tripService.remove(
      userIdFrom(request),
      Number(request.params.tripId)
    );
    return response.status(204).send();
  },
};
