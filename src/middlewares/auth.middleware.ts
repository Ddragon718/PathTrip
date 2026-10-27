import type { RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { ERROR_CODE } from '../constants/error-code.js';
import { AppError } from '../utils/AppError.js';

interface AccessTokenPayload extends jwt.JwtPayload {
  sub: string;
  email: string;
}

export const requireAuth: RequestHandler = (request, _response, next) => {
  const authorization = request.header('authorization');

  if (!authorization?.startsWith('Bearer ')) {
    next(new AppError(401, ERROR_CODE.UNAUTHORIZED, '인증이 필요합니다.'));
    return;
  }

  const token = authorization.slice('Bearer '.length).trim();

  try {
    const payload = jwt.verify(token, env.ACCESS_SECRET) as AccessTokenPayload;
    const userId = Number(payload.sub);
    if (
      !Number.isInteger(userId) ||
      userId <= 0 ||
      userId > 2_147_483_647 ||
      !payload.email
    ) {
      throw new Error('Invalid access token payload');
    }
    request.user = { id: userId, email: payload.email };
    next();
  } catch {
    next(
      new AppError(
        401,
        ERROR_CODE.UNAUTHORIZED,
        '유효하지 않은 인증 토큰입니다.'
      )
    );
  }
};
