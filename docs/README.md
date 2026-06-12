# PathTrip

> 위치와 이동 시간을 고려하여 여행 동선을 자동 추천하는 서비스

---

# 프로젝트 소개

PathTrip은 사용자가 여행 중 방문하고 싶은 장소를 입력하면 위치 정보와 이동 시간을 기반으로 효율적인 여행 동선을 자동 생성하는 서비스입니다.

여행을 준비할 때 많은 사람들이 다음과 같은 문제를 겪습니다.

* 가고 싶은 장소는 많지만 어떤 순서로 방문해야 할지 모르겠다.
* 이동 시간이 비효율적으로 낭비된다.
* 맛집, 카페, 관광지를 효율적으로 묶기 어렵다.
* 여행 계획을 세우는 데 너무 많은 시간이 소요된다.

PathTrip은 이러한 문제를 해결하기 위해 위치 기반 데이터와 이동 시간 정보를 활용하여 자동으로 최적의 여행 동선을 추천합니다.

---

# 프로젝트 목표

* 여행 계획 수립 시간을 단축한다.
* 이동 시간을 최소화한다.
* 사용자의 여행 목적을 반영한다.
* 효율적인 여행 경험을 제공한다.
* 데이터 기반 추천 플랫폼으로 확장한다.

---

# 주요 기능

## 인증

* 회원가입
* 로그인
* JWT 기반 인증
* 내 정보 조회

## 여행 관리

* 여행 생성
* 여행 목록 조회
* 여행 상세 조회
* 여행 수정
* 여행 삭제

## 장소 관리

* 장소 추가
* 장소 목록 조회
* 장소 수정
* 장소 삭제

## 지도 기능

* 장소 검색
* 주소 → 좌표 변환
* 위치 기반 장소 조회

## 자동 동선 추천

* 등록된 장소 기반 동선 생성
* 이동 시간 고려
* 거리 기반 정렬
* 여행 목적 기반 우선순위 반영

---

# 기술 스택

## Backend

* Node.js
* TypeScript
* NestJS

## Database

* MySQL
* MikroORM

## Validation

* class-validator
* class-transformer

## Authentication

* JWT
* bcrypt

## API Documentation

* Swagger (OpenAPI)

## Testing

* Jest

## External API

* Kakao Map API

---

# 기술 선택 이유

## 왜 NestJS를 선택했는가?

초기에는 Express 기반으로 프로젝트를 설계하려고 했습니다.

하지만 프로젝트 규모가 커질수록 유지보수성과 구조적 일관성이 중요하다고 판단했습니다.

NestJS는 Controller, Service, Module, Guard, Pipe, Filter 등의 역할이 명확하게 분리되어 있으며 의존성 주입(Dependency Injection)을 기본적으로 제공합니다.

또한 실제 현업에서 많이 사용되는 구조를 경험하고 유지보수 가능한 백엔드 아키텍처를 학습하기 위해 NestJS를 선택했습니다.

---

## 왜 MikroORM을 선택했는가?

초기에는 Prisma ORM을 고려했습니다.

Prisma는 생산성이 뛰어나고 타입 안정성이 우수하지만, 이번 프로젝트에서는 단순 CRUD 구현보다 관계형 도메인 모델링 경험을 중요하게 생각했습니다.

PathTrip은 다음과 같은 관계를 가집니다.

```text
User
 └─ Trip
      └─ Place
           └─ Route
                └─ RoutePlace
```

데이터 간 관계와 비즈니스 규칙이 중요한 서비스이기 때문에 Entity 중심 설계가 가능한 MikroORM을 선택했습니다.

또한 Unit of Work와 Identity Map 패턴을 경험하며 ORM의 동작 원리를 깊게 이해하는 것을 목표로 하고 있습니다.

---

## 왜 MySQL을 선택했는가?

PathTrip은 사용자, 여행, 장소, 추천 동선 간의 관계가 중요한 서비스입니다.

데이터 무결성과 관계 관리를 위해 관계형 데이터베이스가 적합하다고 판단했습니다.

또한 현업에서 높은 사용률을 가지고 있으며 NestJS와 MikroORM 환경에서도 안정적으로 사용할 수 있어 MySQL을 선택했습니다.

---

# 아키텍처

PathTrip은 Layered Architecture 기반으로 설계합니다.

```text
Controller
    ↓
Service
    ↓
Repository
    ↓
Entity
    ↓
Database
```

## Controller

* HTTP 요청 처리
* Request / Response 담당

## Service

* 비즈니스 로직 처리
* 도메인 규칙 검증

## Repository

* 데이터 접근 담당

## Entity

* 데이터 모델 정의
* 관계형 도메인 모델 관리

---

# 프로젝트 구조

```text
src/
├── main.ts
├── app.module.ts
├── config/
├── database/
├── common/
│   ├── decorators/
│   ├── filters/
│   ├── guards/
│   ├── interceptors/
│   ├── pipes/
│   └── utils/
└── modules/
    ├── auth/
    ├── users/
    ├── trips/
    ├── places/
    ├── routes/
    └── maps/
```

---

# 데이터 모델

## User

사용자 정보

## Trip

여행 일정

## Place

여행 장소

## Route

추천 동선

## RoutePlace

동선 내 장소 순서 관리

---

# API 문서

Swagger를 통해 API 문서를 제공합니다.

```text
/api/docs
```

---

# 실행 방법

## 환경 변수 설정

```bash
cp .env.sample .env
```

## 패키지 설치

```bash
npm install
```

## 개발 서버 실행

```bash
npm run start:dev
```

## 빌드

```bash
npm run build
```

## 프로덕션 실행

```bash
npm run start:prod
```

---

# 개발 원칙

* TypeScript Strict Mode 사용
* any 사용 금지
* DTO 기반 검증
* RESTful API 설계
* 계층 분리 원칙 준수
* 공통 응답 포맷 사용
* 예외는 Global Exception Filter에서 처리
* 환경 변수는 Config Module로 관리

---

# 향후 개발 계획

## 사용자 추천 동선

사용자가 직접 만든 여행 코스를 공유할 수 있는 기능

## 크리에이터 기능

인플루언서 및 여행 크리에이터의 추천 코스 제공

## 리뷰 시스템

* 장소 리뷰
* 평점
* 방문 인증 리뷰

## Redis 캐싱

* 장소 검색 결과 캐싱
* 좌표 변환 결과 캐싱

## AI 기반 추천

사용자의 취향과 여행 목적을 분석하여 개인화된 동선 추천

## 실시간 기능

* 매장 문의
* 알림 기능
* 실시간 상태 업데이트

---

# License

MIT License
