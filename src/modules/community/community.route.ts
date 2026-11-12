import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { requireAuth } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { sendSuccess } from '../../utils/response.js';
import { communityService } from './community.service.js';
import {
  communityQuerySchema,
  recommendationParamsSchema,
  recommendationSchema,
  regionQuerySchema,
  visitSchema,
  type CommunityQuery,
} from './community.dto.js';

export const communityRouter = Router();
const limit = (requests: number) =>
  rateLimit({
    windowMs: 60_000,
    limit: requests,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });
communityRouter.use(requireAuth, limit(60));
communityRouter.get(
  '/regions',
  validate(regionQuerySchema, 'query'),
  asyncHandler(async (req, res) =>
    sendSuccess(
      res,
      await communityService.resolveRegion(String(req.query.query))
    )
  )
);
communityRouter.post(
  '/visits',
  limit(5),
  validate(visitSchema),
  asyncHandler(async (req, res) =>
    sendSuccess(res, await communityService.verify(req.user!.id, req.body))
  )
);
communityRouter.get(
  '/recommendations',
  validate(communityQuerySchema, 'query'),
  asyncHandler(async (req, res) =>
    sendSuccess(
      res,
      await communityService.list(
        req.user!.id,
        req.query as unknown as CommunityQuery
      )
    )
  )
);
communityRouter.post(
  '/recommendations',
  limit(5),
  validate(recommendationSchema),
  asyncHandler(async (req, res) =>
    sendSuccess(res, await communityService.create(req.user!.id, req.body), 201)
  )
);
communityRouter.delete(
  '/recommendations/:id',
  validate(recommendationParamsSchema, 'params'),
  asyncHandler(async (req, res) => {
    await communityService.remove(req.user!.id, Number(req.params.id));
    res.status(204).send();
  })
);
