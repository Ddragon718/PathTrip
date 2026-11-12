import assert from 'node:assert/strict';
import test from 'node:test';
import { communityService } from '../../dist/modules/community/community.service.js';
import { communityRepository } from '../../dist/modules/community/community.repository.js';
import { regionClient } from '../../dist/modules/community/region.client.js';
import { userService } from '../../dist/modules/users/user.service.js';
import {
  visitSchema,
  recommendationSchema,
  communityQuerySchema,
} from '../../dist/modules/community/community.dto.js';
import { env } from '../../dist/config/env.js';

const freshLocation = () => ({
  regionId: 'okinawa',
  latitude: 26.33,
  longitude: 127.8,
  accuracy: 25,
  capturedAt: new Date().toISOString(),
});
const post = {
  regionId: 'okinawa',
  category: 'CAFE',
  placeName: '방문한 카페',
  note: '조용하게 쉬기 좋은 곳이었어요.',
};

test('방문 인증은 허용 정확도와 최근 위치를 요구하고 다른 지역을 거부한다', async (t) => {
  assert.equal(
    visitSchema.safeParse({ ...freshLocation(), accuracy: 101 }).success,
    false
  );
  assert.equal(
    visitSchema.safeParse({ ...freshLocation(), latitude: 999 }).success,
    false
  );
  assert.equal(
    visitSchema.safeParse({ ...freshLocation(), verified: true }).success,
    false
  );
  t.mock.method(userService, 'getMe', async () => ({ id: 7 }));
  const reverse = t.mock.method(regionClient, 'reverse', async () => ['jeju']);
  const save = t.mock.method(communityRepository, 'verify', async () => ({}));
  await assert.rejects(
    () =>
      communityService.verify(7, {
        ...freshLocation(),
        capturedAt: new Date(Date.now() - 121_000).toISOString(),
      }),
    { code: 'LOCATION_EXPIRED' }
  );
  await assert.rejects(
    () =>
      communityService.verify(7, {
        ...freshLocation(),
        capturedAt: new Date(Date.now() + 60_000).toISOString(),
      }),
    { code: 'LOCATION_EXPIRED' }
  );
  assert.equal(reverse.mock.callCount(), 0);
  await assert.rejects(() => communityService.verify(7, freshLocation()), {
    code: 'LOCATION_NOT_IN_REGION',
  });
  assert.equal(save.mock.callCount(), 0);
});

test('방문 인증은 좌표를 저장하지 않고 서버 시각 기준 24시간만 유효하다', async (t) => {
  t.mock.method(userService, 'getMe', async () => ({ id: 7 }));
  t.mock.method(regionClient, 'reverse', async () => ['okinawa', 'naha']);
  const save = t.mock.method(communityRepository, 'verify', async () => ({}));
  const result = await communityService.verify(7, freshLocation());
  assert.equal(
    Date.parse(result.expiresAt) - Date.parse(result.verifiedAt),
    86400000
  );
  assert.deepEqual(save.mock.calls[0].arguments, [
    7,
    'okinawa',
    new Date(result.verifiedAt),
    new Date(result.expiresAt),
  ]);
});

test('추천 등록은 같은 지역의 유효한 서버 인증이 있어야 하며 클라이언트 인증 필드를 거부한다', async (t) => {
  t.mock.method(userService, 'getMe', async () => ({ id: 7 }));
  assert.equal(
    recommendationSchema.safeParse({
      ...post,
      verifiedAt: new Date().toISOString(),
    }).success,
    false
  );
  assert.equal(
    recommendationSchema.safeParse({ ...post, note: '짧음' }).success,
    false
  );
  const visit = t.mock.method(
    communityRepository,
    'findVisit',
    async () => null
  );
  const create = t.mock.method(communityRepository, 'create', async () => ({
    id: 8,
  }));
  await assert.rejects(() => communityService.create(7, post), {
    code: 'VISIT_VERIFICATION_REQUIRED',
  });
  visit.mock.mockImplementation(async () => ({
    expiresAt: new Date(Date.now() - 1),
    verifiedAt: new Date(),
  }));
  await assert.rejects(() => communityService.create(7, post), {
    code: 'VISIT_VERIFICATION_REQUIRED',
  });
  assert.equal(create.mock.callCount(), 0);
  const verifiedAt = new Date();
  visit.mock.mockImplementation(async (userId, regionId) => {
    assert.equal(regionId, 'okinawa');
    return { verifiedAt, expiresAt: new Date(Date.now() + 100000) };
  });
  assert.deepEqual(await communityService.create(7, post), { id: 8 });
  assert.equal(create.mock.calls[0].arguments[2], verifiedAt);
});

test('탈퇴한 계정은 위치 인증과 글 등록에 사용할 수 없다', async (t) => {
  t.mock.method(userService, 'getMe', async () => {
    throw Object.assign(new Error(), { statusCode: 404 });
  });
  const write = t.mock.method(communityRepository, 'create', async () => ({}));
  await assert.rejects(() => communityService.create(7, post), {
    statusCode: 404,
  });
  await assert.rejects(() => communityService.verify(7, freshLocation()), {
    statusCode: 404,
  });
  assert.equal(write.mock.callCount(), 0);
});

test('추천은 본인 또는 DB에서 확인한 관리자만 삭제한다', async (t) => {
  const user = t.mock.method(userService, 'getMe', async () => ({
    id: 7,
    role: 'USER',
  }));
  t.mock.method(communityRepository, 'findById', async () => ({ userId: 8 }));
  const remove = t.mock.method(communityRepository, 'remove', async () => ({}));
  await assert.rejects(() => communityService.remove(7, 1), {
    statusCode: 404,
  });
  assert.equal(remove.mock.callCount(), 0);
  user.mock.mockImplementation(async () => ({ id: 7, role: 'ADMIN' }));
  await communityService.remove(7, 1);
  assert.equal(remove.mock.callCount(), 1);
});

test('지역별 목록에 원래 인증 시각·삭제 권한을 표시하고 만료 인증은 숨긴다', async (t) => {
  t.mock.method(userService, 'getMe', async () => ({ id: 7, role: 'USER' }));
  t.mock.method(communityRepository, 'findVisit', async () => ({
    expiresAt: new Date(0),
  }));
  t.mock.method(communityRepository, 'list', async (query) => {
    assert.equal(query.regionId, 'okinawa');
    assert.equal(query.category, 'CAFE');
    return {
      total: 21,
      items: [
        {
          ...post,
          id: 1,
          userId: 8,
          user: { nickname: '방문자' },
          verifiedAt: new Date(1000),
          createdAt: new Date(2000),
          address: null,
        },
      ],
    };
  });
  const result = await communityService.list(
    7,
    communityQuerySchema.parse({ regionId: 'okinawa', category: 'CAFE' })
  );
  assert.equal(result.verification, null);
  assert.equal(result.totalPages, 2);
  assert.equal(result.items[0].canDelete, false);
  assert.equal(result.items[0].verifiedAt, new Date(1000).toISOString());
  assert.equal(result.items[0].userId, undefined);
});

test('역지오코딩은 도시·행정구역 ID만 사용하며 POI/국가를 인증 지역으로 쓰지 않는다', async (t) => {
  const original = env.GOOGLE_GEOCODING_API_KEY;
  t.after(() => {
    env.GOOGLE_GEOCODING_API_KEY = original;
  });
  env.GOOGLE_GEOCODING_API_KEY = 'fake-key';
  const fetch = t.mock.method(globalThis, 'fetch', async (url) => {
    assert.equal(new URL(url).searchParams.get('latlng'), '26.33,127.8');
    return Response.json({
      status: 'OK',
      results: [
        {
          place_id: 'okinawa',
          formatted_address: '오키나와',
          types: ['administrative_area_level_1', 'political'],
        },
        {
          place_id: 'restaurant',
          formatted_address: '식당',
          types: ['restaurant'],
        },
        {
          place_id: 'japan',
          formatted_address: '일본',
          types: ['country', 'political'],
        },
      ],
    });
  });
  assert.deepEqual(await regionClient.reverse(26.33, 127.8), ['okinawa']);
  fetch.mock.mockImplementation(async () =>
    Response.json({ status: 'REQUEST_DENIED' })
  );
  await assert.rejects(() => regionClient.reverse(26, 127), {
    statusCode: 502,
  });
  env.GOOGLE_GEOCODING_API_KEY = '';
  await assert.rejects(() => regionClient.reverse(26, 127), {
    statusCode: 503,
  });
});
