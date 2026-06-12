# PathTrip ERD 설계

> 이 문서는 PathTrip 서비스의 데이터 모델과 Entity 간 관계를 정의한다.
> 본 문서를 기준으로 MikroORM Entity와 MySQL Table을 설계한다.

---

# 1. 문서 목적

이 문서는 PathTrip 서비스에서 사용하는 주요 데이터를 정의하고, 각 데이터가 어떤 관계를 가지는지 설명한다.

본 문서를 통해 다음을 명확히 한다.

* 어떤 Entity가 필요한가
* 각 Entity는 어떤 필드를 가지는가
* Entity 간 관계는 어떻게 연결되는가
* 어떤 필드에 제약 조건이 필요한가
* MikroORM Entity 설계 시 어떤 구조를 기준으로 삼을 것인가

---

# 2. 핵심 도메인

PathTrip MVP의 핵심 도메인은 다음과 같다.

```txt
User
Trip
Place
Route
RoutePlace
```

각 도메인의 역할은 다음과 같다.

| Entity     | 역할                                  |
| ---------- | ----------------------------------- |
| User       | 서비스를 사용하는 회원                        |
| Trip       | 사용자가 생성한 여행 일정                      |
| Place      | 여행에 포함된 방문 장소                       |
| Route      | 추천 또는 저장된 여행 동선                     |
| RoutePlace | Route 안에서 장소의 방문 순서를 관리하는 중간 Entity |

---

# 3. 전체 관계 요약

```txt
User 1 : N Trip

Trip 1 : N Place

Trip 1 : N Route

Route 1 : N RoutePlace

Place 1 : N RoutePlace
```

---

# 4. ERD 다이어그램

```txt
User
 └──< Trip
        ├──< Place
        └──< Route
                └──< RoutePlace >── Place
```

---

# 5. Entity 상세 설계

---

## 5.1 User

사용자 정보를 저장하는 Entity다.

### 역할

* 회원가입한 사용자 정보 관리
* 여행 일정의 소유자 역할
* 인증 대상

### Fields

| Field     | Type        | Required | Unique | Description |
| --------- | ----------- | -------- | ------ | ----------- |
| id        | number      | Y        | Y      | 사용자 ID      |
| email     | string      | Y        | Y      | 사용자 이메일     |
| password  | string      | Y        | N      | 해싱된 비밀번호    |
| nickname  | string      | Y        | N      | 사용자 닉네임     |
| createdAt | Date        | Y        | N      | 생성 시간       |
| updatedAt | Date        | Y        | N      | 수정 시간       |
| deletedAt | Date | null | N        | N      | 삭제 시간       |

### 관계

| 관계              | 설명                      |
| --------------- | ----------------------- |
| User 1 : N Trip | 한 사용자는 여러 여행을 생성할 수 있다. |

### 제약 조건

* email은 unique 해야 한다.
* password는 평문으로 저장하지 않는다.
* 삭제된 사용자는 기본 조회 결과에서 제외한다.

---

## 5.2 Trip

사용자가 생성한 여행 일정을 저장하는 Entity다.

### 역할

* 여행 단위 관리
* 여행에 포함된 장소를 묶는 기준
* 추천 동선 생성의 기준

### Fields

| Field     | Type        | Required | Unique | Description |
| --------- | ----------- | -------- | ------ | ----------- |
| id        | number      | Y        | Y      | 여행 ID       |
| userId    | number      | Y        | N      | 여행 소유자 ID   |
| title     | string      | Y        | N      | 여행 제목       |
| region    | string      | Y        | N      | 여행 지역       |
| startDate | Date        | Y        | N      | 여행 시작일      |
| endDate   | Date        | Y        | N      | 여행 종료일      |
| createdAt | Date        | Y        | N      | 생성 시간       |
| updatedAt | Date        | Y        | N      | 수정 시간       |
| deletedAt | Date | null | N        | N      | 삭제 시간       |

### 관계

| 관계               | 설명                         |
| ---------------- | -------------------------- |
| Trip N : 1 User  | 여행은 한 명의 사용자에게 속한다.        |
| Trip 1 : N Place | 하나의 여행은 여러 장소를 가질 수 있다.    |
| Trip 1 : N Route | 하나의 여행은 여러 추천 동선을 가질 수 있다. |

### 제약 조건

* userId는 User.id를 참조한다.
* title은 비어 있을 수 없다.
* startDate는 endDate보다 늦을 수 없다.
* 삭제된 여행은 기본 조회 결과에서 제외한다.

---

## 5.3 Place

여행에 포함된 방문 장소를 저장하는 Entity다.

### 역할

* 사용자가 방문하고 싶은 장소 관리
* 동선 추천의 기본 데이터
* 위치 정보 저장

### Fields

| Field           | Type        | Required | Unique | Description |
| --------------- | ----------- | -------- | ------ | ----------- |
| id              | number      | Y        | Y      | 장소 ID       |
| tripId          | number      | Y        | N      | 여행 ID       |
| name            | string      | Y        | N      | 장소명         |
| category        | string      | Y        | N      | 장소 카테고리     |
| address         | string      | N        | N      | 주소          |
| latitude        | number      | Y        | N      | 위도          |
| longitude       | number      | Y        | N      | 경도          |
| priority        | string      | N        | N      | 우선순위        |
| stayTimeMinutes | number      | N        | N      | 예상 체류 시간    |
| createdAt       | Date        | Y        | N      | 생성 시간       |
| updatedAt       | Date        | Y        | N      | 수정 시간       |
| deletedAt       | Date | null | N        | N      | 삭제 시간       |

### 관계

| 관계                     | 설명                      |
| ---------------------- | ----------------------- |
| Place N : 1 Trip       | 장소는 하나의 여행에 속한다.        |
| Place 1 : N RoutePlace | 장소는 여러 추천 동선에 포함될 수 있다. |

### 제약 조건

* tripId는 Trip.id를 참조한다.
* latitude는 -90 이상 90 이하 값이어야 한다.
* longitude는 -180 이상 180 이하 값이어야 한다.
* category는 허용된 값만 사용할 수 있다.
* 삭제된 장소는 기본 조회 결과에서 제외한다.

---

## 5.4 Route

자동 생성되거나 저장된 추천 동선을 저장하는 Entity다.

### 역할

* 특정 여행에 대한 추천 동선 저장
* 추천 결과 재조회
* 동선 이름 및 요약 정보 관리

### Fields

| Field                | Type        | Required | Unique | Description |
| -------------------- | ----------- | -------- | ------ | ----------- |
| id                   | number      | Y        | Y      | 추천 동선 ID    |
| tripId               | number      | Y        | N      | 여행 ID       |
| name                 | string      | N        | N      | 추천 동선 이름    |
| totalDistanceMeters  | number      | N        | N      | 총 이동 거리     |
| totalMoveTimeMinutes | number      | N        | N      | 총 이동 시간     |
| optimizationType     | string      | N        | N      | 최적화 기준      |
| createdAt            | Date        | Y        | N      | 생성 시간       |
| updatedAt            | Date        | Y        | N      | 수정 시간       |
| deletedAt            | Date | null | N        | N      | 삭제 시간       |

### 관계

| 관계                     | 설명                           |
| ---------------------- | ---------------------------- |
| Route N : 1 Trip       | 추천 동선은 하나의 여행에 속한다.          |
| Route 1 : N RoutePlace | 하나의 추천 동선은 여러 장소 방문 순서를 가진다. |

### 제약 조건

* tripId는 Trip.id를 참조한다.
* 추천 동선은 최소 2개 이상의 장소를 기반으로 생성된다.
* 삭제된 동선은 기본 조회 결과에서 제외한다.

---

## 5.5 RoutePlace

Route와 Place의 관계를 나타내며, 추천 동선 안에서 장소의 방문 순서를 관리하는 Entity다.

### 역할

* 추천 동선에 포함된 장소 관리
* 장소 방문 순서 관리
* 장소별 예상 도착 시간 및 이동 시간 관리

### Fields

| Field                       | Type   | Required | Unique | Description   |
| --------------------------- | ------ | -------- | ------ | ------------- |
| id                          | number | Y        | Y      | RoutePlace ID |
| routeId                     | number | Y        | N      | 추천 동선 ID      |
| placeId                     | number | Y        | N      | 장소 ID         |
| visitOrder                  | number | Y        | N      | 방문 순서         |
| estimatedArrivalTime        | Date   | N        | N      | 예상 도착 시간      |
| moveTimeFromPreviousMinutes | number | N        | N      | 이전 장소에서 이동 시간 |
| distanceFromPreviousMeters  | number | N        | N      | 이전 장소에서 거리    |
| createdAt                   | Date   | Y        | N      | 생성 시간         |
| updatedAt                   | Date   | Y        | N      | 수정 시간         |

### 관계

| 관계                     | 설명                          |
| ---------------------- | --------------------------- |
| RoutePlace N : 1 Route | RoutePlace는 하나의 추천 동선에 속한다. |
| RoutePlace N : 1 Place | RoutePlace는 하나의 장소를 참조한다.   |

### 제약 조건

* routeId는 Route.id를 참조한다.
* placeId는 Place.id를 참조한다.
* visitOrder는 하나의 route 안에서 중복될 수 없다.
* 하나의 route 안에서 같은 place가 중복 포함되지 않도록 한다.

---

# 6. Enum / Constant 후보

MVP에서는 MySQL enum 또는 코드 상수로 관리할 수 있다.
애플리케이션 코드에서는 TypeScript enum 대신 const object 사용을 우선한다.

---

## 6.1 PlaceCategory

장소 카테고리

```txt
RESTAURANT
CAFE
TOURIST_SPOT
HOTEL
PHOTO_SPOT
ETC
```

### 설명

| Value        | Description |
| ------------ | ----------- |
| RESTAURANT   | 맛집          |
| CAFE         | 카페          |
| TOURIST_SPOT | 관광지         |
| HOTEL        | 숙소          |
| PHOTO_SPOT   | 사진 스팟       |
| ETC          | 기타          |

---

## 6.2 PlacePriority

장소 우선순위

```txt
HIGH
MEDIUM
LOW
```

### 설명

| Value  | Description     |
| ------ | --------------- |
| HIGH   | 반드시 방문하고 싶은 장소  |
| MEDIUM | 가능하면 방문하고 싶은 장소 |
| LOW    | 시간이 남으면 방문할 장소  |

---

## 6.3 OptimizationType

동선 최적화 기준

```txt
DISTANCE
TIME
FOOD
CAFE
TOUR
PHOTO
```

### 설명

| Value    | Description |
| -------- | ----------- |
| DISTANCE | 이동 거리 최소화   |
| TIME     | 이동 시간 최소화   |
| FOOD     | 맛집 우선       |
| CAFE     | 카페 우선       |
| TOUR     | 관광지 우선      |
| PHOTO    | 사진 스팟 우선    |

---

# 7. Soft Delete 정책

다음 Entity는 soft delete를 고려한다.

```txt
User
Trip
Place
Route
```

RoutePlace는 Route에 종속적인 데이터이므로 기본적으로 hard delete 또는 cascade delete를 고려한다.

---

## Soft Delete 필드

```txt
deletedAt
```

---

## 조회 정책

soft delete가 적용된 Entity는 기본 조회 시 다음 조건을 적용한다.

```txt
deletedAt IS NULL
```

---

# 8. Index 후보

성능과 조회 조건을 고려하여 다음 index를 고려한다.

---

## User

| Field | Reason     |
| ----- | ---------- |
| email | 로그인, 중복 검사 |

---

## Trip

| Field     | Reason         |
| --------- | -------------- |
| userId    | 사용자의 여행 목록 조회  |
| deletedAt | 삭제되지 않은 여행 필터링 |
| startDate | 여행 날짜 기준 정렬    |

---

## Place

| Field               | Reason          |
| ------------------- | --------------- |
| tripId              | 특정 여행의 장소 목록 조회 |
| category            | 카테고리 필터         |
| deletedAt           | 삭제되지 않은 장소 필터링  |
| latitude, longitude | 위치 기반 계산        |

---

## Route

| Field     | Reason          |
| --------- | --------------- |
| tripId    | 특정 여행의 추천 동선 조회 |
| deletedAt | 삭제되지 않은 동선 필터링  |

---

## RoutePlace

| Field               | Reason           |
| ------------------- | ---------------- |
| routeId             | 특정 동선의 장소 순서 조회  |
| placeId             | 특정 장소가 포함된 동선 조회 |
| routeId, visitOrder | 동선 내 방문 순서 정렬    |

---

# 9. 관계 설계 이유

## User와 Trip을 분리한 이유

하나의 사용자는 여러 여행을 생성할 수 있다.
여행은 반드시 소유자가 필요하므로 User와 Trip은 1:N 관계로 설계한다.

---

## Trip과 Place를 분리한 이유

하나의 여행에는 여러 장소가 포함될 수 있다.
장소는 특정 여행 안에서만 의미를 가지므로 Trip과 Place는 1:N 관계로 설계한다.

---

## Trip과 Route를 분리한 이유

하나의 여행에 대해 여러 추천 동선을 저장할 수 있다.
예를 들어 사용자는 거리 최소화 동선, 맛집 중심 동선, 카페 중심 동선을 각각 저장할 수 있다.

---

## Route와 Place를 직접 N:M으로 연결하지 않고 RoutePlace를 둔 이유

Route 안에서 Place는 단순히 포함 여부만 중요한 것이 아니라 방문 순서, 이전 장소로부터 이동 시간, 이전 장소로부터 이동 거리 같은 추가 정보가 필요하다.

따라서 단순 N:M 관계가 아니라 중간 Entity인 RoutePlace를 두어 관계 자체의 속성을 관리한다.

---

# 10. MVP 기준 Entity 목록

MVP에서 우선 구현할 Entity는 다음과 같다.

```txt
User
Trip
Place
Route
RoutePlace
```

---

# 11. 추후 확장 Entity 후보

향후 기능 확장을 위해 다음 Entity를 고려한다.

---

## Review

장소 리뷰와 평점을 관리한다.

예상 관계:

```txt
User 1 : N Review
Place 1 : N Review
```

---

## Bookmark

사용자가 공개된 추천 동선을 저장한다.

예상 관계:

```txt
User 1 : N Bookmark
Route 1 : N Bookmark
```

---

## Follow

사용자 간 팔로우 관계를 관리한다.

예상 관계:

```txt
User N : M User
```

---

## CreatorProfile

크리에이터 계정 정보를 관리한다.

예상 관계:

```txt
User 1 : 1 CreatorProfile
```

---

## StoreInquiry

매장 문의 기능을 관리한다.

예상 관계:

```txt
User 1 : N StoreInquiry
Place 1 : N StoreInquiry
```

---

# 12. Entity 설계 시 주의사항

* Entity는 단수형으로 작성한다.
* 공통 필드인 id, createdAt, updatedAt을 포함한다.
* soft delete 대상은 deletedAt을 포함한다.
* 비밀번호는 평문으로 저장하지 않는다.
* 외부 API 응답 구조를 Entity에 그대로 반영하지 않는다.
* Entity는 DB 구조와 도메인 관계를 표현한다.
* 비즈니스 로직은 Entity에 과도하게 넣지 않고 Service에서 처리한다.
* RoutePlace처럼 관계 자체에 속성이 필요한 경우 중간 Entity를 둔다.
