import { env } from '../../config/env.js';
import { ERROR_CODE } from '../../constants/error-code.js';
import { AppError } from '../../utils/AppError.js';
import {
  kakaoAddressResponseSchema,
  kakaoKeywordResponseSchema,
  googlePlacesResponseSchema,
} from './maps.dto.js';

const requestKakao = async (
  path: string,
  params: URLSearchParams
): Promise<unknown> => {
  if (!env.KAKAO_MAP_REST_API_KEY) {
    throw new AppError(
      503,
      ERROR_CODE.MAP_API_ERROR,
      'KAKAO_MAP_REST_API_KEY가 설정되지 않았습니다.'
    );
  }

  try {
    const response = await fetch(
      `https://dapi.kakao.com${path}?${params.toString()}`,
      {
        headers: { Authorization: `KakaoAK ${env.KAKAO_MAP_REST_API_KEY}` },
        signal: AbortSignal.timeout(5_000),
      }
    );
    if (!response.ok) {
      throw new Error(`Kakao Local API returned ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    if (error instanceof AppError) throw error;
    throw new AppError(
      502,
      ERROR_CODE.MAP_API_ERROR,
      '지도 API 요청에 실패했습니다.'
    );
  }
};

export const mapsClient = {
  async searchGoogle(keyword: string) {
    if (!env.GOOGLE_PLACES_API_KEY) {
      throw new AppError(
        503,
        ERROR_CODE.MAP_API_ERROR,
        'Google 장소 검색을 준비 중이에요. 잠시 후 다시 시도해 주세요.'
      );
    }
    try {
      const response = await fetch(
        'https://places.googleapis.com/v1/places:searchText',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY,
            'X-Goog-FieldMask':
              'places.displayName,places.formattedAddress,places.location',
          },
          body: JSON.stringify({
            textQuery: keyword,
            languageCode: 'ko',
            pageSize: 15,
          }),
          signal: AbortSignal.timeout(5_000),
        }
      );
      if (!response.ok) throw new Error('Google Places request failed');
      const parsed = googlePlacesResponseSchema.safeParse(
        await response.json()
      );
      if (!parsed.success) throw new Error('Invalid Google Places response');
      return parsed.data.places;
    } catch {
      throw new AppError(
        502,
        ERROR_CODE.MAP_API_ERROR,
        'Google 장소 검색에 연결하지 못했어요. 다시 시도해 주세요.'
      );
    }
  },
  async search(keyword: string) {
    const raw = await requestKakao(
      '/v2/local/search/keyword.json',
      new URLSearchParams({ query: keyword, size: '15' })
    );
    const parsed = kakaoKeywordResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new AppError(
        502,
        ERROR_CODE.MAP_API_ERROR,
        '지도 API 응답 형식이 올바르지 않습니다.'
      );
    }
    return parsed.data.documents;
  },

  async geocode(address: string) {
    const raw = await requestKakao(
      '/v2/local/search/address.json',
      new URLSearchParams({ query: address, size: '1' })
    );
    const parsed = kakaoAddressResponseSchema.safeParse(raw);
    if (!parsed.success) {
      throw new AppError(
        502,
        ERROR_CODE.MAP_API_ERROR,
        '지도 API 응답 형식이 올바르지 않습니다.'
      );
    }
    return parsed.data.documents;
  },
};
