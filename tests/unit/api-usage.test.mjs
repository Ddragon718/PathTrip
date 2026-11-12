import assert from 'node:assert/strict';
import test from 'node:test';
import { env } from '../../dist/config/env.js';
import {
  apiUsageService,
  usagePeriod,
} from '../../dist/modules/api-usage/api-usage.service.js';
import { apiUsageRepository } from '../../dist/modules/api-usage/api-usage.repository.js';
import { discoveryClient } from '../../dist/modules/discovery/discovery.client.js';
import { mapsClient } from '../../dist/modules/maps/maps.client.js';
import { regionClient } from '../../dist/modules/community/region.client.js';

function configure(t, enabled) {
  const original = { ...env };
  t.after(() => Object.assign(env, original));
  Object.assign(env, {
    GOOGLE_PLACES_API_KEY: 'fake-test-key',
    GOOGLE_GEOCODING_API_KEY: 'fake-test-key',
    KAKAO_MAP_REST_API_KEY: 'fake-test-key',
    GOOGLE_MAPS_REQUESTS_ENABLED: enabled,
    KAKAO_MAPS_REQUESTS_ENABLED: enabled,
  });
}
const calls = [
  ['GOOGLE_TEXT_SEARCH', () => discoveryClient.google('오키나와', 'CAFE', '')],
  ['GOOGLE_TEXT_SEARCH', () => mapsClient.searchGoogle('오키나와')],
  ['GOOGLE_PLACE_DETAILS', () => discoveryClient.googleDetails('place-id')],
  ['GOOGLE_GEOCODING', () => regionClient.resolve('오키나와')],
  ['GOOGLE_GEOCODING', () => regionClient.reverse(26, 127)],
  ['KAKAO_LOCAL', () => discoveryClient.kakao('제주', 'CAFE', '')],
  ['KAKAO_LOCAL', () => mapsClient.search('제주')],
  ['KAKAO_LOCAL', () => mapsClient.geocode('제주')],
];

test('키가 있어도 사용을 켜기 전에는 모든 장소·지역 API가 DB와 외부 요청을 차단한다', async (t) => {
  configure(t, false);
  const reserve = t.mock.method(
    apiUsageRepository,
    'reserve',
    async () => true
  );
  const fetch = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('must not request');
  });
  for (const [, call] of calls) {
    await assert.rejects(call, {
      code: 'MAP_REQUESTS_DISABLED',
      statusCode: 503,
    });
  }
  assert.equal(reserve.mock.callCount(), 0);
  assert.equal(fetch.mock.callCount(), 0);
});

test('한도 초과와 DB 장애는 모든 외부 호출 직전에 차단하고 오류를 그대로 전달한다', async (t) => {
  configure(t, true);
  const fetch = t.mock.method(globalThis, 'fetch', async () => {
    throw new Error('must not request');
  });
  const reserve = t.mock.method(
    apiUsageRepository,
    'reserve',
    async () => false
  );
  for (const [service, call] of calls) {
    await assert.rejects(call, {
      code: 'MAP_USAGE_LIMIT_REACHED',
      statusCode: 429,
    });
    assert.equal(reserve.mock.calls.at(-1).arguments[0], service);
  }
  reserve.mock.mockImplementation(async () => {
    throw new Error('DB down');
  });
  for (const [, call] of calls) {
    await assert.rejects(call, {
      code: 'MAP_USAGE_UNAVAILABLE',
      statusCode: 503,
    });
  }
  assert.equal(fetch.mock.callCount(), 0);
});

test('공급자 오류도 시도로 집계하며 자동 재시도하지 않는다', async (t) => {
  configure(t, true);
  let reserved = false;
  const reserve = t.mock.method(
    apiUsageRepository,
    'reserve',
    async (...args) => {
      assert.deepEqual(args.slice(3), [20, 600]);
      reserved = true;
      return true;
    }
  );
  const fetch = t.mock.method(globalThis, 'fetch', async () => {
    assert.equal(reserved, true);
    return Response.json({}, { status: 500 });
  });
  await assert.rejects(() => discoveryClient.google('오키나와', 'CAFE', ''), {
    statusCode: 502,
  });
  assert.equal(reserve.mock.callCount(), 1);
  assert.equal(fetch.mock.callCount(), 1);
});

test('누락된 키로는 사용량을 소비하지 않는다', async (t) => {
  configure(t, true);
  env.GOOGLE_PLACES_API_KEY = '';
  const reserve = t.mock.method(
    apiUsageRepository,
    'reserve',
    async () => true
  );
  await assert.rejects(() => discoveryClient.google('오키나와', 'CAFE', ''), {
    code: 'MAP_API_ERROR',
  });
  assert.equal(reserve.mock.callCount(), 0);
});

test('사용량 기간은 Google 태평양 시각과 카카오 한국 시각으로 월 경계·서머타임을 계산한다', () => {
  assert.deepEqual(
    usagePeriod('GOOGLE_TEXT_SEARCH', new Date('2026-12-01T07:59:59Z')),
    { day: '2026-11-30', month: '2026-11' }
  );
  assert.deepEqual(
    usagePeriod('GOOGLE_TEXT_SEARCH', new Date('2026-12-01T08:00:00Z')),
    { day: '2026-12-01', month: '2026-12' }
  );
  assert.deepEqual(
    usagePeriod('GOOGLE_TEXT_SEARCH', new Date('2026-07-01T07:00:00Z')),
    { day: '2026-07-01', month: '2026-07' }
  );
  assert.deepEqual(
    usagePeriod('KAKAO_LOCAL', new Date('2026-11-30T15:00:00Z')),
    { day: '2026-12-01', month: '2026-12' }
  );
});
