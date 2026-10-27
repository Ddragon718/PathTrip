import assert from 'node:assert/strict';
import test from 'node:test';
import {
  haversineDistanceMeters,
  recommendRoute,
} from '../../dist/constants/route-policy.js';

const places = [
  {
    id: 1,
    name: '협재해수욕장',
    category: 'TOURIST_SPOT',
    priority: 'HIGH',
    latitude: 33.393,
    longitude: 126.239,
    stayTimeMinutes: 60,
  },
  {
    id: 2,
    name: '한림공원',
    category: 'TOURIST_SPOT',
    priority: 'MEDIUM',
    latitude: 33.389,
    longitude: 126.239,
    stayTimeMinutes: 90,
  },
  {
    id: 3,
    name: '애월카페',
    category: 'CAFE',
    priority: 'LOW',
    latitude: 33.463,
    longitude: 126.31,
    stayTimeMinutes: 45,
  },
];

test('같은 좌표의 거리는 0이다', () => {
  assert.equal(haversineDistanceMeters(places[0], places[0]), 0);
});

test('경로 추천은 모든 장소를 한 번씩 방문하고 합계를 계산한다', () => {
  const result = recommendRoute(
    places,
    new Date('2026-06-01T09:00:00Z'),
    'CAR',
    'TIME'
  );
  assert.equal(result.recommendedPlaces.length, 3);
  assert.deepEqual(
    new Set(result.recommendedPlaces.map((place) => place.placeId)),
    new Set([1, 2, 3])
  );
  assert.deepEqual(
    result.recommendedPlaces.map((place) => place.visitOrder),
    [1, 2, 3]
  );
  assert.equal(result.recommendedPlaces[0].distanceFromPreviousMeters, 0);
  assert.ok(result.totalDistanceMeters > 0);
  assert.ok(result.totalMoveTimeMinutes > 0);
});

test('장소가 두 개 미만이면 추천할 수 없다', () => {
  assert.throws(
    () => recommendRoute(places.slice(0, 1), new Date(), 'WALK', 'DISTANCE'),
    /At least two places/
  );
});

test('좌표가 같은 장소 사이의 이동 시간은 0이다', () => {
  const sameLocation = [places[0], { ...places[1], latitude: 33.393 }];
  const result = recommendRoute(
    sameLocation,
    new Date('2026-06-01T09:00:00Z'),
    'WALK',
    'DISTANCE'
  );
  assert.equal(result.totalDistanceMeters, 0);
  assert.equal(result.totalMoveTimeMinutes, 0);
});
