# PathTrip API 키 발급·연결 순서

2026-11-12 공식 문서 확인 기준. 먼저 추천 목록과 방문 인증용 서버 키 3개를 준비하고, 지도 표시용 키를 이어 연결한다. 이미 있는 `.env` 파일을 예제 파일로 덮어쓰지 말고 해당 항목만 수정한다. 키 원문은 채팅·스크린샷·Git에 공유하지 않는다.

## 1. Google: 해외 추천과 지역 방문 인증

1. [Google Cloud Console](https://console.cloud.google.com/)에 로그인하고 PathTrip 프로젝트를 생성하거나 선택한다.
2. 프로젝트에 결제 계정을 연결한다. 비용이 발생할 수 있으므로 본인 계정에서 진행한다.
3. API 라이브러리에서 **Places API (New)**와 **Geocoding API**를 각각 활성화한다. 기존 Places API와 혼동하지 않는다.
4. Google Maps Platform의 **Keys & Credentials**에서 API 키를 생성한다. 키 A는 API 제한에 **Places API (New)**만, 키 B는 **Geocoding API**만 허용한다. 키의 API 제한 선택과 실제 API 활성화는 별도 단계다.
5. 서버 요청용 키에는 웹사이트 referrer나 iOS 번들 제한을 사용하지 않는다. 배포 시 서버의 고정 송신 IP로 제한한다. 로컬 테스트 시에도 해당 API 제한을 적용하고 개발용 키와 운영용 키를 분리한다.
6. 루트 `.env`의 아래 두 항목에 직접 입력한다.

```dotenv
GOOGLE_PLACES_API_KEY=발급한_Places_서버_키
GOOGLE_GEOCODING_API_KEY=발급한_Geocoding_서버_키
```

위 문구는 입력 위치를 설명하는 예시이며 그대로 넣으면 연결되지 않는다. [Places 설정 공식 안내](https://developers.google.com/maps/documentation/places/web-service/get-api-key), [Geocoding 설정 공식 안내](https://developers.google.com/maps/documentation/geocoding/guides-v3/get-api-key).

### 비용 확인

이 앱의 리뷰 수·평점 조회는 Text Search Enterprise 필드에 해당한다. 검색창을 열거나 분류·정렬을 바꾸면 API 요청이 발생한다. Google Maps Platform의 사용량·할당량과 Billing의 예산 알림을 설정한다. **예산 알림 자체는 사용량이나 요금을 자동 차단하지 않는다.** 테스트에 맞는 API 할당량도 조정하고, 현재 가격표에서 무료 사용량과 초과 요금을 확인한다. [Text Search 필드별 과금](https://developers.google.com/maps/documentation/places/web-service/text-search), [비용 관리](https://developers.google.com/maps/billing-and-pricing/manage-costs).

## 2. 카카오: 국내 장소 추천

1. [Kakao Developers](https://developers.kakao.com/)에 로그인하고 개발자 등록 후 PathTrip 앱을 생성한다. 같은 서비스 앱이 있다면 기존 앱을 사용한다.
2. **앱 → 플랫폼 키 → REST API 키**에서 키를 확인한다. JavaScript 키나 어드민 키가 아닌 REST API 키다.
3. 루트 `.env`의 `KAKAO_MAP_REST_API_KEY`에 입력한다. 플랫폼 키에 호출 허용 IP를 설정했다면 실제 서버의 송신 IP와 일치해야 한다.
4. 이 기능은 Local API를 서버에서 호출한다. 카카오 로그인 설정·토큰 발급을 위한 클라이언트 시크릿은 이 기능에 사용하지 않으며 기존 시크릿 설정을 변경할 필요가 없다.

```dotenv
KAKAO_MAP_REST_API_KEY=발급한_카카오_REST_API_키
```

카카오 Local 응답에는 평점·리뷰 수가 없어 국내 추천은 관련도순으로 표시된다. [앱·REST 키 설정](https://developers.kakao.com/docs/ko/app-setting/app), [Local API 공식 안내](https://developers.kakao.com/docs/ko/local/dev-guide).

## 3. 지도 화면에 필요한 추가 키

| 위치 | 변수 | 발급/제한 |
| --- | --- | --- |
| `apps/web/.env.local` | `NEXT_PUBLIC_KAKAO_MAP_JS_KEY` | 같은 카카오 앱의 JavaScript 키. SDK 도메인에 `http://localhost:3000`와 사용하는 개발/운영 도메인 등록 |
| `apps/web/.env.local` | `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Maps JavaScript API 활성화 후 웹 전용 키. HTTP referrer에 사용하는 개발/운영 도메인 제한 |
| `apps/mobile/.env` | `EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY` | Maps SDK for iOS 활성화 후 iOS 전용 키. 번들 ID `com.pathtrip.app`으로 제한 |

웹과 iOS의 공개 키에 서버용 키를 복사하지 않는다. Google 웹 지도 ID는 `NEXT_PUBLIC_GOOGLE_MAP_ID`이며 개발 환경에는 기존 DEMO_MAP_ID 대체가 있다. 운영 시 자신의 지도 ID를 설정한다. 카카오 iOS 화면은 웹 지도를 WebView로 표시하므로 현재 구조에는 카카오 네이티브 SDK 키가 필요하지 않다. [카카오 웹 지도 준비](https://apis.map.kakao.com/web/guide/), 나머지 지도 실행 설정은 [maps-setup.md](maps-setup.md).

## 4. 입력 후 확인

1. API 개발 서버를 재시작한다. `.env` 수정만으로 실행 중인 프로세스의 키가 바뀌지는 않는다. 웹 환경 변수를 바꿨다면 웹 서버도 재시작한다. 이미 실행된 포트에 서버를 중복으로 띄우지 않는다.
2. 앱 미리보기의 ‘먼저 둘러보기’ 대신 **로그인**한다. 오키나와·해외 여행을 만들고 장소 추가를 열면 Google 후보와 실제 리뷰 수가 표시되어야 한다. 국내 여행에서 카카오 추천도 확인한다.
3. 방문자 추천 탭에서 인증 지역 이름을 확인한다. 본인이 실제 머무는 지역의 여행으로, 동의 후 위치 인증을 테스트한다. 한국에서 오키나와 인증을 시도하면 거부되는 것이 정상이다. 정확한 위치 권한을 허용해야 한다.
4. iOS 지도 키나 위치 모듈 설정은 새 네이티브 빌드가 필요하다. 브라우저 앱 미리보기는 지도 대신 안내 화면을 계속 사용한다. 실제 지도는 웹사이트 또는 iOS 앱에서 확인한다.

연결 오류를 전달할 때는 화면의 오류 문구만 공유한다. 키 값은 보내지 않는다. 키를 모두 입력했다면 ‘키 입력 완료’라고 알려주면 서버 재시작과 실제 연결 점검을 이어갈 수 있다.
