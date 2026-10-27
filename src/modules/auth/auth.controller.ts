import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response.js';
import { authService } from './auth.service.js';
import type { LoginInput, SignupInput } from './auth.validator.js';

export const authController = {
  async signup(request: Request, response: Response) {
    const user = await authService.signup(request.body as SignupInput);
    return sendSuccess(response, user, 201);
  },

  async login(request: Request, response: Response) {
    const result = await authService.login(request.body as LoginInput);
    return sendSuccess(response, result);
  },
};
