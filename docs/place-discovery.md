# 지역별 장소 추천

여행 상세 → 장소 추가에서 여행의 `region`과 선택한 지도 공급자를 사용해 관광·맛집·카페·사진·숙소·기타 후보를 즉시 조회한다. 분류 전환 시 검색어를 초기화한다. 이전 요청이 늦게 끝나더라도 새 분류의 결과를 덮어쓰지 않는다. 검색어 입력은 선택 사항이다.

- Google: 서버의 `GOOGLE_PLACES_API_KEY`로 Places API (New) Text Search 호출. 가져온 최대 20개 후보를 리뷰 수순(기본), 평점순 또는 관련도순으로 정렬한다. 실제 방문 횟수나 지역 전체의 인기 순위가 아니다. 리뷰 수·평점 필드는 Enterprise 요금이 적용되므로 운영 프로젝트에서 해당 API·결제·서버 키 제한을 설정해야 한다.
- Kakao: `KAKAO_MAP_REST_API_KEY`로 Local 키워드/분류 검색. 관련도순 최대 15개. 이 API는 리뷰 수와 평점을 주지 않으므로 해당 값과 정렬을 만들지 않는다. 국내 여행은 카카오, 해외 여행은 Google 자동 선택을 유지하며 사용자 수동 선택도 따른다.
- 미리보기: 오키나와·제주 샘플. 모든 좌표와 일부 명칭은 화면 검증용 예시이며 실제 추천·영업 정보·리뷰가 아니다. 지원하지 않는 지역은 빈 상태를 표시한다. 실제 모드에서 API 오류를 샘플로 몰래 대체하지 않는다.

`DiscoveryClient`는 외부 요청·시간 제한·응답 검증을, `DiscoveryService`는 중복 제거·정렬을 담당한다. 공통 API 클라이언트를 통해 웹과 앱에 같은 DTO를 전달한다. 각 카드에서 상세 링크를 열거나 여행에 담을 수 있다. 인증된 요청만 허용하며 분당 30회 IP 제한을 둔다.

새 Google 추천에서 담은 장소는 면제 대상인 place ID와 앱 자체 분류·우선순위·체류 시간만 저장한다. 공급자의 이름·주소·좌표는 조회 시 다시 가져오며 API 응답은 `private, no-store`이다. 조회 실패한 좌표는 지도에서 제외하고 동선 계산은 오류로 중단한다. Google 출처 장소는 Google 지도에서만 표시하며 목록에는 Google Maps와 제3자 출처를 표시한다. 기존 출처가 없는 장소 기록은 이 마이그레이션으로 식별하거나 변환하지 않는다.

검증: `npm test`, `npm run build:clients`. 관련 테스트는 `tests/unit/discovery.test.mjs`. 로컬·배포 DB에 `npm run prisma:deploy` 후 API를 재시작한다. 지도 API 키가 없는 환경에서는 응답 계약·정렬·저장·오류 처리를 모의 응답으로 검증하고 실제 공급자 응답 검증은 별도로 수행한다.

공식 문서: [Google Text Search](https://developers.google.com/maps/documentation/places/web-service/text-search), [Google Places 정책](https://developers.google.com/maps/documentation/places/web-service/policies), [Kakao Local](https://developers.kakao.com/docs/ko/local/dev-guide).
