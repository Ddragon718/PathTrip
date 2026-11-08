# PathTrip 웹

Next.js 클라이언트입니다. Express API와 `@pathtrip/api-client`의 타입·호출 코드를 공유합니다.

## 실행

프로젝트 루트에서 의존성을 설치하고 API와 DB를 실행합니다.
`apps/web/.env.example`을 참고해 `.env.local`을 설정한 뒤 실행합니다.

```bash
npm run dev:web
```

주소는 `http://localhost:3000`입니다. 미리보기는 샘플 데이터이며 저장되지 않습니다.
실제 로그인은 [로컬 계정 안내](../../docs/local-testing.md)를 참고하세요.

## 지도

- 국내 여행은 카카오, 해외 여행은 Google이 기본입니다. 여행별 직접 선택이 우선합니다.
- 표시용 변수: `NEXT_PUBLIC_KAKAO_MAP_JS_KEY`, `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`, `NEXT_PUBLIC_GOOGLE_MAP_ID`.
- 검색용 서버 변수: `KAKAO_MAP_REST_API_KEY`, `GOOGLE_PLACES_API_KEY`. 서버 키를 공개 변수에 넣지 마세요.
- 키가 없으면 안내 화면을 표시합니다. 지도 위 연결선은 방문 순서이며 실제 도로 경로가 아닙니다.
- `/maps/view`는 메시지로 장소를 받아 표시하는 임베디드 지도 페이지입니다. 허용한 origin의 메시지만 처리합니다.

## 검증과 운영 빌드

```bash
npm test
npm run build --workspace @pathtrip/web
npm run start:web
```

빌드 후 standalone 출력에 `.next/static`과 `public`을 복사합니다. 지도 실행 파일
`/map-runtime.js`도 포함되어 별도 CDN 없이 제공됩니다. 실행 포트는 운영 환경의 `PORT`로 설정합니다.
실제 지도 SDK 및 장소 검색은 공급자별 키·도메인 제한을 설정한 뒤 별도로 검증해야 합니다.

## 의존성 보안

Next.js는 16.4.5로 고정합니다. 16.4.0에서 보고된 이미지 최적화·Server Actions·캐시 관련 보안 문제의 패치가 포함된 버전입니다.
업데이트 시 lockfile을 함께 갱신하고 깨끗한 설치에서 테스트·운영 빌드·아래 감사를 확인합니다.

```bash
npm audit --workspace @pathtrip/web --omit=dev
```

공식 권고: [이미지 최적화](https://github.com/vercel/next.js/security/advisories/GHSA-2464-fhr4-w9xw), [Server Actions](https://github.com/vercel/next.js/security/advisories/GHSA-p3m5-59mp-jv5r), [캐시](https://github.com/vercel/next.js/security/advisories/GHSA-673q-mjm6-r5xr).
