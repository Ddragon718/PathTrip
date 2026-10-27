import assert from 'node:assert/strict';
import test from 'node:test';
import { mapSearchQuerySchema } from '../../dist/modules/maps/maps.dto.js';
import { mapsService } from '../../dist/modules/maps/maps.service.js';
import { mapsClient } from '../../dist/modules/maps/maps.client.js';
import { env } from '../../dist/config/env.js';
import {
  createTripSchema,
  updateTripSchema,
} from '../../dist/modules/trips/trip.validator.js';
import { tripRepository } from '../../dist/modules/trips/trip.repository.js';
import { tripService } from '../../dist/modules/trips/trip.service.js';
import {
  resolveMapProvider,
  createPathTripClient,
} from '../../packages/api-client/dist/index.js';

test('자동 지도는 국내/해외를 따르고 직접 선택은 지역보다 우선한다', () => {
  assert.equal(resolveMapProvider({}), 'KAKAO');
  assert.equal(
    resolveMapProvider({ destinationType: 'DOMESTIC', mapPreference: 'AUTO' }),
    'KAKAO'
  );
  assert.equal(
    resolveMapProvider({
      destinationType: 'INTERNATIONAL',
      mapPreference: 'AUTO',
    }),
    'GOOGLE'
  );
  assert.equal(
    resolveMapProvider({
      destinationType: 'DOMESTIC',
      mapPreference: 'GOOGLE',
    }),
    'GOOGLE'
  );
  assert.equal(
    resolveMapProvider({
      destinationType: 'INTERNATIONAL',
      mapPreference: 'KAKAO',
    }),
    'KAKAO'
  );
});

test('기존 요청은 국내/자동 기본값을 사용하고 알 수 없는 제공자는 거부한다', () => {
  const trip = createTripSchema.parse({
    title: '여행',
    region: '제주',
    startDate: '2026-11-01',
    endDate: '2026-11-02',
  });
  assert.equal(trip.destinationType, 'DOMESTIC');
  assert.equal(trip.mapPreference, 'AUTO');
  assert.deepEqual(updateTripSchema.parse({ mapPreference: 'GOOGLE' }), {
    mapPreference: 'GOOGLE',
  });
  assert.equal(mapSearchQuerySchema.parse({ q: '제주' }).provider, 'KAKAO');
  assert.equal(
    mapSearchQuerySchema.safeParse({ q: '도쿄', provider: 'UNKNOWN' }).success,
    false
  );
  assert.equal(
    updateTripSchema.safeParse({ destinationType: 'unknown' }).success,
    false
  );
});

test('여행 지도 선택은 저장 후 상세/목록에서도 유지되며 타인은 변경할 수 없다', async (t) => {
  let row = {
    id: 1,
    userId: 7,
    title: '도쿄 여행',
    region: '도쿄',
    destinationType: 'DOMESTIC',
    mapPreference: 'AUTO',
    startDate: new Date('2026-11-01'),
    endDate: new Date('2026-11-02'),
    places: [],
  };
  t.mock.method(tripRepository, 'findById', async () => row);
  const update = t.mock.method(tripRepository, 'update', async (_, input) => {
    row = { ...row, ...input };
    return row;
  });
  t.mock.method(tripRepository, 'findManyByUser', async () => ({
    items: [row],
    total: 1,
  }));
  const changed = await tripService.update(7, 1, {
    destinationType: 'INTERNATIONAL',
    mapPreference: 'GOOGLE',
  });
  assert.equal(changed.mapPreference, 'GOOGLE');
  assert.equal(
    (await tripService.detail(7, 1)).destinationType,
    'INTERNATIONAL'
  );
  assert.equal(
    (await tripService.list(7, { page: 1, limit: 20 })).items[0].mapPreference,
    'GOOGLE'
  );
  await assert.rejects(
    () => tripService.update(99, 1, { mapPreference: 'KAKAO' }),
    { statusCode: 403 }
  );
  assert.equal(update.mock.callCount(), 1);
});

test('검색은 선택한 공급자로만 분기하고 같은 좌표 형식으로 응답한다', async (t) => {
  const kakao = t.mock.method(mapsClient, 'search', async () => [
    {
      place_name: '제주',
      road_address_name: '',
      address_name: '제주도',
      y: '33.5',
      x: '126.5',
    },
  ]);
  const google = t.mock.method(mapsClient, 'searchGoogle', async () => [
    {
      displayName: { text: '센소지' },
      formattedAddress: 'Tokyo',
      location: { latitude: 35.7148, longitude: 139.7967 },
    },
  ]);
  assert.deepEqual(await mapsService.search('센소지', 'GOOGLE'), [
    {
      name: '센소지',
      address: 'Tokyo',
      latitude: 35.7148,
      longitude: 139.7967,
    },
  ]);
  assert.equal(kakao.mock.callCount(), 0);
  assert.equal(
    (await mapsService.search('제주', 'KAKAO'))[0].address,
    '제주도'
  );
  assert.equal(google.mock.callCount(), 1);
});

test('Google 검색은 키를 서버 헤더로만 보내며 실패/잘못된 좌표를 처리한다', async (t) => {
  const originalKey = env.GOOGLE_PLACES_API_KEY;
  t.after(() => {
    env.GOOGLE_PLACES_API_KEY = originalKey;
  });
  env.GOOGLE_PLACES_API_KEY = 'test-key-not-real';
  const mockFetch = t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.equal(url, 'https://places.googleapis.com/v1/places:searchText');
    assert.equal(options.headers['X-Goog-Api-Key'], 'test-key-not-real');
    assert.ok(!options.headers['X-Goog-FieldMask'].includes('*'));
    assert.equal(JSON.parse(options.body).textQuery, 'Paris');
    return Response.json({
      places: [
        {
          displayName: { text: 'Paris' },
          location: { latitude: 48.85, longitude: 2.35 },
        },
      ],
    });
  });
  assert.equal((await mapsClient.searchGoogle('Paris')).length, 1);
  mockFetch.mock.mockImplementation(async () =>
    Response.json({
      places: [
        {
          displayName: { text: 'bad' },
          location: { latitude: 999, longitude: 2 },
        },
      ],
    })
  );
  await assert.rejects(() => mapsClient.searchGoogle('Paris'), {
    statusCode: 502,
  });
  mockFetch.mock.mockImplementation(async () =>
    Response.json({}, { status: 429 })
  );
  await assert.rejects(() => mapsClient.searchGoogle('Paris'), {
    statusCode: 502,
  });
  env.GOOGLE_PLACES_API_KEY = '';
  await assert.rejects(() => mapsClient.searchGoogle('Paris'), {
    statusCode: 503,
  });
});

test('공통 클라이언트는 지도 선택과 검색 제공자를 API에 전달한다', async (t) => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    calls.push({ url, options });
    return Response.json({ success: true, data: [] });
  });
  const client = createPathTripClient({
    baseUrl: 'https://api.example.test',
    getAccessToken: () => 'test-token',
  });
  await client.searchPlaces('도쿄 & 카페', 'GOOGLE');
  const url = new URL(calls[0].url);
  assert.equal(url.searchParams.get('q'), '도쿄 & 카페');
  assert.equal(url.searchParams.get('provider'), 'GOOGLE');
  await client.updateTrip(12, { mapPreference: 'KAKAO' });
  assert.equal(calls[1].options.method, 'PATCH');
  assert.deepEqual(JSON.parse(calls[1].options.body), {
    mapPreference: 'KAKAO',
  });
});
