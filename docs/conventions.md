# PathTrip Development Convention

> 본 문서는 PathTrip 프로젝트의 개발 규칙을 정의한다.
>
> 모든 개발자와 AI Assistant(LLM)는 본 문서를 기준으로 코드를 작성한다.

---

# 1. 프로젝트 개요

프로젝트명

PathTrip

목적

사용자가 여행 장소를 입력하면 위치 정보와 이동 시간을 기반으로 최적의 여행 동선을 추천하는 서비스

---

# 2. 기술 스택

## Runtime

Node.js

### 선택 이유

* NestJS 실행 환경
* 높은 생태계 활용성
* JavaScript/TypeScript 기반 개발 가능

---

## Language

TypeScript

### 선택 이유

* 타입 안정성 확보
* 런타임 오류 감소
* 유지보수성 향상
* 협업 효율 증가

---

## Framework

NestJS

### 선택 이유

* 구조화된 아키텍처 제공
* Dependency Injection 지원
* 테스트 용이성
* 대규모 프로젝트 확장성

---

## ORM

MikroORM

### 선택 이유

* Entity 중심 설계
* Unit Of Work 지원
* Identity Map 지원
* 관계형 도메인 모델링에 적합

---

## Database

MySQL

### 선택 이유

* 관계형 데이터 관리
* 현업 사용률 높음
* 안정성 검증 완료

---

## Validation

class-validator
class-transformer

### 선택 이유

* NestJS 공식 생태계
* DTO 기반 검증 가능
* Swagger 연동 용이

---

# 3. TypeScript 규칙

## Strict Mode 사용

필수

```json
{
  "strict": true
}
```

---

## any 사용 금지

허용

```ts
unknown
```

금지

```ts
any
```

### 이유

any는 타입 안정성을 무력화한다.

---

## 반환 타입 명시

Public Method는 반환 타입을 명시한다.

허용

```ts
async createTrip(): Promise<Trip>
```

---

## 타입 추론 가능한 경우 생략 허용

허용

```ts
const title = "제주 여행";
```

불필요

```ts
const title: string = "제주 여행";
```

---

# 4. 네이밍 규칙

## 파일명

kebab-case 사용

허용

```txt
trip.service.ts
create-trip.dto.ts
jwt-auth.guard.ts
```

금지

```txt
TripService.ts
CreateTripDTO.ts
```

---

## 클래스명

PascalCase 사용

허용

```ts
TripService
TripRepository
CreateTripDto
```

---

## 변수명

camelCase 사용

허용

```ts
tripTitle
createdTrip
```

---

## 함수명

동사 + 목적어 사용

허용

```ts
createTrip()
findTripById()
deletePlace()
```

금지

```ts
trip()
data()
process()
```

---

## 상수명

UPPER_SNAKE_CASE 사용

허용

```ts
JWT_SECRET
MAX_PAGE_SIZE
```

---

## Enum

TypeScript enum 사용 금지

const object 사용

허용

```ts
export const PLACE_CATEGORY = {
  RESTAURANT: "RESTAURANT",
  CAFE: "CAFE",
  TOURIST: "TOURIST",
} as const;
```

### 이유

* Tree Shaking 유리
* 런타임 객체 생성 방지
* 번들 크기 감소

---

# 5. 프로젝트 구조

```txt
src/
├── main.ts
├── app.module.ts
├── config/
├── database/
├── common/
└── modules/
```

---

# 6. Module 설계 규칙

하나의 Module은 하나의 도메인 책임만 가진다.

예시

* AuthModule
* UsersModule
* TripsModule
* PlacesModule
* RoutesModule
* MapsModule

---

순환 의존성 발생 시 설계를 재검토한다.

---

# 7. Layer 책임 규칙

## Controller

역할

* HTTP 요청 수신
* HTTP 응답 반환

금지

* 비즈니스 로직
* DB 접근

---

## Service

역할

* 비즈니스 로직 처리
* 정책 판단
* 권한 검사

금지

* SQL 작성
* HTTP 응답 생성

---

## Repository

역할

* DB 접근

허용

* create
* update
* delete
* find

금지

* 권한 검사
* 추천 알고리즘
* 비즈니스 로직

---

## Entity

역할

* 데이터 모델 정의

금지

* Request 객체 의존
* Controller 의존

---

# 8. DTO 규칙

모든 Request Body는 DTO 사용

허용

```ts
CreateTripDto
UpdateTripDto
```

금지

```ts
@Post()
create(@Body() body: any)
```

---

# 9. Validation 규칙

모든 입력 검증은 DTO에서 수행한다.

사용

```ts
class-validator
ValidationPipe
```

금지

```ts
if (!title) {
  throw ...
}
```

---

# 10. Entity 규칙

Entity는 단수형 사용

허용

```txt
User
Trip
Place
Route
```

금지

```txt
Users
Trips
Places
```

---

공통 필드

```ts
id
createdAt
updatedAt
```

필수

---

Soft Delete 사용 시

```ts
deletedAt
```

사용

---

# 11. MikroORM 규칙

MikroORM은 Unit Of Work 패턴을 사용한다.

원칙

* Entity 상태를 변경한다.
* flush 시점에 DB 반영된다.
* DB 직접 조작보다 Entity 중심 설계를 우선한다.

---

# 12. Transaction 규칙

다음 상황은 Transaction 사용

* 여행 삭제
* 장소 삭제
* 추천 동선 저장
* 회원 탈퇴

원칙

모두 성공하거나 모두 실패해야 한다.

---

# 13. API 설계 규칙

RESTful API 사용

허용

```txt
GET /trips
POST /trips
PATCH /trips/:id
DELETE /trips/:id
```

금지

```txt
/getTrips
/createTrip
```

---

API Versioning 사용

```txt
/api/v1
```

---

# 14. Response 규칙

성공 응답

```json
{
  "success": true,
  "data": {}
}
```

실패 응답

```json
{
  "success": false,
  "code": "TRIP_NOT_FOUND",
  "message": "Trip not found"
}
```

---

# 15. Error 처리 규칙

모든 예외는 Global Exception Filter에서 처리한다.

---

Controller 내부 try-catch 금지

금지

```ts
try {
}
catch {
}
```

---

모든 에러는 Error Code 사용

예시

```ts
TRIP_NOT_FOUND
PLACE_NOT_FOUND
USER_NOT_FOUND
UNAUTHORIZED
FORBIDDEN
```

---

# 16. Authentication 규칙

JWT 사용

인증은 Guard를 통해 처리한다.

허용

```ts
@UseGuards(JwtAuthGuard)
```

금지

```ts
if(token === ...)
```

---

# 17. External API 규칙

외부 API는 Client 클래스로 분리한다.

예시

```txt
KakaoMapClient
```

---

원칙

* timeout 설정
* 응답 DTO 변환
* 에러 변환
* 외부 API 응답 직접 반환 금지

---

# 18. Pagination 규칙

Query

```txt
?page=1&limit=10
```

---

Response

```json
{
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

# 19. Date / Time 규칙

DB 저장

UTC 사용

---

API 응답

ISO-8601 사용

예시

```txt
2026-06-14T10:00:00Z
```

---

# 20. Swagger 규칙

모든 Public API는 Swagger 문서화

필수

```ts
@ApiTags
@ApiOperation
@ApiResponse
```

---

인증 API

```ts
@ApiBearerAuth()
```

추가

---

# 21. Logging 규칙

console.log 사용 금지

사용

```ts
Logger
```

---

# 22. Security 규칙

금지

* 비밀번호 평문 저장
* JWT Secret 하드코딩
* API Key Git Commit
* process.env 직접 접근

---

사용

```ts
ConfigService
```

---

# 23. Git 규칙

브랜치 전략

```txt
main
develop
feature/*
```

예시

```txt
feature/auth-login
feature/trip-create
```

---

Commit Message

```txt
feat:
fix:
refactor:
docs:
test:
chore:
```

예시

```txt
feat: 여행 생성 API 구현
fix: 로그인 검증 오류 수정
docs: requirements 문서 추가
```

---

# 24. 테스트 규칙

테스트 프레임워크

Jest

---

우선순위

1. Service
2. Repository
3. Controller

---

비즈니스 로직은 반드시 테스트 가능해야 한다.

---

# 25. AI Assistant(LLM) 작업 규칙

AI Assistant는 반드시 본 문서를 따른다.

금지

* any 사용
* Controller에 비즈니스 로직 작성
* Repository에 비즈니스 로직 작성
* DTO 없이 Request Body 사용
* Error Code 하드코딩
* 외부 API 응답 직접 반환

---

필수

* 생성 파일 설명
* 데이터 흐름 설명
* 컨벤션 준수 여부 설명

---

# 26. 개발 원칙

* 단일 책임 원칙(SRP)
* 관심사 분리(SoC)
* DRY 원칙
* 가독성 우선
* 명확한 네이밍 우선
* 비즈니스 로직은 Service에 집중
* 모든 기술 선택에는 이유를 설명할 수 있어야 한다
* 문제 → 원인 → 해결 → 기술 선택 순서로 사고한다
