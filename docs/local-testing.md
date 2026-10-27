# 로컬 로그인 테스트

## 계정 준비

1. `.env.sample`을 참고해 루트 `.env`의 로컬 `DATABASE_URL`과 `ACCESS_SECRET`을 설정합니다.
2. `LOCAL_TEST_USER_PASSWORD`, `LOCAL_TEST_ADMIN_PASSWORD`에 서로 다른 12~72바이트 비밀번호를 설정합니다.
3. DB를 실행한 뒤 `npm run prisma:deploy`, `npm run seed:test-users`를 실행합니다.
4. `npm run dev`로 API를 실행하고 앱에서 미리보기 대신 로그인합니다.

| 이메일 | 역할 |
| --- | --- |
| `test@pathtrip.local` | USER |
| `admin@pathtrip.local` | ADMIN |

비밀번호는 `.env`에만 보관합니다. 스크립트는 localhost의 `pathtrip` DB에서만
동작하고 운영 모드를 거부합니다. 재실행 시 기존 계정의 비밀번호나 역할을
덮어쓰지 않으며, 설정과 기존 계정이 다르면 중단합니다.

일반 회원가입은 USER로 생성되며 `role` 입력은 거부됩니다. 로그인과 내 정보
응답에 역할이 포함됩니다. ADMIN 전용 화면·API는 아직 없고, ADMIN도 다른
사용자의 여행에 접근할 수 없습니다. 클라이언트의 역할 표시는 권한 검증을
대신하지 않습니다.

## 연결 및 확인

- API 기본 주소: `http://localhost:3113`, 기본 바인딩: `127.0.0.1`.
- `GET /health`는 서버 생존 확인이며 DB 연결 검증은 아닙니다.
- 로그인 후 내 정보·여행 목록 조회로 DB까지 확인합니다. 토큰은 로그에 남기지 않습니다.
- iOS 시뮬레이터는 Mac의 localhost를 사용할 수 있습니다.
- 실제 iPhone은 접근 가능한 HTTPS API 또는 별도로 허용한 LAN 주소가 필요합니다.
- 샘플 미리보기 데이터는 저장되지 않습니다. 로그인 후 만드는 여행은 DB에 저장됩니다.

## 검증 명령

```bash
npm test
npm run build
npm run build --workspace @pathtrip/api-client
```

계정·비밀번호·토큰·DB 데이터·로그는 커밋하지 않습니다. DB 마이그레이션과
생성 스크립트, 관련 검증 코드는 함께 커밋합니다.
