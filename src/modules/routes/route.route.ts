import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { routeController } from './route.controller.js';
import {
  recommendRouteSchema,
  saveRouteSchema,
  tripIdParamsSchema,
} from './route.validator.js';

export const routeRouter = Router({ mergeParams: true });

routeRouter.use(requireAuth);
routeRouter.post(
  '/recommend',
  validate(tripIdParamsSchema, 'params'),
  validate(recommendRouteSchema),
  asyncHandler(routeController.recommend)
);
routeRouter.post(
  '/',
  validate(tripIdParamsSchema, 'params'),
  validate(saveRouteSchema),
  asyncHandler(routeController.save)
);
routeRouter.get(
  '/',
  validate(tripIdParamsSchema, 'params'),
  asyncHandler(routeController.list)
);
