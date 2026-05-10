# PathTrip

> 위치와 이동 시간을 기반으로  
> 효율적인 여행 동선을 자동 추천하는 여행 일정 서비스

---

# 📌 프로젝트 소개

PathTrip은 사용자가 여행 중 가고 싶은 장소, 맛집, 카페, 숙소 등을 입력하면  
위치, 이동 시간, 체류 시간 등을 고려하여 효율적인 여행 동선을 자동 추천하는 서비스입니다.

단순 장소 저장이 아니라:

```txt
어떤 순서로 이동해야 가장 효율적인가?
```

를 해결하는 것을 목표로 합니다.

---

# 🎯 프로젝트 목표

- 여행 일정 생성 및 관리
- 장소 저장 및 카테고리 분류
- 지도 기반 장소 검색
- 위치 기반 자동 동선 추천
- 이동 시간 최적화
- 추천 결과 저장 및 조회
- 유지보수 가능한 백엔드 구조 설계
- TypeScript 기반 안정적인 API 서버 구축

---

# ✨ 핵심 기능

## 🔐 인증

- 회원가입
- 로그인
- JWT 기반 인증
- 내 정보 조회

---

## 🧳 여행 일정 관리

- 여행 생성
- 여행 목록 조회
- 여행 상세 조회
- 여행 수정
- 여행 삭제

---

## 📍 장소 관리

- 장소 추가
- 장소 목록 조회
- 장소 수정
- 장소 삭제
- 장소 카테고리 관리

---

## 🗺️ 지도 기능

- 장소 키워드 검색
- 주소 → 좌표 변환
- 좌표 → 주소 변환
- 장소 간 거리 계산
- 이동 시간 계산

---

## 🚗 자동 동선 추천

- 위치 기반 동선 추천
- 이동 시간 기반 최적화
- 장소 우선순위 반영
- 추천 결과 저장
- 추천 동선 조회

---

# 🛠️ 기술 스택

| Category | Stack |
|---|---|
| Runtime | Node.js |
| Language | TypeScript |
| Framework | Express |
| ORM | Prisma |
| Database | PostgreSQL |
| Validation | Zod |
| Authentication | JWT |
| Password Hashing | bcrypt |
| API Documentation | Swagger / OpenAPI |
| Date Library | dayjs |
| Formatting | ESLint / Prettier |

---

# 🧠 아키텍처 개요

PathTrip은 Layered Architecture 기반으로 설계되어 있습니다.

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

## 역할 분리 원칙

| Layer | 역할 |
|---|---|
| Route | API endpoint 연결 |
| Middleware | 인증 / 검증 / 공통 처리 |
| Controller | 요청 / 응답 처리 |
| Service | 핵심 비즈니스 로직 |
| Repository | DB 접근 |
| Client | 외부 API 호출 |

---

# 📂 프로젝트 구조

```txt
pathtrip/
├── prisma/
│   └── schema.prisma
├── docs/
│   ├── conventions.md
│   ├── requirements.md
│   └── api-spec.md
└── src/
    ├── config/
    ├── constants/
    ├── middlewares/
    ├── modules/
    │   ├── auth/
    │   ├── users/
    │   ├── trips/
    │   ├── places/
    │   ├── routes/
    │   └── maps/
    ├── types/
    └── utils/
```

---

# 📦 모듈 구조

각 도메인 모듈은 다음 구조를 따릅니다.

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

---

# 🚀 실행 방법

## 1. 패키지 설치

```bash
npm install
```

---

## 2. 환경 변수 설정

`.env.sample`을 기반으로 `.env` 파일 생성

```bash
cp .env.sample .env
```

---

## 3. Prisma Client 생성

```bash
npx prisma generate
```

---

## 4. DB Migration 실행

```bash
npx prisma migrate dev
```

---

## 5. 개발 서버 실행

```bash
npm run dev
```

---

# 🌱 환경 변수 예시

```env
NODE_ENV=development

PORT=3000

DATABASE_URL=

JWT_SECRET=

KAKAO_REST_API_KEY=
```

---

# 📘 API Documentation

Swagger 기반 API 문서를 제공합니다.

```txt
http://localhost:3000/api-docs
```

---

# 📖 개발 문서

## Convention

프로젝트 개발 규칙:

```txt
docs/conventions.md
```

---

## Requirements

기능 요구사항 문서:

```txt
docs/requirements.md
```

---

## API Specification

API 명세 문서:

```txt
docs/api-spec.md
```

---

# 🔒 주요 개발 원칙

- TypeScript strict mode 사용
- any 타입 사용 금지
- Prisma는 Repository에서만 사용
- Controller는 얇게 유지
- Service에서 핵심 비즈니스 로직 처리
- Zod 기반 요청 검증
- 공통 에러 처리 사용
- 응답 포맷 통일
- UTC 기준 시간 저장
- RESTful API 설계

---

# 📡 API Versioning

모든 API는 `/api/v1` prefix를 사용합니다.

예시:

```txt
/api/v1/auth/login
/api/v1/trips
/api/v1/places
/api/v1/routes
```

---

# 📄 API 응답 예시

## Success Response

```json
{
  "success": true,
  "data": {}
}
```

---

## Error Response

```json
{
  "success": false,
  "code": "TRIP_NOT_FOUND",
  "message": "여행 일정을 찾을 수 없습니다."
}
```

---

# 🌿 브랜치 전략

```txt
main
develop
feature/*
fix/*
docs/*
refactor/*
```

---

# 📝 커밋 컨벤션

```txt
feat      새로운 기능
fix       버그 수정
refactor  리팩토링
docs      문서 수정
test      테스트 추가
chore     설정 작업
style     포맷 수정
```

## 예시

```txt
feat: 여행 생성 API 추가
fix: JWT 인증 오류 수정
docs: README 수정
```

---

# 🧪 테스트

우선적으로 다음 로직을 테스트합니다.

- Service Layer
- 인증 로직
- 동선 추천 로직
- 핵심 비즈니스 로직

---

# 🛣️ 향후 계획

- AI 기반 동선 추천 고도화
- 사용자 취향 기반 추천
- 여행 일정 공유 기능
- 실시간 교통 정보 반영
- 날씨 기반 추천
- 여행 비용 계산 기능
- 모바일 앱 연동
- Redis 캐싱 적용
- Docker 기반 배포
- CI/CD 구축

---

# 📌 최종 원칙

```txt
Controller  = 요청/응답 처리
Service     = 비즈니스 로직
Repository  = DB 접근
Middleware  = 공통 처리
Client      = 외부 API 호출
```

각 레이어의 역할을 명확히 분리하여  
유지보수성과 확장성을 높이는 것을 목표로 합니다.
