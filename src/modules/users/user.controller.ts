import type { Request, Response } from 'express';
import { ERROR_CODE } from '../../constants/error-code.js';
import { AppError } from '../../utils/AppError.js';
import { sendSuccess } from '../../utils/response.js';
import { userService } from './user.service.js';

export const userController = {
  async getMe(request: Request, response: Response) {
    if (!request.user) {
      throw new AppError(401, ERROR_CODE.UNAUTHORIZED, '인증이 필요합니다.');
    }
    const user = await userService.getMe(request.user.id);
    return sendSuccess(response, user);
  },
};
