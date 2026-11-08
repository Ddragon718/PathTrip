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
