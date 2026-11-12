# PathTrip iOS

Expo와 React Native로 만든 PathTrip iOS 클라이언트입니다. 루트의
`@pathtrip/api-client`를 사용해 기존 Express API에 연결합니다.

## iOS 경험

- 국내 여행은 카카오맵, 해외 여행은 Google Maps를 기본으로 사용합니다.
- 여행의 `사용할 지도 선택`에서 자동/카카오/구글을 직접 선택할 수 있습니다.
- Google Maps는 네이티브 지도, 카카오는 Next.js의 `/maps/view`를 WebView로 표시합니다. Apple MapKit으로 자동 대체하지 않습니다.
- 장소 검색은 선택한 지도에 맞춰 카카오 Local 또는 Google Places API (New)를 사용합니다.
- 여행 날짜는 네이티브 날짜 선택기로 입력하고, 주요 동작에는 햅틱 피드백을 제공합니다.
- Safe Area, VoiceOver 레이블, 앱 아이콘과 네이티브 시작 화면을 포함합니다.
- 작은 버튼은 최소 44pt로 확보하고 주변 8pt까지 터치를 받습니다. 눌렀을 때
  즉시 시각 피드백을 주며, 동작은 손을 뗄 때 실행해 스크롤 오작동을 방지합니다.
- 일반 선택에는 가벼운 선택 햅틱을 쓰며 햅틱 실패가 버튼 동작을 막지 않습니다.

API 키, 도메인, DB 설정은 [지도 연결 안내](../../docs/maps-setup.md)를 참고하세요.
미리보기 검색은 실제 API 대신 내장 제주 샘플을 사용합니다. 지도 위 선은
방문 순서이며 도로 길찾기가 아닙니다.

## 로컬 실행

### 이 Mac에서 앱 화면 미리보기 (브라우저)

루트에서 `npm run preview:app`을 실행하고
`http://localhost:8081/preview.html`을 열면 휴대폰 프레임 안에서 실제 모바일 앱
컴포넌트로 여행·장소·동선·지도 설정 화면을 조작할 수 있습니다.
`apps/web`의 웹사이트와는 별도입니다.

이것은 iOS 시뮬레이터가 아닌 React Native Web 기반 UI 미리보기입니다.
샘플 데이터로 시작하며 새로고침하면 초기화됩니다. 지도는 안내 화면으로 대체하고
날짜 선택·알림은 브라우저 기능을 사용합니다. 네이티브 기능과 실제 지도는 iPhone에서 검증하세요.
브라우저에서 로그인하더라도 토큰은 메모리에만 보관하며, iOS 보안 저장소 구현은 유지합니다.

### iOS 실행

Xcode와 iOS 시뮬레이터 런타임, CocoaPods가 설치되어 있어야 합니다.
Xcode 27에서는 시뮬레이터 화면을 Device Hub에서 볼 수 있습니다.
`npm run ios`는 이제 네이티브 앱을 빌드하여 시뮬레이터에 설치합니다.
Expo 57 템플릿의 iOS 27 시작 호환성은 `plugins/withSceneLifecycle.cjs`가
보완합니다. Expo의 scene delegate를 등록하고 앱 창 생성 시점을 scene으로
옮기므로, prebuild를 다시 실행해도 이 설정이 유지됩니다.

```bash
cp .env.example .env
npm run ios --workspace @pathtrip/mobile
```

iOS 시뮬레이터에서는 API 기본 주소 `http://localhost:3113`을 사용할 수
있습니다. 실제 iPhone에서는 `.env`의 `EXPO_PUBLIC_API_BASE_URL`을 같은
네트워크의 Mac 주소 또는 HTTPS 운영 API 주소로 변경해야 합니다.
`EXPO_PUBLIC_MAP_WEB_BASE_URL`도 접근 가능한 웹 주소로 설정하세요.
Google iOS 키를 추가/변경하면 네이티브 앱을 다시 빌드해야 합니다.
Expo Go 미리보기만으로 App Store용 지도 연동이 검증되는 것은 아닙니다.
실제 로그인 계정은 [로컬 로그인 테스트](../../docs/local-testing.md)를 참고하세요.
관리자 계정은 홈에 관리자 배지가 표시되며, 별도 관리 화면은 아직 없습니다.

### 개발 서버 없이 실행하는 시뮬레이터 앱

프로젝트 루트에서 아래 명령으로 Release 구성의 `.app`을 빌드할 수 있습니다.

```bash
npm run ios:build:simulator --workspace @pathtrip/mobile -- --output ./build/simulator
```

이 빌드는 JavaScript를 앱에 포함하므로 Metro 개발 서버 없이 실행할 수 있습니다.
실제 지도 웹 화면이나 로그인 API는 해당 서버가 실행 중이어야 하며,
`미리 둘러보기`는 샘플 데이터로 이용할 수 있습니다.
시뮬레이터 전용 `.app`은 실제 iPhone 설치용이나 App Store 제출용 `.ipa`가 아닙니다.

네이티브 프로젝트는 `ios/`에 생성됩니다. Expo 플러그인·앱 설정을 변경했다면
다시 prebuild와 CocoaPods 설치를 실행한 뒤 빌드하세요. 생성된 네이티브 파일에
수동 변경이 있다면 prebuild 전에 그 변경을 확인해야 합니다.

```bash
cd apps/mobile
npx expo prebuild --platform ios --no-install
cd ios
pod install
```

## App Store 빌드

Expo 계정과 Apple Developer 설정을 마친 뒤 아래 명령을 사용합니다.

```bash
npx eas-cli build --platform ios --profile production
npx eas-cli submit --platform ios --profile production
```

운영 빌드에서는 HTTPS API·지도 웹 주소와 플랫폼별 지도 키를 설정합니다.
EAS 빌드 환경에도 변수를 등록하고 TestFlight에서 실제 지도를 확인한 뒤 제출하세요.

의존성 패치와 남은 개발 도구 감사 항목은 [보안 검증 기록](../../docs/dependency-security.md)을 참고하세요.
