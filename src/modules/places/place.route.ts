import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { placeController } from './place.controller.js';
import {
  createPlaceSchema,
  placeIdParamsSchema,
  tripIdParamsSchema,
  updatePlaceSchema,
} from './place.validator.js';

export const tripPlaceRouter = Router({ mergeParams: true });
export const placeRouter = Router();

tripPlaceRouter.use(requireAuth);
tripPlaceRouter.post(
  '/',
  validate(tripIdParamsSchema, 'params'),
  validate(createPlaceSchema),
  asyncHandler(placeController.create)
);
tripPlaceRouter.get(
  '/',
  validate(tripIdParamsSchema, 'params'),
  asyncHandler(placeController.list)
);

placeRouter.use(requireAuth);
placeRouter.get(
  '/:placeId',
  validate(placeIdParamsSchema, 'params'),
  asyncHandler(placeController.detail)
);
placeRouter.patch(
  '/:placeId',
  validate(placeIdParamsSchema, 'params'),
  validate(updatePlaceSchema),
  asyncHandler(placeController.update)
);
placeRouter.delete(
  '/:placeId',
  validate(placeIdParamsSchema, 'params'),
  asyncHandler(placeController.remove)
);
