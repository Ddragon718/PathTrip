import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { env } from './config/env.js';
import {
  errorHandler,
  notFoundHandler,
} from './middlewares/error.middleware.js';
import { authRouter } from './modules/auth/auth.route.js';
import { mapsRouter } from './modules/maps/maps.route.js';
import { placeRouter, tripPlaceRouter } from './modules/places/place.route.js';
import { routeRouter } from './modules/routes/route.route.js';
import { tripRouter } from './modules/trips/trip.route.js';
import { userRouter } from './modules/users/user.route.js';

export const createApp = () => {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL.split(',').map((origin) => origin.trim()),
      credentials: true,
    })
  );
  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));

  app.get('/health', (_request, response) => {
    response.json({
      success: true,
      data: { status: 'ok', timestamp: new Date().toISOString() },
    });
  });

  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
  });

  app.use('/api/v1/auth', authLimiter, authRouter);
  app.use('/api/v1/users', userRouter);
  app.use('/api/v1/trips/:tripId/places', tripPlaceRouter);
  app.use('/api/v1/trips/:tripId/routes', routeRouter);
  app.use('/api/v1/trips', tripRouter);
  app.use('/api/v1/places', placeRouter);
  app.use('/api/v1/maps', mapsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};

export const app = createApp();
