# PathTrip

방문하고 싶은 장소와 우선순위를 바탕으로 효율적인 여행 동선을 추천하는
웹·iOS 서비스입니다. 하나의 Express API를 Next.js 웹과 Expo iOS 앱이
공유합니다.

## 구현 범위

- JWT 회원가입·로그인·내 정보 조회
- 사용자별 여행 일정 CRUD와 soft delete
- 여행별 장소 CRUD와 소유권 검사
- 국내 카카오맵 / 해외 Google Maps 자동 선택과 여행별 사용자 지도 선택
- 카카오 Local·Google Places 장소 검색, 카카오 주소 좌표 변환
- Haversine 거리와 교통수단별 예상 속도를 이용한 동선 추천
- 추천 동선 저장·조회
- Zod 요청 검증, 공통 응답/오류 형식, 보안 헤더와 인증 rate limit
- 반응형 Next.js 웹사이트와 실제 API 연동
- Expo 기반 iOS 앱과 보안 토큰 저장
- 웹·iOS가 공유하는 TypeScript API 클라이언트

## 기술 스택

- Node.js 24, TypeScript, Express 5
- PostgreSQL 17, Prisma 6
- Next.js 16, React 19
- Expo 57, React Native 0.86
- Zod, JWT, bcrypt
- Node.js Test Runner

## 프로젝트 구조

```text
pathtrip/
├── src/                  Express API
├── prisma/               PostgreSQL 스키마와 migration
├── packages/api-client/  웹·iOS 공통 API 타입과 클라이언트
├── apps/web/             Next.js 웹사이트
└── apps/mobile/          Expo iOS 앱
```

## 빠른 시작

필수 조건은 Node.js 22 이상과 PostgreSQL입니다. Docker가 있다면 포함된 Compose 설정으로 DB를 실행할 수 있습니다.

```bash
cp .env.sample .env
npm ci
npm run db:up
npm run prisma:deploy
npm run seed
npm run dev
```

서버는 기본적으로 `http://localhost:3113`에서 실행됩니다.

```bash
curl http://localhost:3113/health
```

로컬에 PostgreSQL이 이미 있다면 `npm run db:up`은 생략하고 `.env`의 `DATABASE_URL`을 해당 DB에 맞게 변경합니다.

웹사이트는 별도 터미널에서 실행합니다.

```bash
cp apps/web/.env.example apps/web/.env.local
npm run dev:web
```

브라우저에서 `http://localhost:3000`을 엽니다. 로그인 없이
`미리 둘러보기`를 선택하면 샘플 여행으로 전체 화면을 확인할 수 있습니다.

iOS 앱은 Xcode, iOS 시뮬레이터 런타임, CocoaPods가 설치된 macOS에서 실행합니다.

```bash
cp apps/mobile/.env.example apps/mobile/.env
npm run ios --workspace @pathtrip/mobile
```

위 명령은 네이티브 앱을 빌드해 시뮬레이터에 설치합니다. 실제 iPhone을
사용할 때는 `EXPO_PUBLIC_API_BASE_URL`을 Mac의 로컬 네트워크 주소 또는
HTTPS 운영 API 주소로 변경해야 합니다.
개발 서버 없이 실행하는 시뮬레이터 앱 빌드는 [iOS 실행 안내](apps/mobile/README.md)를 참고하세요.

## 데모 계정

`npm run seed`를 실행하면 다음 계정과 제주 여행 샘플이 생성됩니다.

- 이메일: `demo@pathtrip.local`
- 비밀번호: `pathtrip1234`

실제 로그인용 `test@pathtrip.local`(USER)과 `admin@pathtrip.local`(ADMIN)은
`.env`에 각각 `LOCAL_TEST_USER_PASSWORD`, `LOCAL_TEST_ADMIN_PASSWORD`를
설정한 뒤 `npm run seed:test-users`로 생성합니다. 비밀번호는 저장소에 올리지 않습니다.
ADMIN은 역할 구분이며 별도 관리자 화면이나 타인의 여행 접근 권한은 아직 없습니다.
자세한 절차는 [로컬 로그인 테스트](docs/local-testing.md)를 참고하세요.

## 주요 명령어

| 명령어                  | 설명                                  |
| ----------------------- | ------------------------------------- |
| `npm run dev`           | 변경 감지 개발 서버                   |
| `npm run dev:web`       | Next.js 웹 개발 서버                  |
| `npm run dev:mobile`    | Expo iOS 개발 서버                    |
| `npm run build`         | Prisma Client 생성 및 TypeScript 빌드 |
| `npm run build:all`     | API·공통 모듈·웹·iOS 전체 검증        |
| `npm test`              | 빌드 후 자동 테스트                   |
| `npm run db:up`         | PostgreSQL 컨테이너 실행              |
| `npm run db:down`       | 컨테이너 종료                         |
| `npm run prisma:deploy` | 작성된 DB migration 적용              |
| `npm run seed`          | 로컬 데모 데이터 생성                 |

## API 흐름

1. `POST /api/v1/auth/signup` 또는 `POST /api/v1/auth/login`
2. 반환된 `accessToken`을 `Authorization: Bearer <token>`으로 전달
3. `POST /api/v1/trips`로 여행 생성
4. `POST /api/v1/trips/:tripId/places`로 장소 두 개 이상 등록
5. `POST /api/v1/trips/:tripId/routes/recommend`로 동선 추천
6. `POST /api/v1/trips/:tripId/routes`로 추천 결과 저장

상세 요청·응답은 [API 명세](docs/api-spec.md), 기능 범위는 [요구사항](docs/requirements.md), 데이터 구조는 [ERD](docs/erd.md)를 참고하세요.

## 지도 API

국내 여행은 카카오맵, 해외 여행은 Google Maps를 자동 선택합니다. 여행별로
자동/카카오/구글을 직접 선택할 수 있으며 지도와 장소 검색이 함께 전환됩니다.
웹은 각 JavaScript SDK, iOS는 Google 네이티브 지도와 카카오 WebView를 사용합니다.

지도 표시용 키와 서버 장소 검색용 키는 별개입니다. 키가 없으면 연결 안내를 표시하며,
장소 수동 입력·목록과 자체 동선 추천은 계속 사용할 수 있습니다.
설정과 출시 전 확인 사항은 [지도 연결 안내](docs/maps-setup.md)를 참고하세요.

## 추천 알고리즘의 MVP 범위

현재 추천은 직선거리(Haversine), 장소 우선순위, 선택한 테마를 결합한 nearest-neighbor 방식입니다. 출발 좌표를 받지 않으므로 첫 장소까지의 이동 거리는 0이며, 도로 기반 실제 거리·교통시간은 후속 고도화 범위입니다.

## 배포 환경 변수

- API: `DATABASE_URL`, `ACCESS_SECRET`, `CLIENT_URL`, `KAKAO_MAP_REST_API_KEY`, `GOOGLE_PLACES_API_KEY`
- 웹: `NEXT_PUBLIC_API_BASE_URL`, `NEXT_PUBLIC_KAKAO_MAP_JS_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAP_ID`
- iOS: `EXPO_PUBLIC_API_BASE_URL`, `EXPO_PUBLIC_MAP_WEB_BASE_URL`, `EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY`

운영 환경의 API 주소는 HTTPS를 사용하고 `CLIENT_URL`에는 실제 웹 도메인을
설정합니다. iOS 빌드 프로필은 [EAS 설정](apps/mobile/eas.json)에 정의되어
있습니다.

API는 기본적으로 `HOST=127.0.0.1`에만 바인딩됩니다. 컨테이너 배포나 실제
iPhone의 LAN 테스트에는 접근 범위와 방화벽을 확인한 뒤 `HOST`를 명시적으로
설정하세요. 공개 환경에서는 테스트 계정을 사용하지 마세요.
