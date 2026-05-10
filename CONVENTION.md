# PathTrip Backend Convention

> 이 문서는 PathTrip 백엔드 프로젝트의 공통 개발 컨벤션이다.  
> 사람 개발자와 LLM은 코드를 생성, 수정, 리팩토링할 때 반드시 이 문서를 최우선 기준으로 따른다.  
> 이 문서에 명시된 규칙과 충돌하는 코드는 작성하지 않는다.

---

# 0. 문서 목적

이 문서는 다음을 명확히 하기 위해 작성한다.

- 기술 스택 기준
- 폴더 구조 기준
- 레이어별 책임 기준
- 네이밍 기준
- TypeScript 사용 기준
- 검증 기준
- Prisma 사용 기준
- 에러 처리 기준
- API 응답 기준
- 인증 기준
- 날짜/시간 기준
- Pagination / Sorting / Filtering 기준
- Git 기준
- Swagger 기준
- LLM 코드 생성 기준

---

# 1. 프로젝트 개요

## 서비스명

PathTrip

## 서비스 정의

PathTrip은 사용자가 가고 싶은 장소, 맛집, 카페, 숙소 등을 입력하면 위치와 이동 시간을 고려하여 효율적인 여행 동선을 자동 추천하는 서비스다.

## 핵심 목표

- 사용자가 여행 일정을 생성할 수 있다.
- 사용자가 여행 일정에 장소를 추가할 수 있다.
- 장소의 좌표와 이동 시간을 기반으로 효율적인 동선을 추천할 수 있다.
- 추천된 동선을 저장하고 조회할 수 있다.
- 지도 API를 활용해 장소 검색, 좌표 변환, 이동 시간 계산을 수행할 수 있다.

---

# 2. 기술 스택 규칙

## Runtime

- Node.js

## Language

- TypeScript

## Framework

- Express

## ORM

- Prisma

## Database

- PostgreSQL

## Validation

- Zod

## API Documentation

- Swagger / OpenAPI

## Package Manager

- npm

## Date Library

- dayjs

## Password Hashing

- bcrypt

## Authentication

- JWT Bearer Token

## Formatting

- ESLint
- Prettier

---

# 3. Runtime / Language 개념 규칙

## Node.js와 TypeScript의 역할

```txt
Node.js     = JavaScript 실행 런타임
TypeScript  = JavaScript에 타입 시스템을 추가한 언어
```

## 실행 흐름

```txt
TypeScript 코드 작성
↓
JavaScript로 컴파일
↓
Node.js가 JavaScript 실행
```

## TypeScript를 사용하는 이유

- 컴파일 단계에서 오류를 발견하기 위함
- 런타임 오류를 줄이기 위함
- 유지보수성을 높이기 위함
- 도메인 모델과 API 입력/출력을 명확히 하기 위함
- LLM이 코드를 생성할 때 타입 안정성을 유지하기 위함

---

# 4. 프로젝트 디렉토리 구조 규칙

## 기본 구조

```txt
pathtrip/
├── .env.sample
├── .gitignore
├── .prettierrc.json
├── eslint.config.js
├── README.md
├── package.json
├── tsconfig.json
├── prisma/
│   └── schema.prisma
├── docs/
│   ├── conventions.md
│   ├── requirements.md
│   └── api-spec.md
└── src/
    ├── app.ts
    ├── server.ts
    ├── config/
    │   ├── env.ts
    │   └── swagger.ts
    ├── constants/
    │   ├── error-code.ts
    │   ├── route-policy.ts
    │   ├── place-category.ts
    │   └── index.ts
    ├── middlewares/
    │   ├── auth.middleware.ts
    │   ├── validate.middleware.ts
    │   └── error.middleware.ts
    ├── modules/
    │   ├── auth/
    │   │   ├── auth.controller.ts
    │   │   ├── auth.service.ts
    │   │   ├── auth.repository.ts
    │   │   ├── auth.route.ts
    │   │   ├── auth.validator.ts
    │   │   └── auth.type.ts
    │   ├── users/
    │   │   ├── user.controller.ts
    │   │   ├── user.service.ts
    │   │   ├── user.repository.ts
    │   │   ├── user.route.ts
    │   │   ├── user.validator.ts
    │   │   └── user.type.ts
    │   ├── trips/
    │   │   ├── trip.controller.ts
    │   │   ├── trip.service.ts
    │   │   ├── trip.repository.ts
    │   │   ├── trip.route.ts
    │   │   ├── trip.validator.ts
    │   │   └── trip.type.ts
    │   ├── places/
    │   │   ├── place.controller.ts
    │   │   ├── place.service.ts
    │   │   ├── place.repository.ts
    │   │   ├── place.route.ts
    │   │   ├── place.validator.ts
    │   │   └── place.type.ts
    │   ├── routes/
    │   │   ├── route.controller.ts
    │   │   ├── route.service.ts
    │   │   ├── route.repository.ts
    │   │   ├── route.route.ts
    │   │   ├── route.validator.ts
    │   │   └── route.type.ts
    │   └── maps/
    │       ├── map.controller.ts
    │       ├── map.service.ts
    │       ├── map.client.ts
    │       ├── map.route.ts
    │       ├── map.validator.ts
    │       └── map.type.ts
    ├── types/
    │   └── express.d.ts
    └── utils/
        ├── AppError.ts
        ├── asyncHandler.ts
        ├── response.ts
        └── pagination.ts
```

## 폴더 구조 변경 규칙

- 기존 폴더 구조를 임의로 변경하지 않는다.
- 새 기능은 반드시 해당 도메인 모듈 내부에 추가한다.
- 공통 유틸은 `src/utils`에 둔다.
- 공통 상수는 `src/constants`에 둔다.
- 환경설정은 `src/config`에 둔다.
- 문서는 `docs`에 둔다.

---

# 5. 디렉토리 역할 규칙

## `prisma/`

DB schema와 migration을 관리한다.

- `schema.prisma`: Prisma 모델, enum, relation 정의

## `docs/`

프로젝트 문서를 관리한다.

- `conventions.md`: 개발 컨벤션
- `requirements.md`: 기능 요구사항
- `api-spec.md`: API 명세서

## `src/app.ts`

Express 앱 공통 설정을 담당한다.

역할:

- JSON body parser 등록
- CORS 등록
- API route 등록
- Swagger 등록
- 공통 error middleware 등록

금지:

- 서버 실행 금지
- DB 로직 작성 금지
- 비즈니스 로직 작성 금지

## `src/server.ts`

서버 실행만 담당한다.

역할:

- PORT 설정
- `app.listen()` 실행

금지:

- route 등록 금지
- middleware 등록 금지
- 비즈니스 로직 작성 금지

## `src/config/`

설정 파일을 관리한다.

- `env.ts`: 환경변수 검증 및 export
- `swagger.ts`: Swagger 설정

## `src/constants/`

프로젝트 전체에서 공유하는 고정값을 관리한다.

예시:

- 에러 코드
- 장소 카테고리
- 동선 추천 정책
- 페이지네이션 기본값

## `src/middlewares/`

요청 처리 중간에 실행되는 공통 로직을 관리한다.

예시:

- 인증
- 요청 검증
- 에러 처리

## `src/modules/`

도메인별 기능을 관리한다.

도메인 기준:

```txt
auth   = 인증
users  = 사용자 정보
trips  = 여행 묶음
places = 방문 장소
routes = 추천 동선
maps   = 지도 API 연동
```

## `src/types/`

전역 타입 확장을 관리한다.

예시:

- Express Request에 `user` 속성 추가

## `src/utils/`

여러 모듈에서 재사용되는 공통 도구를 관리한다.

예시:

- AppError
- asyncHandler
- response
- pagination

---

# 6. 아키텍처 규칙

## 기본 아키텍처

Layered Architecture를 사용한다.

```txt
Route
↓
Middleware
↓
Controller
↓
Service
↓
Repository / Client
↓
Database / External API
```

## API 요청 흐름

```txt
Client Request
↓
app.ts
↓
*.route.ts
↓
auth.middleware.ts
↓
validate.middleware.ts
↓
*.controller.ts
↓
*.service.ts
↓
*.repository.ts or *.client.ts
↓
Database or External API
↓
*.service.ts
↓
*.controller.ts
↓
successResponse / errorMiddleware
↓
Client Response
```

---

# 7. 레이어별 책임 규칙

## 7.1 Route Layer

### 역할

- API endpoint 정의
- HTTP method 정의
- middleware 연결
- controller 연결

### 허용

```ts
router.post(
  "/",
  authMiddleware,
  validate(createTripSchema),
  asyncHandler(tripController.createTrip),
);
```

### 금지

- 비즈니스 로직 작성 금지
- Prisma 접근 금지
- 외부 API 호출 금지
- request body 직접 검증 금지
- response 직접 반환 금지

---

## 7.2 Middleware Layer

### 역할

- 인증 처리
- 요청 검증 처리
- 공통 에러 처리
- 공통 전처리

### 대표 파일

```txt
auth.middleware.ts
validate.middleware.ts
error.middleware.ts
```

### 금지

- 도메인 비즈니스 로직 작성 금지
- Prisma 직접 접근 금지
- 특정 모듈의 repository 직접 호출 금지

---

## 7.3 Controller Layer

### 역할

- request 값 추출
- service 호출
- 성공 응답 반환

### 허용

```ts
const result = await tripService.createTrip({
  userId: req.user.id,
  ...req.body,
});

return successResponse(res, result, 201);
```

### 금지

- 비즈니스 로직 작성 금지
- Prisma 직접 사용 금지
- 외부 API 직접 호출 금지
- 복잡한 조건문 작성 금지
- 에러 응답 직접 생성 남발 금지
- `try-catch` 반복 작성 금지

### 원칙

Controller는 얇게 유지한다.

---

## 7.4 Service Layer

### 역할

- 핵심 비즈니스 로직 처리
- 권한 검증
- 도메인 규칙 적용
- repository 호출
- 외부 service/client 호출
- transaction 흐름 관리
- AppError 발생

### 허용

```ts
const trip = await tripRepository.findById(tripId);

if (!trip) {
  throw new AppError(
    404,
    ERROR_CODE.TRIP_NOT_FOUND,
    "여행 일정을 찾을 수 없습니다.",
  );
}
```

### 금지

- `req`, `res` 사용 금지
- HTTP 응답 직접 반환 금지
- Prisma 직접 사용 금지
- Controller 역할 수행 금지

### 원칙

Service는 프로젝트의 핵심 두뇌다.

---

## 7.5 Repository Layer

### 역할

- Prisma 기반 DB 접근
- DB 조회
- DB 생성
- DB 수정
- DB 삭제

### 허용

```ts
return prisma.trip.findUnique({
  where: { id: tripId },
});
```

### 금지

- 비즈니스 로직 작성 금지
- 권한 검증 금지
- HTTP 상태코드 처리 금지
- 응답 포맷 처리 금지
- AppError 남발 금지

### 원칙

Repository는 DB와만 대화한다.  
Repository는 가능하면 `null` 또는 DB 결과를 반환하고, 에러 판단은 Service에서 처리한다.

---

## 7.6 Client Layer

### 역할

- 외부 API 호출 전담

### 사용 대상

- Kakao Map API
- Naver Map API
- Google Maps API
- 외부 거리 계산 API

### 금지

- 도메인 비즈니스 로직 작성 금지
- Controller 직접 연결 금지

---

# 8. 모듈 구조 규칙

각 도메인 모듈은 다음 구조를 따른다.

```txt
module/
├── module.controller.ts
├── module.service.ts
├── module.repository.ts
├── module.route.ts
├── module.validator.ts
├── module.type.ts
└── module.client.ts
```

## 파일별 역할

| 파일 | 역할 |
|---|---|
| `*.route.ts` | API path 연결 |
| `*.validator.ts` | Zod request schema |
| `*.controller.ts` | 요청/응답 처리 |
| `*.service.ts` | 비즈니스 로직 |
| `*.repository.ts` | DB 접근 |
| `*.client.ts` | 외부 API 호출 |
| `*.type.ts` | 모듈 전용 타입 |

## `*.client.ts` 사용 기준

외부 API 호출이 있는 모듈에서만 생성한다.

예시:

- `map.client.ts`
- `payment.client.ts`
- `oauth.client.ts`

---

# 9. 네이밍 컨벤션

## 9.1 파일명

### 모듈 내부 파일

형식:

```txt
{domain}.{role}.ts
```

예시:

```txt
auth.controller.ts
auth.service.ts
auth.repository.ts
auth.route.ts
auth.validator.ts
auth.type.ts
```

### 공통 파일

kebab-case 사용

```txt
error-code.ts
route-policy.ts
place-category.ts
```

### 금지

```txt
AuthController.ts
authController.ts
auth_controller.ts
```

---

## 9.2 변수명

camelCase 사용

```ts
const tripId = 1;
const userEmail = "user@example.com";
const startDate = "2026-06-01";
```

### boolean 변수

boolean은 의미가 드러나는 접두사를 사용한다.

권장:

```ts
const isOwner = true;
const hasPlaces = true;
const canEditTrip = true;
const shouldRecommendRoute = true;
```

금지:

```ts
const owner = true;
const edit = true;
```

---

## 9.3 함수명

camelCase 사용  
동사로 시작한다.

권장:

```ts
createTrip();
getTripById();
updatePlace();
deleteRoute();
recommendRoute();
validateTripOwner();
```

금지:

```ts
tripCreate();
tripById();
routeRecommend();
```

---

## 9.4 클래스명

PascalCase 사용

```ts
class AppError {}
class RouteRecommendationService {}
```

---

## 9.5 타입 / 인터페이스명

PascalCase 사용

```ts
type CreateTripInput = {};
type RecommendRouteResult = {};

interface AuthenticatedUser {}
```

### 타입 이름 접미사 기준

```txt
Input    = service 입력 타입
Result   = service 결과 타입
Payload  = token 또는 event payload
Params   = path params 타입
Query    = query string 타입
```

예시:

```ts
type CreateTripInput = {};
type CreateTripResult = {};
type JwtPayload = {};
type GetTripParams = {};
type GetTripsQuery = {};
```

---

## 9.6 상수명

UPPER_SNAKE_CASE 사용

```ts
const ERROR_CODE = {};
const ROUTE_POLICY = {};
const DEFAULT_PAGE_SIZE = 10;
```

---

## 9.7 API Path

RESTful resource는 복수형을 사용한다.

```txt
/api/v1/trips
/api/v1/places
/api/v1/routes
```

### 금지

```txt
/api/v1/getTrips
/api/v1/createTrip
/api/v1/trip
```

---

# 10. Import 규칙

## Import 순서

1. Node built-in
2. External packages
3. Internal alias import
4. Relative import
5. Type-only import

예시:

```ts
import crypto from "crypto";

import express from "express";
import { z } from "zod";

import { env } from "@/config/env";
import { AppError } from "@/utils/AppError";

import { tripService } from "./trip.service";

import type { CreateTripInput } from "./trip.type";
```

## 금지

- 사용하지 않는 import 금지
- wildcard import 금지

```ts
// 금지
import * as tripService from "./trip.service";
```

---

# 11. Path Alias 규칙

## 기본 원칙

`@/` alias를 사용한다.

## tsconfig 설정

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

## 권장

```ts
import { env } from "@/config/env";
import { AppError } from "@/utils/AppError";
```

## 금지

```ts
import { AppError } from "../../../utils/AppError";
```

---

# 12. TypeScript 규칙

## 12.1 strict 모드 필수

```json
{
  "strict": true,
  "noImplicitAny": true,
  "strictNullChecks": true
}
```

## 12.2 any 사용 금지

`any`는 절대로 사용하지 않는다.

금지:

```ts
const data: any = req.body;
```

이유:

- 타입 시스템 무력화
- 런타임 오류 증가
- 유지보수 어려움
- LLM 코드 품질 저하

## 12.3 unknown 사용 규칙

`unknown`은 외부 입력, catch error, 외부 API 응답처럼 타입을 확신할 수 없는 경우에만 허용한다.

```ts
catch (error: unknown) {
  if (error instanceof Error) {
    console.error(error.message);
  }
}
```

## 12.4 반환 타입 명시

export되는 함수는 반환 타입을 명시한다.

```ts
export const createTrip = async (
  input: CreateTripInput,
): Promise<CreateTripResult> => {
  // ...
};
```

## 12.5 Type Assertion 규칙

`as` 사용은 최소화한다.

허용:

```ts
const category = value as PlaceCategory;
```

금지:

```ts
const data = req.body as any;
```

## 12.6 Non-null Assertion 금지

금지:

```ts
const userId = req.user!.id;
```

권장:

```ts
if (!req.user) {
  throw new AppError(401, ERROR_CODE.UNAUTHORIZED, "인증이 필요합니다.");
}

const userId = req.user.id;
```

---

# 13. DTO / Type 규칙

## Zod schema 기반 타입 추론

Request DTO 타입은 Zod schema에서 추론한다.

```ts
export const createTripBodySchema = z.object({
  title: z.string().min(1),
  region: z.string().min(1),
});

export type CreateTripBody = z.infer<typeof createTripBodySchema>;
```

## 중복 타입 작성 금지

금지:

```ts
const createTripSchema = z.object({
  title: z.string(),
});

type CreateTripBody = {
  title: string;
};
```

## Service Input 타입

Controller에서 Service로 넘기는 값은 명확한 Input 타입을 사용한다.

```ts
export type CreateTripInput = {
  userId: number;
  title: string;
  region: string;
};
```

---

# 14. Validation 규칙

## 사용 라이브러리

Zod를 사용한다.

## 선택 이유

- TypeScript 타입 추론이 좋다.
- Request Body / Params / Query 검증에 적합하다.
- 환경변수 검증에도 사용할 수 있다.
- schema가 문서처럼 읽힌다.
- LLM 코드 생성 안정성이 높다.

## 검증 대상

- body
- params
- query
- env

## 금지

- Joi 사용 금지
- Yup 사용 금지
- Superstruct 사용 금지
- Controller에서 수동 검증 금지
- Service에서 request 형식 검증 금지

## Schema 분리 규칙

body, params, query schema를 명확히 분리한다.

```ts
export const createTripSchema = z.object({
  body: z.object({
    title: z.string().min(1),
    region: z.string().min(1),
  }),
});
```

## Query coercion 규칙

query string은 Zod의 `coerce`를 사용한다.

```ts
const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});
```

---

# 15. Enum / Const 규칙

## 기본 원칙

- Prisma schema에서는 enum 사용 가능
- TypeScript 코드에서는 enum 사용 금지
- const array 또는 const object를 사용한다

## 이유

- 런타임 동작이 명확하다.
- Zod와 연동하기 쉽다.
- 타입 추론이 자연스럽다.
- 유지보수가 쉽다.

## 권장 방식

```ts
export const PLACE_CATEGORY_VALUES = [
  "RESTAURANT",
  "CAFE",
  "TOURIST_SPOT",
  "HOTEL",
  "ETC",
] as const;

export type PlaceCategory = (typeof PLACE_CATEGORY_VALUES)[number];

export const placeCategorySchema = z.enum(PLACE_CATEGORY_VALUES);
```

## 금지

```ts
enum PlaceCategory {
  RESTAURANT = "RESTAURANT",
}
```

---

# 16. Prisma 규칙

## 16.1 Prisma 사용 위치

Prisma는 repository에서만 직접 사용한다.

## 금지

Service에서 Prisma 직접 사용 금지:

```ts
await prisma.trip.create();
```

Controller에서 Prisma 직접 사용 금지:

```ts
await prisma.user.findMany();
```

## 16.2 Prisma Model Naming

Model 이름은 PascalCase를 사용한다.

```prisma
model User {}
model Trip {}
model Place {}
model Route {}
```

## 16.3 Prisma Field Naming

field 이름은 camelCase를 사용한다.

```prisma
createdAt DateTime
updatedAt DateTime
deletedAt DateTime?
```

## 16.4 공통 Field

기본 모델은 아래 필드를 우선 포함한다.

```prisma
id        Int      @id @default(autoincrement())
createdAt DateTime @default(now())
updatedAt DateTime @updatedAt
```

중요 데이터는 soft delete를 위해 다음 필드를 고려한다.

```prisma
deletedAt DateTime?
```

## 16.5 Relation Naming

관계 필드는 도메인 의미가 드러나게 작성한다.

```prisma
user   User @relation(fields: [userId], references: [id])
userId Int
```

---

# 17. Transaction 규칙

## 사용 기준

여러 DB 작업이 하나의 비즈니스 흐름으로 묶이면 transaction을 사용한다.

## 사용 예시

- 여행 삭제 + 관련 장소 삭제
- 추천 동선 생성 + RoutePlace 생성
- 회원 탈퇴 + 관련 데이터 삭제
- 장소 순서 일괄 수정

## Transaction 위치

Transaction의 흐름은 Service Layer에서 결정한다.

## 금지

- Repository가 독립적으로 transaction 흐름을 결정하지 않는다.
- 하나의 비즈니스 흐름을 여러 개의 독립 DB 작업으로 방치하지 않는다.

---

# 18. Delete 규칙

## 기본 원칙

중요 데이터는 soft delete를 우선 고려한다.

## Soft Delete 필드

```prisma
deletedAt DateTime?
```

## Soft Delete 대상

- User
- Trip
- Place
- Route

## Hard Delete 허용 대상

- 임시 데이터
- 캐시성 데이터
- 복구 필요가 없는 로그성 데이터

## 조회 규칙

soft delete를 사용하는 모델은 기본 조회에서 `deletedAt: null` 조건을 적용한다.

---

# 19. Nullable / Optional 규칙

## 기본 원칙

불필요한 nullable을 만들지 않는다.

## 구분

```txt
optional = 값이 없을 수 있음
nullable = null을 명시적으로 허용
```

## 금지

```ts
name?: string | null;
```

optional과 nullable을 동시에 남발하지 않는다.

## 권장

```ts
nickname?: string;
deletedAt: Date | null;
```

## Prisma 기준

- 실제 DB에서 null이 필요한 경우에만 `?`를 사용한다.
- 의미 없는 nullable field를 만들지 않는다.

---

# 20. 환경변수 규칙

## process.env 직접 사용 금지

반드시 `config/env.ts`에서만 접근한다.

금지:

```ts
const secret = process.env.JWT_SECRET;
```

권장:

```ts
import { env } from "@/config/env";

const secret = env.JWT_SECRET;
```

## env.ts에서 Zod 검증

```ts
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(1),
});

export const env = envSchema.parse(process.env);
```

## .env.sample 규칙

환경변수가 추가되면 `.env.sample`도 반드시 수정한다.

---

# 21. 인증 / 인가 규칙

## 인증 방식

JWT Bearer Token을 사용한다.

## Header 형식

```txt
Authorization: Bearer {accessToken}
```

## Access Token

- 인증이 필요한 API는 access token을 요구한다.
- token 검증은 `auth.middleware.ts`에서 처리한다.

## Password Hashing

bcrypt를 사용한다.

## 금지

- 평문 비밀번호 저장 금지
- Controller에서 token 직접 검증 금지
- Service에서 Authorization header 직접 파싱 금지
- JWT secret 하드코딩 금지

## req.user

인증 성공 시 `req.user`에 사용자 정보를 저장한다.

예시:

```ts
req.user = {
  id: user.id,
  email: user.email,
};
```

---

# 22. 날짜 / 시간 규칙

## 저장 기준

DB에는 UTC 기준으로 저장한다.

## 응답 기준

API 응답은 ISO 8601 문자열을 사용한다.

## 표시 기준

프론트엔드에서 Asia/Seoul 기준으로 변환하여 표시한다.

## 날짜 라이브러리

dayjs를 사용한다.

## 금지

- moment 사용 금지
- 서버에서 사용자 표시용 시간 문자열을 임의 생성하지 않는다.
- timezone 기준이 불명확한 문자열 사용 금지

---

# 23. API 응답 포맷 규칙

## 성공 응답

```json
{
  "success": true,
  "data": {}
}
```

## 생성 성공

HTTP status code는 201을 사용한다.

```json
{
  "success": true,
  "data": {
    "id": 1
  }
}
```

## 삭제 성공

기본적으로 204 No Content를 사용한다.  
단, 클라이언트에서 메시지가 필요한 경우 200과 data를 사용할 수 있다.

## 목록 응답

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

## 실패 응답

```json
{
  "success": false,
  "code": "TRIP_NOT_FOUND",
  "message": "여행 일정을 찾을 수 없습니다."
}
```

---

# 24. Error 처리 규칙

## 역할 구분

```txt
error-code.ts        = 에러 코드 정의
AppError.ts          = 에러 객체 생성
error.middleware.ts  = 에러 응답 처리
```

## 에러 코드 위치

모든 에러 코드는 `src/constants/error-code.ts`에서 관리한다.

## 에러 코드 네이밍

영문 대문자 SNAKE_CASE 사용

```txt
TRIP_NOT_FOUND
INVALID_TOKEN
EMAIL_ALREADY_EXISTS
```

## 에러 메시지 언어

에러 메시지는 한국어를 사용한다.

## AppError 사용

```ts
throw new AppError(
  404,
  ERROR_CODE.TRIP_NOT_FOUND,
  "여행 일정을 찾을 수 없습니다.",
);
```

## 금지

- 에러 코드 문자열 직접 하드코딩 금지
- Controller에서 에러 응답 직접 조립 금지
- 알 수 없는 에러를 클라이언트에 그대로 노출 금지

---

# 25. HTTP Status Code 규칙

```txt
200 OK                   조회 / 수정 성공
201 Created              생성 성공
204 No Content            삭제 성공

400 Bad Request           잘못된 요청
401 Unauthorized          인증 실패
403 Forbidden             권한 없음
404 Not Found             리소스 없음
409 Conflict              중복 / 충돌
500 Internal Server Error 서버 오류
```

## 사용 기준

- 인증 정보 없음 또는 token invalid: 401
- 인증은 됐지만 소유자가 아님: 403
- 리소스가 없음: 404
- 이메일 중복 등 충돌: 409
- validation 실패: 400

---

# 26. Pagination 규칙

## 기본 방식

page / limit 기반 pagination을 사용한다.

## Query Parameter

```txt
?page=1&limit=10
```

## 기본값

```txt
page = 1
limit = 10
```

## 최대 limit

```txt
max limit = 100
```

## 응답 형식

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

# 27. Sorting / Filtering / Search 규칙

## Sorting Query

```txt
sortBy
sortOrder
```

## sortOrder 허용값

```txt
asc
desc
```

## Filtering Query

도메인 의미가 드러나는 이름을 사용한다.

예시:

```txt
category
region
startDate
endDate
```

## Search Query

검색어는 `q`를 사용한다.

```txt
?q=성수 카페
```

## 금지

API마다 다른 query 이름을 만들지 않는다.

금지 예시:

```txt
keyword
search
searchText
word
```

검색어는 기본적으로 `q`로 통일한다.

---

# 28. Map / Location 규칙

## 좌표 필드명

```txt
latitude
longitude
```

## 금지

```txt
lat
lng
x
y
```

단, 외부 API 응답이 `x`, `y`를 사용하는 경우 `map.client.ts` 내부에서 변환한다.

## 주소 필드명

```txt
address
detailAddress
```

## 이동 시간 단위

분 단위는 `minutes` suffix를 사용한다.

```txt
stayTimeMinutes
moveTimeMinutes
```

## 거리 단위

미터 단위는 `Meters` suffix를 사용한다.

```txt
distanceMeters
```

---

# 29. Route Recommendation 규칙

## 추천 기준

초기 MVP에서는 규칙 기반 추천을 사용한다.

고려 요소:

- 장소 좌표
- 이동 시간
- 체류 시간
- 장소 우선순위
- 카테고리
- 출발 위치
- 출발 시간

## 추천 정책 상수

`src/constants/route-policy.ts`에서 관리한다.

예시:

```ts
export const ROUTE_POLICY = {
  DEFAULT_STAY_TIME_MINUTES: 60,
  MAX_PLACES_PER_DAY: 8,
  LUNCH_START_HOUR: 11,
  LUNCH_END_HOUR: 14,
} as const;
```

## 금지

- 추천 정책 값을 service 내부에 하드코딩하지 않는다.
- 계산 단위가 불명확한 변수명을 사용하지 않는다.

---

# 30. Logging 규칙

## 개발 환경

개발 환경에서는 필요한 경우 `console.log`를 허용한다.

## 운영 환경

운영 환경에서는 `console.log` 사용을 금지한다.

## 에러 로그

에러 로그는 `error.middleware.ts`에서 중앙 관리한다.

## 민감정보 로그 금지

다음 값은 로그로 남기지 않는다.

- password
- accessToken
- refreshToken
- JWT_SECRET
- API key

## 추후 도입 가능

- pino
- winston

---

# 31. 보안 규칙

## 금지

- secret 하드코딩 금지
- API key commit 금지
- `.env` commit 금지
- 비밀번호 평문 저장 금지
- token 로그 출력 금지
- 외부 입력값을 검증 없이 DB query에 사용 금지

## 필수

- 모든 환경변수는 `env.ts`에서 검증한다.
- 인증 필요한 API는 `auth.middleware.ts`를 사용한다.
- 비밀번호는 bcrypt로 hash 처리한다.

---

# 32. Async 규칙

## 기본 원칙

비동기 코드는 async/await을 사용한다.

## 금지

then chaining 남발 금지

```ts
// 금지
tripRepository.findById(id).then((trip) => {});
```

## 에러 처리

Controller route는 `asyncHandler`로 감싼다.

```ts
router.get(
  "/:tripId",
  authMiddleware,
  asyncHandler(tripController.getTrip),
);
```

---

# 33. Formatting 규칙

## 사용 도구

- ESLint
- Prettier

## 기본 스타일

```txt
semicolon: true
quote: double
trailingComma: all
tabWidth: 2
```

## 예시 `.prettierrc.json`

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "all",
  "tabWidth": 2,
  "printWidth": 100
}
```

---

# 34. 테스트 규칙

## 우선 테스트 대상

- Service Layer
- 핵심 비즈니스 로직
- route recommendation algorithm
- auth logic

## 테스트 파일명

```txt
trip.service.spec.ts
route.service.spec.ts
auth.service.spec.ts
```

## 테스트 위치

모듈 내부 또는 `__tests__` 폴더 중 하나로 통일한다.

권장:

```txt
modules/trips/trip.service.spec.ts
```

## 금지

- Controller만 테스트하는 얇은 테스트 남발 금지
- 실제 외부 API를 직접 호출하는 테스트 금지
- 테스트에서 실제 운영 DB 사용 금지

---

# 35. API Versioning 규칙

모든 API는 `/api/v1` prefix를 사용한다.

## 예시

```txt
/api/v1/auth/signup
/api/v1/auth/login
/api/v1/trips
/api/v1/places
/api/v1/routes
/api/v1/maps
```

## 금지

```txt
/api/trips
/trips
```

---

# 36. Swagger 규칙

## 문서화 기준

모든 public API는 Swagger에 문서화한다.

## 포함 내용

- API 설명
- 인증 여부
- Path Parameter
- Query Parameter
- Request Body
- Success Response
- Error Response

## Swagger Tag

```txt
Auth
Users
Trips
Places
Routes
Maps
```

## Error Example 필수

각 API에는 대표 에러 응답 예시를 포함한다.

---

# 37. Git 컨벤션

## 브랜치 전략

```txt
main       배포 가능한 안정 브랜치
develop    개발 통합 브랜치
feature/*  기능 개발 브랜치
fix/*      버그 수정 브랜치
docs/*     문서 작업 브랜치
refactor/* 리팩토링 브랜치
```

## 브랜치 예시

```txt
feature/auth
feature/trip
feature/place
feature/route-recommend
fix/login-token
docs/api-spec
refactor/trip-service
```

## 커밋 메시지

```txt
type: subject
```

## type 목록

```txt
feat      새로운 기능
fix       버그 수정
refactor  리팩토링
docs      문서 수정
test      테스트 추가/수정
chore     설정, 패키지, 빌드 작업
style     코드 포맷팅
```

## 예시

```txt
feat: 여행 생성 API 추가
fix: JWT 인증 오류 수정
docs: 개발 컨벤션 문서 추가
refactor: trip service 권한 검증 로직 분리
```

---

# 38. 기능 개발 순서

새 기능은 다음 순서로 개발한다.

```txt
1. 기능 요구사항 작성
2. API 명세 작성
3. Prisma schema 확인 또는 수정
4. validator 작성
5. repository 작성
6. service 작성
7. controller 작성
8. route 작성
9. app.ts 연결
10. Swagger 작성
11. 테스트
```

## 금지

- API 명세 없이 구현부터 시작 금지
- validator 없이 controller 작성 금지
- Prisma schema 없이 repository 구현 금지

---

# 39. 도메인 책임 기준

## Auth

인증을 담당한다.

- 회원가입
- 로그인
- 로그아웃
- 토큰 발급
- 비밀번호 검증

## Users

사용자 정보를 담당한다.

- 내 정보 조회
- 닉네임 수정
- 프로필 수정
- 회원 탈퇴

## Trips

여행 묶음을 담당한다.

- 여행 생성
- 여행 목록 조회
- 여행 상세 조회
- 여행 수정
- 여행 삭제

## Places

여행에 포함된 장소를 담당한다.

- 장소 추가
- 장소 목록 조회
- 장소 상세 조회
- 장소 수정
- 장소 삭제

## Routes

추천 동선과 추천 결과를 담당한다.

- 자동 동선 추천
- 추천 결과 저장
- 추천 동선 조회
- 추천 동선 삭제
- 장소 방문 순서 수정

## Maps

지도 API 연동을 담당한다.

- 장소 키워드 검색
- 주소를 좌표로 변환
- 좌표를 주소로 변환
- 장소 간 거리/이동 시간 계산

---

# 40. LLM 작업 규칙

## LLM은 반드시 지켜야 한다

- 이 문서의 컨벤션을 최우선으로 따른다.
- 기존 폴더 구조를 임의로 변경하지 않는다.
- 기술 스택을 임의로 변경하지 않는다.
- any를 사용하지 않는다.
- TypeScript enum을 사용하지 않는다.
- Prisma는 repository에서만 사용한다.
- Controller에서 비즈니스 로직을 작성하지 않는다.
- Service에서 req/res를 사용하지 않는다.
- Repository에서 응답 포맷을 만들지 않는다.
- validator 없이 req.body를 신뢰하지 않는다.
- AppError를 사용한다.
- ERROR_CODE를 사용한다.
- successResponse를 사용한다.
- process.env를 직접 사용하지 않는다.
- import alias 규칙을 지킨다.

## LLM 코드 생성 시 포함해야 하는 것

코드를 생성하거나 수정할 때는 다음을 함께 설명한다.

- 생성/수정한 파일 목록
- 각 파일의 역할
- 기존 구조에 미치는 영향
- 컨벤션 준수 여부
- 테스트 또는 확인 방법

## LLM 금지사항

- 불필요한 리팩토링 금지
- 사용하지 않는 코드 생성 금지
- dead code 생성 금지
- 임의 패키지 추가 금지
- 임의 폴더 생성 금지
- 기존 응답 포맷 변경 금지
- 기존 에러 포맷 변경 금지
- 기존 네이밍 규칙 변경 금지

---

# 41. MVP 우선 기능

## Auth

- 회원가입
- 로그인
- 내 정보 조회

## Trips

- 여행 생성
- 여행 목록 조회
- 여행 상세 조회
- 여행 수정
- 여행 삭제

## Places

- 장소 추가
- 장소 목록 조회
- 장소 수정
- 장소 삭제

## Routes

- 등록된 장소 기반 자동 동선 추천
- 추천 동선 저장
- 추천 동선 조회

## Maps

- 장소 키워드 검색
- 주소 기반 좌표 변환
- 장소 간 이동 시간 계산

---

# 42. 최종 원칙

```txt
trips  = 여행 묶음
places = 방문 장소
routes = 추천 동선
maps   = 지도 API
auth   = 인증
users  = 사용자 정보
```

```txt
Route       = API endpoint 연결
Middleware  = 공통 요청 처리
Controller  = 요청/응답 처리
Service     = 비즈니스 로직
Repository  = DB 접근
Client      = 외부 API 호출
```

이 역할을 섞지 않는다.  
이 문서에 없는 결정을 해야 할 경우, 먼저 이 문서의 철학과 기존 구조를 기준으로 가장 보수적인 선택을 한다.
