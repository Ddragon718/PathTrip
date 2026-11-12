import { discoveryClient } from './discovery.client.js';
import type { DiscoveryQuery } from './discovery.dto.js';

export const discoveryService = {
  async list(query: DiscoveryQuery) {
    if (query.provider === 'KAKAO') {
      const places = await discoveryClient.kakao(
        query.region,
        query.category,
        query.q
      );
      return {
        items: places.map((place) => ({
          id: `kakao:${place.id}`,
          name: place.place_name,
          address: place.road_address_name || place.address_name,
          latitude: place.y,
          longitude: place.x,
          category: query.category,
          rating: null,
          reviewCount: null,
          source: 'KAKAO' as const,
          sourceUrl: `https://place.map.kakao.com/${encodeURIComponent(place.id)}`,
          attributions: [],
        })),
        sort: 'RELEVANCE' as const,
        note: '카카오 관련도순 · 리뷰 수·평점은 제공되지 않습니다. 실제 방문자 수 순위가 아닙니다.',
      };
    }
    const places = (
      await discoveryClient.google(query.region, query.category, query.q)
    ).filter((place) => !place.businessStatus?.startsWith('CLOSED'));
    const unique = [
      ...new Map(places.map((place) => [place.id, place])).values(),
    ];
    if (query.sort === 'REVIEWS')
      unique.sort(
        (a, b) =>
          (b.userRatingCount ?? -1) - (a.userRatingCount ?? -1) ||
          (b.rating ?? -1) - (a.rating ?? -1)
      );
    if (query.sort === 'RATING')
      unique.sort(
        (a, b) =>
          (b.rating ?? -1) - (a.rating ?? -1) ||
          (b.userRatingCount ?? -1) - (a.userRatingCount ?? -1)
      );
    return {
      items: unique.map((place) => ({
        id: `google:${place.id}`,
        googlePlaceId: place.id,
        name: place.displayName.text,
        address: place.formattedAddress,
        ...place.location,
        category: query.category,
        rating: place.rating ?? null,
        reviewCount: place.userRatingCount ?? null,
        source: 'GOOGLE' as const,
        sourceUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(place.displayName.text)}&query_place_id=${encodeURIComponent(place.id)}`,
        attributions: place.attributions,
      })),
      sort: query.sort,
      note: 'Google Maps 검색 후보 최대 20곳 내 정렬입니다. 지역 전체 순위나 실제 방문자 수가 아닙니다.',
    };
  },
};
