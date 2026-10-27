import assert from 'node:assert/strict';
import test from 'node:test';
import { signupSchema } from '../../dist/modules/auth/auth.validator.js';
import {
  createTripSchema,
  tripIdParamsSchema,
} from '../../dist/modules/trips/trip.validator.js';
import { saveRouteSchema } from '../../dist/modules/routes/route.validator.js';
import { kakaoKeywordResponseSchema } from '../../dist/modules/maps/maps.dto.js';

test('회원가입 이메일을 소문자로 정규화한다', () => {
  const parsed = signupSchema.parse({
    email: 'USER@Example.com',
    password: 'password1234',
    nickname: '여행자',
  });
  assert.equal(parsed.email, 'user@example.com');
});

test('일반 회원가입 요청으로 ADMIN 역할을 지정할 수 없다', () => {
  assert.equal(
    signupSchema.safeParse({
      email: 'admin-attempt@example.com',
      password: 'password1234',
      nickname: '테스트',
      role: 'ADMIN',
    }).success,
    false
  );
});

test('bcrypt 한계를 넘는 다중 바이트 비밀번호는 거부한다', () => {
  const parsed = signupSchema.safeParse({
    email: 'user@example.com',
    password: '가'.repeat(25),
    nickname: '여행자',
  });
  assert.equal(parsed.success, false);
});

test('PostgreSQL 정수 범위를 넘는 ID는 거부한다', () => {
  assert.equal(
    tripIdParamsSchema.safeParse({ tripId: '2147483648' }).success,
    false
  );
});

test('잘못된 날짜 형식은 거부한다', () => {
  const parsed = createTripSchema.safeParse({
    title: '제주 여행',
    region: '제주',
    startDate: '2026/06/03',
    endDate: '2026-06-01',
  });
  assert.equal(parsed.success, false);
});

test('달력에 존재하지 않는 날짜는 거부한다', () => {
  const parsed = createTripSchema.safeParse({
    title: '제주 여행',
    region: '제주',
    startDate: '2026-02-30',
    endDate: '2026-03-02',
  });
  assert.equal(parsed.success, false);
});

test('저장 경로의 방문 순서는 연속되어야 한다', () => {
  const parsed = saveRouteSchema.safeParse({
    optimizationType: 'TIME',
    totalDistanceMeters: 100,
    totalMoveTimeMinutes: 10,
    places: [
      { placeId: 1, visitOrder: 1 },
      { placeId: 2, visitOrder: 3 },
    ],
  });
  assert.equal(parsed.success, false);
});

test('지도 API의 숫자가 아닌 좌표 응답은 거부한다', () => {
  const parsed = kakaoKeywordResponseSchema.safeParse({
    documents: [
      {
        place_name: '테스트 장소',
        address_name: '제주',
        road_address_name: '',
        x: 'not-a-coordinate',
        y: '33.4',
      },
    ],
  });
  assert.equal(parsed.success, false);
});
