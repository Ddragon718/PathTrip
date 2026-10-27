import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { tripController } from './trip.controller.js';
import {
  createTripSchema,
  tripIdParamsSchema,
  tripListQuerySchema,
  updateTripSchema,
} from './trip.validator.js';

export const tripRouter = Router();

tripRouter.use(requireAuth);
tripRouter.post(
  '/',
  validate(createTripSchema),
  asyncHandler(tripController.create)
);
tripRouter.get(
  '/',
  validate(tripListQuerySchema, 'query'),
  asyncHandler(tripController.list)
);
tripRouter.get(
  '/:tripId',
  validate(tripIdParamsSchema, 'params'),
  asyncHandler(tripController.detail)
);
tripRouter.patch(
  '/:tripId',
  validate(tripIdParamsSchema, 'params'),
  validate(updateTripSchema),
  asyncHandler(tripController.update)
);
tripRouter.delete(
  '/:tripId',
  validate(tripIdParamsSchema, 'params'),
  asyncHandler(tripController.remove)
);
