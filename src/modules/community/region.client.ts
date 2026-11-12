import { z } from 'zod';
import { env } from '../../config/env.js';
import { ERROR_CODE } from '../../constants/error-code.js';
import { AppError } from '../../utils/AppError.js';

const responseSchema = z.object({
  status: z.string(),
  results: z
    .array(
      z.object({
        place_id: z.string().min(1),
        formatted_address: z.string(),
        types: z.array(z.string()),
      })
    )
    .default([]),
});
const regionTypes = new Set([
  'administrative_area_level_1',
  'administrative_area_level_2',
  'locality',
  'sublocality',
  'sublocality_level_1',
]);
async function geocode(query: Record<string, string>) {
  if (!env.GOOGLE_GEOCODING_API_KEY)
    throw new AppError(
      503,
      ERROR_CODE.MAP_API_ERROR,
      '지역 인증용 Google Geocoding API 연결이 필요합니다.'
    );
  const params = new URLSearchParams({
    ...query,
    language: 'ko',
    key: env.GOOGLE_GEOCODING_API_KEY,
  });
  try {
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?${params}`,
      { signal: AbortSignal.timeout(7000) }
    );
    if (!response.ok) throw new Error('Provider failed');
    const data = responseSchema.parse(await response.json());
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS')
      throw new Error('Provider failed');
    return data.results.filter((item) =>
      item.types.some((type) => regionTypes.has(type))
    );
  } catch {
    throw new AppError(
      502,
      ERROR_CODE.MAP_API_ERROR,
      '지역을 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.'
    );
  }
}

export const regionClient = {
  async resolve(query: string) {
    const results = await geocode({ address: query });
    const item = results[0];
    if (!item)
      throw new AppError(
        404,
        ERROR_CODE.REGION_NOT_FOUND,
        '인증 가능한 도시·지역을 찾지 못했어요. 여행 지역을 더 구체적으로 입력해 주세요.'
      );
    return { id: item.place_id, label: item.formatted_address };
  },
  async reverse(latitude: number, longitude: number) {
    return (await geocode({ latlng: `${latitude},${longitude}` })).map(
      (item) => item.place_id
    );
  },
};
