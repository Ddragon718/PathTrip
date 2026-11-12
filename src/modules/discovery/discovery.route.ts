import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { discoveryQuerySchema, type DiscoveryQuery } from './discovery.dto.js';
import { discoveryService } from './discovery.service.js';

export const discoveryRouter = Router();
discoveryRouter.use(
  requireAuth,
  rateLimit({
    windowMs: 60_000,
    limit: 30,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  })
);
discoveryRouter.get(
  '/',
  validate(discoveryQuerySchema, 'query'),
  asyncHandler(async (request: Request, response: Response) =>
    sendSuccess(
      response,
      await discoveryService.list(request.query as unknown as DiscoveryQuery)
    )
  )
);
