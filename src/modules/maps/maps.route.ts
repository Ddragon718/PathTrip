import { Router } from 'express';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { geocodeQuerySchema, mapSearchQuerySchema } from './maps.dto.js';
import { mapsController } from './maps.controller.js';

export const mapsRouter = Router();

mapsRouter.use(requireAuth);
mapsRouter.get(
  '/search',
  validate(mapSearchQuerySchema, 'query'),
  asyncHandler(mapsController.search)
);
mapsRouter.get(
  '/geocode',
  validate(geocodeQuerySchema, 'query'),
  asyncHandler(mapsController.geocode)
);
