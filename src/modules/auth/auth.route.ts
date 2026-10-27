import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { authController } from './auth.controller.js';
import { loginSchema, signupSchema } from './auth.validator.js';

export const authRouter = Router();

authRouter.post(
  '/signup',
  validate(signupSchema),
  asyncHandler(authController.signup)
);
authRouter.post(
  '/login',
  validate(loginSchema),
  asyncHandler(authController.login)
);
