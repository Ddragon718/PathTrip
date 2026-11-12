# PathTrip API Specification

> 이 문서는 PathTrip 서비스의 API 명세를 정의한다.
> 본 문서를 기준으로 Controller, DTO, Swagger 문서를 작성한다.

---

# 1. 공통 규칙

## 1.1 Base URL

```txt
/api/v1
```

---

## 1.2 Authentication

인증이 필요한 API는 JWT Bearer Token을 사용한다.

```txt
Authorization: Bearer {accessToken}
```

---

## 1.3 Success Response Format

```json
{
  "success": true,
  "data": {}
}
```

---

## 1.4 List Response Format

```json
{
  "success": true,
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 100,
    "totalPages": 10
  }
}
```

---

## 1.5 Error Response Format

```json
{
  "success": false,
  "code": "ERROR_CODE",
  "message": "에러 메시지"
}
```

---

## 1.6 Common Status Code

| Status | Description |
| ------ | ----------- |
| 200    | 요청 성공       |
| 201    | 생성 성공       |
| 204    | 삭제 성공       |
| 400    | 잘못된 요청      |
| 401    | 인증 실패       |
| 403    | 권한 없음       |
| 404    | 리소스 없음      |
| 409    | 중복 또는 충돌    |
| 500    | 서버 오류       |

---

## 1.7 Pagination Query

목록 조회 API는 기본적으로 page / limit 기반 pagination을 사용한다.

| Query | Type   | Required | Default | Description |
| ----- | ------ | -------- | ------- | ----------- |
| page  | number | N        | 1       | 페이지 번호      |
| limit | number | N        | 10      | 페이지 크기      |

---

# 2. Auth API

---

## 2.1 회원가입

### Method

```txt
POST
```

### Endpoint

```txt
/api/v1/auth/signup
```

### Description

사용자는 이메일, 비밀번호, 닉네임을 입력하여 회원가입할 수 있다.
일반 회원가입은 `USER` 역할로 생성되며 요청의 `role` 필드는 허용하지 않는다.
`ADMIN`은 로컬 계정 생성 스크립트 등 서버 측 절차로만 부여한다. 현재는
관리자 전용 API가 없으며 여행 소유권 검사는 역할과 무관하게 적용된다.

### Authentication

불필요

### Request Body

```json
{
  "email": "user@example.com",
  "password": "password1234",
  "nickname": "pathtrip"
}
```

### Success Response

Status

```txt
201 Created
```

Body

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "pathtrip",
    "role": "USER"
  }
}
```

### Error Response

```json
{
  "success": false,
  "code": "EMAIL_ALREADY_EXISTS",
  "message": "이미 가입된 이메일입니다."
}
```

---

## 2.2 로그인

### Method

```txt
POST
```

### Endpoint

```txt
/api/v1/auth/login
```

### Description

사용자는 이메일과 비밀번호로 로그인할 수 있다.

### Authentication

불필요

### Request Body

```json
{
  "email": "user@example.com",
  "password": "password1234"
}
```

### Success Response

Status

```txt
200 OK
```

Body

```json
{
  "success": true,
  "data": {
    "accessToken": "jwt.access.token",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "nickname": "pathtrip",
      "role": "USER"
    }
  }
}
```

### Error Response

```json
{
  "success": false,
  "code": "INVALID_CREDENTIALS",
  "message": "이메일 또는 비밀번호가 올바르지 않습니다."
}
```

---

# 3. Users API

---

## 3.1 내 정보 조회

### Method

```txt
GET
```

### Endpoint

```txt
/api/v1/users/me
```

### Description

로그인한 사용자는 자신의 정보를 조회할 수 있다.

### Authentication

JWT Required

### Success Response

Status

```txt
200 OK
```

Body

```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "nickname": "pathtrip",
    "role": "USER"
  }
}
```

### Error Response

```json
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "인증이 필요합니다."
}
```

---

# 4. Trips API

---

## 4.1 여행 생성

### Method

```txt
POST
```

### Endpoint

```txt
/api/v1/trips
```

### Description

로그인한 사용자는 여행 일정을 생성할 수 있다.

선택 필드 `destinationType`은 `DOMESTIC`(기본값) / `INTERNATIONAL`,
`mapPreference`는 `AUTO`(기본값) / `KAKAO` / `GOOGLE`이다.
자동 선택은 국내 카카오·해외 구글이며, 직접 선택한 지도는 여행 구분보다 우선한다.
두 필드는 여행 목록·상세·수정 응답에도 포함된다.

### Authentication

JWT Required

### Request Body

```json
{
  "title": "제주 여행",
  "region": "제주",
  "startDate": "2026-06-01",
  "endDate": "2026-06-03"
}
```

### Success Response

Status

```txt
201 Created
```

Body

```json
{
  "success": true,
  "data": {
    "tripId": 1
  }
}
```

### Error Response

```json
{
  "success": false,
  "code": "INVALID_DATE_RANGE",
  "message": "날짜 범위가 올바르지 않습니다."
}
```

---

## 4.2 여행 목록 조회

### Method

```txt
GET
```

### Endpoint

```txt
/api/v1/trips
```

### Description

로그인한 사용자는 자신이 생성한 여행 목록을 조회할 수 있다.

### Authentication

JWT Required

### Query Parameters

| Name  | Type   | Required | Description |
| ----- | ------ | -------- | ----------- |
| page  | number | N        | 페이지 번호      |
| limit | number | N        | 페이지 크기      |

### Success Response

Status

```txt
200 OK
```

Body

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "title": "제주 여행",
      "region": "제주",
      "startDate": "2026-06-01",
      "endDate": "2026-06-03"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## 4.3 여행 상세 조회

### Method

```txt
GET
```

### Endpoint

```txt
/api/v1/trips/:tripId
```

### Description

로그인한 사용자는 특정 여행의 상세 정보를 조회할 수 있다.

### Authentication

JWT Required

### Path Parameters

| Name   | Type   | Description |
| ------ | ------ | ----------- |
| tripId | number | 여행 ID       |

### Success Response

Status

```txt
200 OK
```

Body

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "제주 여행",
    "region": "제주",
    "startDate": "2026-06-01",
    "endDate": "2026-06-03",
    "places": []
  }
}
```

### Error Response

```json
{
  "success": false,
  "code": "TRIP_NOT_FOUND",
  "message": "여행을 찾을 수 없습니다."
}
```

---

## 4.4 여행 수정

### Method

```txt
PATCH
```

### Endpoint

```txt
/api/v1/trips/:tripId
```

### Description

로그인한 사용자는 자신이 생성한 여행 정보를 수정할 수 있다.

`destinationType`, `mapPreference`도 선택적으로 변경할 수 있다.
예: `{"destinationType":"INTERNATIONAL","mapPreference":"AUTO"}`.

### Authentication

JWT Required

### Path Parameters

| Name   | Type   | Description |
| ------ | ------ | ----------- |
| tripId | number | 여행 ID       |

### Request Body

```json
{
  "title": "제주 가족 여행",
  "region": "제주",
  "startDate": "2026-06-01",
  "endDate": "2026-06-04"
}
```

### Success Response

Status

```txt
200 OK
```

Body

```json
{
  "success": true,
  "data": {
    "id": 1,
    "title": "제주 가족 여행",
    "region": "제주",
    "startDate": "2026-06-01",
    "endDate": "2026-06-04"
  }
}
```

---

## 4.5 여행 삭제

### Method

```txt
DELETE
```

### Endpoint

```txt
/api/v1/trips/:tripId
```

### Description

로그인한 사용자는 자신이 생성한 여행을 삭제할 수 있다.

### Authentication

JWT Required

### Path Parameters

| Name   | Type   | Description |
| ------ | ------ | ----------- |
| tripId | number | 여행 ID       |

### Success Response

Status

```txt
204 No Content
```

### Error Response

```json
{
  "success": false,
  "code": "TRIP_NOT_FOUND",
  "message": "여행을 찾을 수 없습니다."
}
```

---

# 5. Places API

---

## 5.1 장소 추가

### Method

```txt
POST
```

### Endpoint

```txt
/api/v1/trips/:tripId/places
```

### Description

사용자는 특정 여행 일정에 방문 장소를 추가할 수 있다.

### Authentication

JWT Required

### Path Parameters

| Name   | Type   | Description |
| ------ | ------ | ----------- |
| tripId | number | 여행 ID       |

### Request Body

```json
{
  "name": "협재해수욕장",
  "category": "TOURIST_SPOT",
  "address": "제주특별자치도 제주시 한림읍 협재리",
  "latitude": 33.393,
  "longitude": 126.239,
  "priority": "HIGH",
  "stayTimeMinutes": 60
}
```

### Success Response

Status

```txt
201 Created
```

Body

```json
{
  "success": true,
  "data": {
    "placeId": 1
  }
}
```

### Error Response

```json
{
  "success": false,
  "code": "INVALID_COORDINATE",
  "message": "좌표 값이 올바르지 않습니다."
}
```

---

## 5.2 장소 목록 조회

### Method

```txt
GET
```

### Endpoint

```txt
/api/v1/trips/:tripId/places
```

### Description

사용자는 특정 여행에 등록된 장소 목록을 조회할 수 있다.

### Authentication

JWT Required

### Path Parameters

| Name   | Type   | Description |
| ------ | ------ | ----------- |
| tripId | number | 여행 ID       |

### Success Response

Status

```txt
200 OK
```

Body

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "협재해수욕장",
      "category": "TOURIST_SPOT",
      "address": "제주특별자치도 제주시 한림읍 협재리",
      "latitude": 33.393,
      "longitude": 126.239,
      "priority": "HIGH",
      "stayTimeMinutes": 60
    }
  ]
}
```

---

## 5.3 장소 상세 조회

### Method

```txt
GET
```

### Endpoint

```txt
/api/v1/places/:placeId
```

### Description

사용자는 특정 장소의 상세 정보를 조회할 수 있다.

### Authentication

JWT Required

### Path Parameters

| Name    | Type   | Description |
| ------- | ------ | ----------- |
| placeId | number | 장소 ID       |

### Success Response

Status

```txt
200 OK
```

Body

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "협재해수욕장",
    "category": "TOURIST_SPOT",
    "address": "제주특별자치도 제주시 한림읍 협재리",
    "latitude": 33.393,
    "longitude": 126.239,
    "priority": "HIGH",
    "stayTimeMinutes": 60
  }
}
```

---

## 5.4 장소 수정

### Method

```txt
PATCH
```

### Endpoint

```txt
/api/v1/places/:placeId
```

### Description

사용자는 자신이 추가한 장소 정보를 수정할 수 있다.

### Authentication

JWT Required

### Path Parameters

| Name    | Type   | Description |
| ------- | ------ | ----------- |
| placeId | number | 장소 ID       |

### Request Body

```json
{
  "name": "협재 해수욕장",
  "priority": "MEDIUM",
  "stayTimeMinutes": 90
}
```

### Success Response

Status

```txt
200 OK
```

Body

```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "협재 해수욕장",
    "priority": "MEDIUM",
    "stayTimeMinutes": 90
  }
}
```

---

## 5.5 장소 삭제

### Method

```txt
DELETE
```

### Endpoint

```txt
/api/v1/places/:placeId
```

### Description

사용자는 자신이 추가한 장소를 삭제할 수 있다.

### Authentication

JWT Required

### Path Parameters

| Name    | Type   | Description |
| ------- | ------ | ----------- |
| placeId | number | 장소 ID       |

### Success Response

Status

```txt
204 No Content
```

---

# 6. Maps API

---

## 6.1 장소 키워드 검색

> `provider=KAKAO`(기본값)는 카카오 Local API, `provider=GOOGLE`은 Google Places API (New)를 사용한다.
> 각각 서버의 `KAKAO_MAP_REST_API_KEY`, `GOOGLE_PLACES_API_KEY` 설정이 필요하다.
> 선택한 공급자가 실패해도 다른 공급자로 자동 전환하지 않는다.

### Method

```txt
GET
```

### Endpoint

```txt
/api/v1/maps/search
```

### Description

사용자는 키워드를 입력하여 장소를 검색할 수 있다.

### Authentication

JWT Required

### Query Parameters

| Name | Type   | Required | Description |
| ---- | ------ | -------- | ----------- |
| q    | string | Y        | 검색 키워드      |
| provider | string | N | `KAKAO` 또는 `GOOGLE`, 기본값 `KAKAO` |

### Success Response

Status

```txt
200 OK
```

Body

```json
{
  "success": true,
  "data": [
    {
      "name": "협재해수욕장",
      "address": "제주특별자치도 제주시 한림읍 협재리",
      "latitude": 33.393,
      "longitude": 126.239
    }
  ]
}
```

### Error Response

```json
{
  "success": false,
  "code": "MAP_API_ERROR",
  "message": "지도 API 요청에 실패했습니다."
}
```

---

## 6.2 주소 기반 좌표 변환

### Method

```txt
GET
```

### Endpoint

```txt
/api/v1/maps/geocode
```

### Description

사용자는 주소를 입력하여 위도와 경도를 조회할 수 있다.

### Authentication

JWT Required

### Query Parameters

| Name    | Type   | Required | Description |
| ------- | ------ | -------- | ----------- |
| address | string | Y        | 주소          |

### Success Response

Status

```txt
200 OK
```

Body

```json
{
  "success": true,
  "data": {
    "address": "제주특별자치도 제주시 한림읍 협재리",
    "latitude": 33.393,
    "longitude": 126.239
  }
}
```

---

# 7. Routes API

---

## 7.1 자동 동선 추천

> MVP 추천은 저장된 좌표의 직선거리, 장소 우선순위, 선택한 테마를 사용한다. 출발 좌표를 받지 않으므로 첫 장소까지의 이동 거리와 시간은 0이다.

### Method

```txt
POST
```

### Endpoint

```txt
/api/v1/trips/:tripId/routes/recommend
```

### Description

여행에 등록된 장소를 기반으로 효율적인 추천 동선을 생성한다.

### Authentication

JWT Required

### Path Parameters

| Name   | Type   | Description |
| ------ | ------ | ----------- |
| tripId | number | 여행 ID       |

### Request Body

```json
{
  "startTime": "2026-06-01T09:00:00Z",
  "transportType": "CAR",
  "optimizationType": "TIME"
}
```

### Success Response

Status

```txt
200 OK
```

Body

```json
{
  "success": true,
  "data": {
    "recommendedPlaces": [
      {
        "placeId": 1,
        "name": "협재해수욕장",
        "visitOrder": 1,
        "estimatedArrivalTime": "2026-06-01T09:30:00Z",
        "moveTimeFromPreviousMinutes": 30,
        "distanceFromPreviousMeters": 12000
      }
    ],
    "totalMoveTimeMinutes": 90,
    "totalDistanceMeters": 25000
  }
}
```

### Error Response

```json
{
  "success": false,
  "code": "NOT_ENOUGH_PLACES",
  "message": "동선 추천을 위해 최소 2개 이상의 장소가 필요합니다."
}
```

---

## 7.2 추천 동선 저장

### Method

```txt
POST
```

### Endpoint

```txt
/api/v1/trips/:tripId/routes
```

### Description

사용자는 추천된 동선을 저장할 수 있다.

### Authentication

JWT Required

### Path Parameters

| Name   | Type   | Description |
| ------ | ------ | ----------- |
| tripId | number | 여행 ID       |

### Request Body

```json
{
  "name": "제주 1일차 추천 동선",
  "optimizationType": "TIME",
  "totalDistanceMeters": 25000,
  "totalMoveTimeMinutes": 90,
  "places": [
    {
      "placeId": 1,
      "visitOrder": 1,
      "estimatedArrivalTime": "2026-06-01T09:30:00Z",
      "moveTimeFromPreviousMinutes": 30,
      "distanceFromPreviousMeters": 12000
    }
  ]
}
```

### Success Response

Status

```txt
201 Created
```

Body

```json
{
  "success": true,
  "data": {
    "routeId": 1
  }
}
```

---

## 7.3 추천 동선 조회

### Method

```txt
GET
```

### Endpoint

```txt
/api/v1/trips/:tripId/routes
```

### Description

사용자는 저장된 추천 동선을 조회할 수 있다.

### Authentication

JWT Required

### Path Parameters

| Name   | Type   | Description |
| ------ | ------ | ----------- |
| tripId | number | 여행 ID       |

### Success Response

Status

```txt
200 OK
```

Body

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "제주 1일차 추천 동선",
      "optimizationType": "TIME",
      "totalDistanceMeters": 25000,
      "totalMoveTimeMinutes": 90,
      "places": [
        {
          "placeId": 1,
          "name": "협재해수욕장",
          "visitOrder": 1
        }
      ]
    }
  ]
}
```

---

# 8. Error Code 목록

| Code                      | Description     |
| ------------------------- | --------------- |
| INVALID_INPUT             | 입력값이 올바르지 않음    |
| UNAUTHORIZED              | 인증 필요           |
| FORBIDDEN                 | 권한 없음           |
| EMAIL_ALREADY_EXISTS      | 이미 가입된 이메일      |
| INVALID_CREDENTIALS       | 이메일 또는 비밀번호 불일치 |
| USER_NOT_FOUND            | 사용자 없음          |
| TRIP_NOT_FOUND            | 여행 없음           |
| PLACE_NOT_FOUND           | 장소 없음           |
| ROUTE_NOT_FOUND           | 추천 동선 없음        |
| INVALID_DATE_RANGE        | 날짜 범위 오류        |
| INVALID_COORDINATE        | 좌표 오류           |
| INVALID_PLACE_CATEGORY    | 장소 카테고리 오류      |
| NOT_ENOUGH_PLACES         | 동선 추천 장소 부족     |
| PLACE_COORDINATE_REQUIRED | 장소 좌표 필요        |
| MAP_API_ERROR             | 지도 API 오류       |

---

# 9. 추후 추가 예정 API

## 리뷰 API

```txt
POST /api/v1/places/:placeId/reviews
GET /api/v1/places/:placeId/reviews
```

## 추천 동선 공유 API

```txt
POST /api/v1/routes/:routeId/publish
GET /api/v1/public-routes
POST /api/v1/routes/:routeId/bookmark
```

## 크리에이터 API

```txt
POST /api/v1/creators
GET /api/v1/creators/:creatorId/routes
POST /api/v1/creators/:creatorId/follow
```

## 매장 문의 API

```txt
POST /api/v1/places/:placeId/inquiries
GET /api/v1/places/:placeId/inquiries
```
# 지역별 장소 추천

`GET /api/v1/discovery` — Bearer 인증 필수, 분당 30회 IP 제한.

Query: `region`(1–100자, 필수), `category`(TOURIST_SPOT/RESTAURANT/CAFE/PHOTO_SPOT/HOTEL/ETC, 기본 TOURIST_SPOT), `provider`(GOOGLE/KAKAO, 기본 GOOGLE), `sort`(REVIEWS/RATING/RELEVANCE, 기본 REVIEWS), `q`(선택, 최대 100자).

성공: `{ success: true, data: { items: [{ id, name, address, latitude, longitude, category, source, rating, reviewCount, sourceUrl, attributions, googlePlaceId? }], sort, note } }`. 평점·리뷰 수가 없으면 `null`. 카카오는 항상 RELEVANCE. 오류: INVALID_INPUT(400), UNAUTHORIZED(401), MAP_API_ERROR(502 외부 오류/503 키 미설정), 429 요청 제한.

장소 생성 `POST /api/v1/trips/:tripId/places`에 선택 필드 `googlePlaceId`(1–256자 영숫자/밑줄/하이픈)를 추가한다. 기존 필수 입력은 동일하다. ID가 있으면 공급자 정보를 조회해 유효성을 확인하고 이름·주소·좌표 대신 ID만 영구 저장한다. 장소 상세/여행 상세에는 최신 정보 및 `googlePlaceId`, `attributions`를 반환한다. 조회 실패 시 `locationUnavailable: true`이며 좌표를 사용하면 안 된다. Google 장소의 이름/주소/좌표 수정은 INVALID_INPUT(400). 동선 계산은 최신 위치를 가져오지 못하면 MAP_API_ERROR로 중단한다.
