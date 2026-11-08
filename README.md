# PathTrip API

방문 장소와 우선순위로 여행 동선을 추천하는 Express API와 공통 TypeScript 클라이언트입니다.

## 실행

Node.js 22 이상과 PostgreSQL이 필요합니다. 루트 .env.sample을 참고해 .env를 설정한 뒤 실행합니다.
기존 .env가 있다면 덮어쓰지 말고 필요한 변수만 추가하세요.

```bash
npm ci
npm run db:up
npm run prisma:deploy
npm run seed:test-users
npm run dev
```

Docker 대신 기존 로컬 PostgreSQL을 사용할 때는 db:up을 생략하고 DATABASE_URL을 설정합니다.
API 기본 주소는 http://localhost:3113이며 HOST=127.0.0.1에만 바인딩됩니다.
테스트 계정 비밀번호는 LOCAL_TEST_USER_PASSWORD와 LOCAL_TEST_ADMIN_PASSWORD에 직접 설정합니다.

## 기능과 검증

JWT 인증, 사용자 역할, 사용자별 여행·장소 CRUD, 국내 카카오/해외 Google 장소 검색과 지도 설정,
우선순위·직선거리 기반 추천 동선과 저장 기능을 제공합니다. ADMIN도 여행 소유권 검사를 우회하지 못합니다.
도로 기반 길찾기나 실제 교통시간 계산은 구현 범위에 포함되지 않습니다.

```bash
npm test
npm run build
npm run build --workspace @pathtrip/api-client
```

- [API 명세](docs/api-spec.md)
- [데이터 모델](docs/erd.md)
- [로컬 계정과 로그인 검증](docs/local-testing.md)
- [개발·커밋 규칙](docs/conventions.md)

운영 환경에서는 별도의 DB·강한 ACCESS_SECRET·HTTPS 주소를 사용하고 테스트 계정과 키를 배포하지 마세요.

## 웹 클라이언트

Next.js 웹에서 로그인, 여행·장소 관리, 동선 추천과 여행별 지도 선택을 사용할 수 있습니다.

```bash
npm run dev:web
npm run build:all
```

http://localhost:3000에서 실행됩니다. apps/web/.env.example을 참고해 .env.local에 API 주소와 지도 키를 설정합니다.
국내는 카카오맵, 해외는 Google Maps가 기본이며 사용자가 직접 선택할 수도 있습니다.
지도 표시용 키가 없으면 안내 화면이 나오며, 서버 장소 검색 키는 별도로 설정합니다.
미리보기는 메모리의 샘플 데이터이며 실제 저장을 확인하려면 로그인하세요.

자세한 설정과 검증 방법은 [웹 실행 안내](apps/web/README.md)를 참고하세요.
