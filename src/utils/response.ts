import type { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export const sendSuccess = <T>(
  response: Response,
  data: T,
  statusCode = 200
): Response => response.status(statusCode).json({ success: true, data });

export const sendList = <T>(
  response: Response,
  data: T[],
  meta: PaginationMeta
): Response => response.status(200).json({ success: true, data, meta });
