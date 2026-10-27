import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { userController } from './user.controller.js';

export const userRouter = Router();

userRouter.get('/me', requireAuth, asyncHandler(userController.getMe));
