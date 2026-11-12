import assert from 'node:assert/strict';
import test from 'node:test';
import { discoveryClient } from '../../dist/modules/discovery/discovery.client.js';
import { discoveryService } from '../../dist/modules/discovery/discovery.service.js';
import {
  discoveryQuerySchema,
  kakaoDiscoveryResponseSchema,
} from '../../dist/modules/discovery/discovery.dto.js';
import { placeService } from '../../dist/modules/places/place.service.js';
import { resolvePlaceData } from '../../dist/modules/places/place-data.js';
import { placeRepository } from '../../dist/modules/places/place.repository.js';
import { tripRepository } from '../../dist/modules/trips/trip.repository.js';
import {
  createPathTripClient,
  previewDiscovery,
  discoveryPlaceInput,
} from '../../packages/api-client/dist/index.js';
import { env } from '../../dist/config/env.js';

const candidate = (id, count, rating) => ({
  id,
  displayName: { text: id },
  formattedAddress: 'Okinawa',
  location: { latitude: 26.3, longitude: 127.8 },
  userRatingCount: count,
  rating,
  attributions: [],
});
const query = discoveryQuerySchema.parse({ region: '오키나와' });

test('검색어 없이 지역·분류로 추천하고 후보 안에서 리뷰 수/평점순을 정렬한다', async (t) => {
  const call = t.mock.method(discoveryClient, 'google', async () => [
    candidate('b', 5, 4.9),
    candidate('a', 200, 4.2),
    candidate('c', undefined, undefined),
    candidate('b', 5, 4.9),
    { ...candidate('closed', 9999, 5), businessStatus: 'CLOSED_PERMANENTLY' },
  ]);
  assert.deepEqual(
    (await discoveryService.list(query)).items.map((p) => p.name),
    ['a', 'b', 'c']
  );
  assert.deepEqual(call.mock.calls[0].arguments, [
    '오키나와',
    'TOURIST_SPOT',
    '',
  ]);
  assert.deepEqual(
    (await discoveryService.list({ ...query, sort: 'RATING' })).items.map(
      (p) => p.name
    ),
    ['b', 'a', 'c']
  );
  assert.equal((await discoveryService.list(query)).items[2].reviewCount, null);
});

test('카카오에 존재하지 않는 평점·리뷰를 만들지 않고 잘못된 좌표를 거부한다', async (t) => {
  t.mock.method(discoveryClient, 'kakao', async () => [
    {
      id: '123',
      place_name: '카페',
      road_address_name: '',
      address_name: '제주',
      x: 126.5,
      y: 33.5,
    },
  ]);
  const result = await discoveryService.list({
    ...query,
    region: '제주',
    provider: 'KAKAO',
  });
  assert.equal(result.sort, 'RELEVANCE');
  assert.equal(result.items[0].reviewCount, null);
  assert.equal(result.items[0].rating, null);
  assert.equal(
    kakaoDiscoveryResponseSchema.safeParse({
      documents: [
        {
          id: '1',
          place_name: 'bad',
          road_address_name: '',
          address_name: '',
          x: '',
          y: '33',
        },
      ],
    }).success,
    false
  );
  assert.equal(
    discoveryQuerySchema.safeParse({ region: '', category: 'UNKNOWN' }).success,
    false
  );
});

test('Google 요청은 지역·분류·명시적 필드만 전달하고 서버 오류를 변환한다', async (t) => {
  const original = env.GOOGLE_PLACES_API_KEY;
  t.after(() => {
    env.GOOGLE_PLACES_API_KEY = original;
  });
  env.GOOGLE_PLACES_API_KEY = 'fake-key';
  const fetch = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://places.googleapis.com/v1/places:searchText');
    const body = JSON.parse(options.body);
    assert.equal(body.textQuery, '오키나와 음식점');
    assert.equal(body.includedType, 'restaurant');
    assert.equal(body.strictTypeFiltering, true);
    assert.ok(
      options.headers['X-Goog-FieldMask'].includes('places.userRatingCount')
    );
    assert.ok(!options.headers['X-Goog-FieldMask'].includes('*'));
    return Response.json({ places: [candidate('id', 42, 4)] });
  });
  assert.equal(
    (await discoveryClient.google('오키나와', 'RESTAURANT', ''))[0]
      .userRatingCount,
    42
  );
  fetch.mock.mockImplementation(async () => Response.json({}, { status: 403 }));
  await assert.rejects(() => discoveryClient.google('오키나와', 'CAFE', ''), {
    statusCode: 502,
  });
  env.GOOGLE_PLACES_API_KEY = '';
  await assert.rejects(() => discoveryClient.google('오키나와', 'CAFE', ''), {
    statusCode: 503,
  });
});

test('Google 장소는 ID만 영구 저장하고 새 정보로 읽으며 조회 실패 시 0,0을 유효 위치로 내보내지 않는다', async (t) => {
  t.mock.method(tripRepository, 'findById', async () => ({ id: 1, userId: 7 }));
  const details = t.mock.method(discoveryClient, 'googleDetails', async () =>
    candidate('abc', 30, 4)
  );
  let saved;
  t.mock.method(placeRepository, 'create', async (input) => {
    saved = { id: 3, ...input };
    return saved;
  });
  await placeService.create(7, 1, {
    googlePlaceId: 'abc',
    name: 'must not persist',
    address: 'must not persist',
    latitude: 26.3,
    longitude: 127.8,
    category: 'CAFE',
    priority: 'MEDIUM',
    stayTimeMinutes: 60,
  });
  assert.equal(saved.googlePlaceId, 'abc');
  assert.equal(saved.name, 'Google Maps 장소');
  assert.equal(saved.address, undefined);
  assert.equal(saved.latitude, 0);
  assert.equal((await resolvePlaceData(saved)).name, 'abc');
  details.mock.mockImplementation(async () => {
    throw new Error('unavailable');
  });
  assert.equal((await resolvePlaceData(saved)).locationUnavailable, true);
  await assert.rejects(() => resolvePlaceData(saved, true));
  t.mock.method(placeRepository, 'findById', async () => saved);
  await assert.rejects(() => placeService.update(7, 3, { name: 'override' }), {
    statusCode: 400,
  });
  await assert.rejects(
    () => placeService.create(8, 1, { googlePlaceId: 'abc' }),
    { statusCode: 403 }
  );
});

test('미리보기는 지역이 다른 샘플이나 가짜 리뷰 수를 표시하지 않는다', () => {
  const result = previewDiscovery(query);
  assert.ok(result.items.length > 0);
  assert.ok(
    result.items.every(
      (item) =>
        item.address.includes('오키나와') &&
        item.source === 'DEMO' &&
        item.reviewCount === null
    )
  );
  assert.equal(previewDiscovery({ ...query, region: '파리' }).items.length, 0);
});

test('추천 담기는 빈 주소를 생략하고 Google 공급자 콘텐츠 대신 ID만 보낸다', () => {
  const sample = previewDiscovery(query).items[0];
  assert.equal(
    discoveryPlaceInput({ ...sample, address: '' }).address,
    undefined
  );
  const input = discoveryPlaceInput({
    ...sample,
    source: 'GOOGLE',
    googlePlaceId: 'abc',
  });
  assert.equal(input.name, 'Google Maps 장소');
  assert.equal(input.googlePlaceId, 'abc');
  assert.equal(input.address, undefined);
  assert.equal(input.latitude, 0);
});

test('공통 클라이언트가 지역과 분류를 URL 인코딩하고 인증을 전달한다', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(new URL(url).searchParams.get('region'), '오키나와 & 나하');
    assert.equal(new URL(url).searchParams.get('category'), 'CAFE');
    assert.equal(options.headers.Authorization, 'Bearer fake-token');
    return Response.json({
      success: true,
      data: { items: [], sort: 'REVIEWS', note: '' },
    });
  });
  await createPathTripClient({
    baseUrl: 'https://example.test',
    getAccessToken: () => 'fake-token',
  }).discoverPlaces({ ...query, region: '오키나와 & 나하', category: 'CAFE' });
});
