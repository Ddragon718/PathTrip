import type { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response.js';
import type { GeocodeQuery, MapSearchQuery } from './maps.dto.js';
import { mapsService } from './maps.service.js';

export const mapsController = {
  async search(request: Request, response: Response) {
    const query = request.query as unknown as MapSearchQuery;
    return sendSuccess(response, await mapsService.search(query.q, query.provider));
  },

  async geocode(request: Request, response: Response) {
    const query = request.query as unknown as GeocodeQuery;
    return sendSuccess(response, await mapsService.geocode(query.address));
  },
};
