import { env } from '../../config/env.js';
import { ERROR_CODE } from '../../constants/error-code.js';
import { AppError } from '../../utils/AppError.js';
import {
  googleDiscoveryPlaceSchema,
  googleDiscoveryResponseSchema,
  kakaoDiscoveryResponseSchema,
  type DiscoveryCategory,
} from './discovery.dto.js';

const labels: Record<DiscoveryCategory, string> = {
  TOURIST_SPOT: '관광 명소',
  RESTAURANT: '음식점',
  CAFE: '카페',
  PHOTO_SPOT: '사진 명소',
  HOTEL: '숙소',
  ETC: '가볼 만한 곳',
};
const googleTypes: Partial<Record<DiscoveryCategory, string>> = {
  TOURIST_SPOT: 'tourist_attraction',
  RESTAURANT: 'restaurant',
  CAFE: 'cafe',
  HOTEL: 'lodging',
};
const kakaoTypes: Partial<Record<DiscoveryCategory, string>> = {
  TOURIST_SPOT: 'AT4',
  RESTAURANT: 'FD6',
  CAFE: 'CE7',
  HOTEL: 'AD5',
};
const basicFields =
  'id,displayName,formattedAddress,location,googleMapsUri,attributions,businessStatus';

async function googleRequest(
  path: string,
  fields: string,
  body?: object
): Promise<unknown> {
  if (!env.GOOGLE_PLACES_API_KEY)
    throw new AppError(
      503,
      ERROR_CODE.MAP_API_ERROR,
      'Google Places 키를 연결하면 이 지역의 실제 추천을 볼 수 있어요.'
    );
  try {
    const response = await fetch(`https://places.googleapis.com/v1/${path}`, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': env.GOOGLE_PLACES_API_KEY,
        'X-Goog-FieldMask': fields,
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      signal: AbortSignal.timeout(7000),
    });
    if (!response.ok) throw new Error('Provider request failed');
    return await response.json();
  } catch {
    throw new AppError(
      502,
      ERROR_CODE.MAP_API_ERROR,
      '장소 정보를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
    );
  }
}

export const discoveryClient = {
  async google(region: string, category: DiscoveryCategory, keyword: string) {
    const type = googleTypes[category];
    const raw = await googleRequest(
      'places:searchText',
      `${basicFields
        .split(',')
        .map((field) => `places.${field}`)
        .join(',')},places.rating,places.userRatingCount`,
      {
        textQuery: `${region} ${keyword || labels[category]}`,
        languageCode: 'ko',
        pageSize: 20,
        rankPreference: 'RELEVANCE',
        ...(type ? { includedType: type, strictTypeFiltering: true } : {}),
      }
    );
    const result = googleDiscoveryResponseSchema.safeParse(raw);
    if (!result.success)
      throw new AppError(
        502,
        ERROR_CODE.MAP_API_ERROR,
        '장소 응답 형식을 확인하지 못했어요.'
      );
    return result.data.places;
  },
  async googleDetails(id: string) {
    const result = googleDiscoveryPlaceSchema.safeParse(
      await googleRequest(
        `places/${encodeURIComponent(id)}?languageCode=ko`,
        basicFields
      )
    );
    if (!result.success)
      throw new AppError(
        502,
        ERROR_CODE.MAP_API_ERROR,
        '저장한 장소의 최신 정보를 불러오지 못했어요.'
      );
    return result.data;
  },
  async kakao(region: string, category: DiscoveryCategory, keyword: string) {
    if (!env.KAKAO_MAP_REST_API_KEY)
      throw new AppError(
        503,
        ERROR_CODE.MAP_API_ERROR,
        '카카오 Local 키를 연결하면 이 지역의 실제 추천을 볼 수 있어요.'
      );
    const params = new URLSearchParams({
      query: `${region} ${keyword || labels[category]}`,
      size: '15',
      sort: 'accuracy',
    });
    const type = kakaoTypes[category];
    if (type) params.set('category_group_code', type);
    try {
      const response = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`,
        {
          headers: { Authorization: `KakaoAK ${env.KAKAO_MAP_REST_API_KEY}` },
          signal: AbortSignal.timeout(7000),
        }
      );
      if (!response.ok) throw new Error('Provider request failed');
      const result = kakaoDiscoveryResponseSchema.safeParse(
        await response.json()
      );
      if (!result.success) throw new Error('Invalid response');
      return result.data.documents;
    } catch {
      throw new AppError(
        502,
        ERROR_CODE.MAP_API_ERROR,
        '카카오 추천을 불러오지 못했어요. 다시 시도해 주세요.'
      );
    }
  },
};
