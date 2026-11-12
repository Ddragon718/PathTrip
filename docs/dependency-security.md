# 의존성 보안 검증

## API 보안 패치 — 2026-11-08

직접 의존성의 허용 범위 안에서 lockfile의 아래 간접 의존성을 갱신했습니다.

- `body-parser` 2.4.0: 압축 요청의 남은 바이트로 프로세스가 종료되는 문제 수정.
- `qs` 6.17.1: 배열 직렬화 오류 관련 패치.
- `ip-address` 10.7.6: IPv6 zone identifier 처리의 시간 복잡도 관련 패치.

HTTP 테스트는 압축 해제 후에도 1MB 본문 제한이 적용되는지, 압축 프레임 뒤의
지연된 바이트를 받은 후에도 서버가 응답하는지 확인합니다. 기존 인증·입력 검증
테스트도 함께 실행합니다.

```bash
npm ci
npm test
npm audit --workspaces=false --omit=dev
```

공식 보안 권고: [body-parser](https://github.com/expressjs/body-parser/security/advisories/GHSA-27r3-jxmh-p828).
웹의 Next.js 보안 패치 및 배포 검증은 [웹 문서](../apps/web/README.md)를 참고하세요.

감사 결과는 검사 시점의 공개 권고 기준이며, 보안 문제가 전혀 없음을 보장하지 않습니다.
메이저 버전 변경이나 `npm audit fix --force`는 자동 적용하지 않습니다.

## iOS 개발 도구 — 2026-11-12 재검증

Expo는 SDK 57을 유지하면서 57.0.32로 패치하고, 이에 포함된 CLI 57.0.33 및
호환되는 설정·인증서 도구를 반영했습니다. React Native 0.86.3과 React 19.2.3은 유지합니다.
네이티브 의존성은 `Podfile.lock`과 함께 관리하며 패치 후 iOS Release 빌드를 확인합니다.

전체 `npm audit`에는 `@expo/fingerprint → glob / minimatch` 경로의 중간 등급
4개 패키지 경고가 남아 있습니다(Expo 상위 패키지에 전파된 경고 포함).
이는 프로젝트 지문 생성 도구 경로이며, API와 웹 운영 의존성 감사는 별도로 확인합니다.
현재 high/critical 경고는 없습니다. 이 결과를 전체 취약점 0건으로 해석하면 안 됩니다.

현재 자동 수정 제안은 Expo 58.0.24로의 메이저 업데이트입니다. 기존 SDK 57 앱의
네이티브 호환성 변경이 필요하므로 이번 커밋에서는 자동 적용하지 않습니다.
상위 패키지의 호환 패치가 나오면 재검사하고, 그전에는 신뢰하지 않는 프로젝트·glob 입력을
빌드 도구에 전달하지 마세요. 출시 전에는 전체 감사를 다시 수행해야 합니다.
