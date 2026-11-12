# 카카오·Google 지도 연결

## 동작 규칙

여행마다 `destinationType`(국내/해외)과 `mapPreference`(자동/카카오/구글)를 저장합니다.
자동 선택은 국내 → 카카오, 해외 → 구글입니다. 사용자의 직접 선택이 지역보다 우선합니다.
여행 구분은 사용자가 선택하며 지역 이름을 추측해서 판정하지 않습니다.
기존 여행에는 국내/자동 기본값이 적용되므로 해외 여행은 설정을 변경하세요.

- 웹: 여행 상세 상단의 `여행 구분`과 `사용할 지도`.
- iOS: 여행 상세의 `사용할 지도 선택`.
- 선택하면 지도·장소 검색이 함께 변경됩니다. 기존 장소는 삭제되지 않습니다.
- 로그인한 여행의 설정은 API를 통해 저장됩니다. 미리보기 모드는 메모리에만 유지됩니다.
- 카카오를 해외 여행에 직접 선택할 수 있지만 해외 검색·지도 지원이 제한될 수 있다는 안내를 표시합니다.
- 현재 선은 방문 순서 연결선이며 도로 경로가 아닙니다. 거리·시간도 직선거리 기반 추정치입니다.

## 1. 데이터베이스

PostgreSQL을 실행하고 루트 `.env`의 `DATABASE_URL`을 확인한 후 실행합니다.

```bash
npm run prisma:deploy
npm run build
```

`20261018000100_trip_map_preferences` migration이 두 설정 컬럼을 추가합니다.
운영 DB는 먼저 백업하고 migration을 적용한 뒤 새 API를 배포하세요.

## 2. 키 설정

예제 파일을 참고해 실제 환경 파일을 만드세요. 이미 있는 파일은 덮어쓰지 말고 필요한 항목만 추가합니다.
실제 키를 Git이나 채팅에 붙여 넣지 마세요.

| 환경 파일             | 변수                                  | 용도                                                    |
| --------------------- | ------------------------------------- | ------------------------------------------------------- |
| 루트 `.env`           | `KAKAO_MAP_REST_API_KEY`              | 서버의 카카오 장소 검색·주소 변환                       |
| 루트 `.env`           | `GOOGLE_PLACES_API_KEY`               | 서버의 Google Places API (New) 검색                     |
| `apps/web/.env.local` | `NEXT_PUBLIC_KAKAO_MAP_JS_KEY`        | 웹 및 iOS WebView의 카카오 지도                         |
| `apps/web/.env.local` | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`     | 웹 Google Maps JavaScript API                           |
| `apps/web/.env.local` | `NEXT_PUBLIC_GOOGLE_MAP_ID`           | Google JavaScript 지도 ID. 미설정 시 개발용 DEMO_MAP_ID |
| `apps/mobile/.env`    | `EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY` | Google Maps SDK for iOS                                 |
| `apps/mobile/.env`    | `EXPO_PUBLIC_MAP_WEB_BASE_URL`        | 카카오 지도 화면을 제공하는 Next.js 주소                |

### 카카오

JavaScript 키에 `http://localhost:3000`과 운영 웹 도메인을 등록합니다.
실제 iPhone에서 Mac의 LAN 주소를 사용하면 그 주소도 등록해야 합니다.
REST API 키를 JavaScript 키 자리에 넣지 마세요.
콘솔에서 해당 앱의 지도 사용 설정도 확인하세요.
등록한 도메인에서만 웹 지도가 동작합니다. [공식 가이드](https://apis.map.kakao.com/web/guide/)

### Google

Maps JavaScript API, Maps SDK for iOS, Places API (New)를 필요한 프로젝트에서 활성화합니다.
Google Cloud의 결제·할당량 설정도 확인하세요. 키는 웹/서버/iOS용을 분리합니다.

- 웹 키: HTTP referrer를 개발·운영 웹 도메인으로 제한하고 Maps JavaScript API만 허용합니다.
- iOS 키: 앱 번들 ID `com.pathtrip.app`으로 제한하고 Maps SDK for iOS를 허용합니다.
- 서버 키: Places API (New)로 제한합니다. 고정 송신 IP가 있는 배포 환경이면 IP 제한도 설정합니다.
- 공개 접두사(`NEXT_PUBLIC_`, `EXPO_PUBLIC_`) 키는 사용자에게 노출되는 키입니다. 서버 검색 키는 여기에 넣지 마세요.

Google iOS 설정은 `apps/mobile/app.config.ts`의 `react-native-maps` 플러그인으로 전달합니다.
키 변경 후 JS 새로고침만 하지 말고 네이티브 앱을 다시 빌드하세요.
[Expo iOS 지도 설정](https://docs.expo.dev/versions/latest/sdk/map-view/#ios),
[Google iOS 설정](https://developers.google.com/maps/documentation/ios-sdk/get-api-key),
[Places 검색 요청](https://developers.google.com/maps/documentation/places/web-service/text-search)

## 3. 실행과 iPhone 연결

API와 웹을 각각 실행합니다.

```bash
npm run dev
npm run dev:web
```

시뮬레이터의 기본 주소는 API `http://localhost:3113`, 지도 웹 `http://localhost:3000`입니다.
실제 iPhone의 localhost는 Mac이 아니므로 두 주소를 접근 가능한 Mac LAN 주소로 바꿉니다.
배포 앱에서는 두 주소 모두 HTTPS 운영 주소를 사용합니다.

카카오 iOS 지도는 네이티브 카카오 SDK가 아니라 공식 웹 SDK를 WebView에 표시합니다.
따라서 웹 배포가 필요합니다. 구글 iOS 지도는 네이티브 SDK를 사용합니다.
Apple 지도는 대체 제공자로 사용하지 않습니다.
EAS를 사용하면 빌드 환경에도 변수들을 등록하고 새 빌드를 생성하세요.

## 4. 출시 전 실제 연동 검증

자동 테스트는 외부 SDK·검색 응답을 모킹하므로 실제 키·네트워크·결제·도메인 설정을 검증하지 않습니다.

- [ ] DB migration 성공 후 로그인한 여행을 생성·수정·재조회해 선택 유지 확인
- [ ] 국내 + 자동: 카카오 지도 표시, 국내 장소 검색·추가·마커 확인
- [ ] 해외 + 자동: Google 지도 표시, 해외 장소 검색·추가·마커 확인
- [ ] 카카오/구글 직접 선택, 자동 선택 복귀, 기존 장소·동선 유지 확인
- [ ] iOS 새 네이티브 빌드에서 Google 지도 표시 확인 (Expo Go만으로 대체하지 않음)
- [ ] 실제 iPhone 카카오 WebView 접속, 확대·이동·마커·연결선 확인
- [ ] 검색 실패·네트워크 끊김·빈 결과·잘못된 키에서 오류 안내 확인
- [ ] 운영 도메인·키 제한·할당량과 지도/장소 데이터 사용 정책을 출시 전에 확인

키 미설정 시 연결 준비 안내가 표시되는 것은 의도된 동작이며 실제 지도 연동 성공을 뜻하지 않습니다.
