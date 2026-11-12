import type {
  DiscoveryInput,
  DiscoveryResult,
  PlaceCategory,
} from './index.js';

export const discoveryCategories: Array<{
  value: PlaceCategory;
  label: string;
}> = [
  { value: 'TOURIST_SPOT', label: '관광' },
  { value: 'RESTAURANT', label: '맛집' },
  { value: 'CAFE', label: '카페' },
  { value: 'PHOTO_SPOT', label: '사진' },
  { value: 'HOTEL', label: '숙소' },
  { value: 'ETC', label: '기타' },
];

// Preview fixtures only. Never present these as live ratings or verified visits.
export function previewDiscovery(input: DiscoveryInput): DiscoveryResult {
  const region = /오키나와|okinawa/i.test(input.region)
    ? '오키나와'
    : /제주|jeju/i.test(input.region)
      ? '제주'
      : null;
  const attractions =
    region === '오키나와'
      ? ['오키나와 츄라우미 수족관', '슈리성 공원', '만좌모']
      : ['성산일출봉', '한라산', '협재 해변'];
  const label =
    discoveryCategories.find((item) => item.value === input.category)?.label ??
    '장소';
  const names =
    input.category === 'TOURIST_SPOT'
      ? attractions
      : input.category === 'PHOTO_SPOT'
        ? ['바다 전망 포토 스폿', '골목 산책 포토 스폿']
        : [`${label} 예시 1`, `${label} 예시 2`];
  return {
    items: region
      ? names
          .map((name, index) => ({
            id: `demo:${region}:${input.category}:${index}`,
            name,
            address: `${region} · 화면 확인용 샘플 (위치도 예시입니다)`,
            latitude: (region === '오키나와' ? 26.33 : 33.38) + index * 0.04,
            longitude: (region === '오키나와' ? 127.8 : 126.55) + index * 0.03,
            category: input.category,
            source: 'DEMO' as const,
            rating: null,
            reviewCount: null,
            sourceUrl: null,
            attributions: [],
          }))
          .filter((item) => !input.q || item.name.includes(input.q))
      : [],
    sort: 'RELEVANCE',
    note: '미리보기 샘플 · 실제 순위·리뷰·위치가 아닙니다. 로그인 및 지도 API 연결 후 실시간 추천을 제공합니다.',
  };
}
