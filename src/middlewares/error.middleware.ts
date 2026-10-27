import { Prisma } from '@prisma/client';
import type { ErrorRequestHandler, RequestHandler } from 'express';
import { ZodError } from 'zod';
import { ERROR_CODE } from '../constants/error-code.js';
import { AppError } from '../utils/AppError.js';

export const notFoundHandler: RequestHandler = (request, _response, next) => {
  next(
    new AppError(
      404,
      ERROR_CODE.NOT_FOUND,
      `${request.method} ${request.originalUrl} 경로를 찾을 수 없습니다.`
    )
  );
};

export const errorHandler: ErrorRequestHandler = (
  error,
  _request,
  response,
  _next
) => {
  if (
    error instanceof SyntaxError &&
    typeof error === 'object' &&
    error !== null &&
    'body' in error
  ) {
    response.status(400).json({
      success: false,
      code: ERROR_CODE.INVALID_INPUT,
      message: 'JSON 요청 본문이 올바르지 않습니다.',
    });
    return;
  }

  if (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    error.status === 413
  ) {
    response.status(413).json({
      success: false,
      code: ERROR_CODE.INVALID_INPUT,
      message: '요청 본문이 허용된 크기를 초과했습니다.',
    });
    return;
  }

  if (error instanceof ZodError) {
    const paths = error.issues.map((issue) => String(issue.path[0] ?? ''));
    const coordinateError = paths.some(
      (path) => path === 'latitude' || path === 'longitude'
    );
    const categoryError = paths.includes('category');
    const code = coordinateError
      ? ERROR_CODE.INVALID_COORDINATE
      : categoryError
        ? ERROR_CODE.INVALID_PLACE_CATEGORY
        : ERROR_CODE.INVALID_INPUT;
    const message = coordinateError
      ? '좌표 값이 올바르지 않습니다.'
      : categoryError
        ? '장소 카테고리가 올바르지 않습니다.'
        : '입력값이 올바르지 않습니다.';
    response.status(400).json({
      success: false,
      code,
      message,
      details: error.issues.map((issue) => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });
    return;
  }

  if (error instanceof AppError) {
    response.status(error.statusCode).json({
      success: false,
      code: error.code,
      message: error.message,
      ...(error.details === undefined ? {} : { details: error.details }),
    });
    return;
  }

  if (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  ) {
    response.status(409).json({
      success: false,
      code: ERROR_CODE.INVALID_INPUT,
      message: '이미 존재하는 값입니다.',
    });
    return;
  }

  console.error(error);
  response.status(500).json({
    success: false,
    code: ERROR_CODE.INTERNAL_SERVER_ERROR,
    message: '서버 내부 오류가 발생했습니다.',
  });
};
