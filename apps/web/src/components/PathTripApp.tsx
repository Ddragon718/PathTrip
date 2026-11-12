'use client';
import { PlaceDiscovery } from './PlaceDiscovery';

import {
  ApiError,
  createPathTripClient,
  resolveMapProvider,
  mapProviderLabel,
  type CreateTripInput,
  type DestinationType,
  type MapPreference,
  type MapProvider,
  type CreatePlaceInput,
  type OptimizationType,
  type Place,
  type PlaceCategory,
  type RouteRecommendation,
  type TransportType,
  type Trip,
  type TripDetail,
  type User,
} from '@pathtrip/api-client';
import {
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ArrowIcon,
  BackIcon,
  CalendarIcon,
  ClockIcon,
  CloseIcon,
  LogOutIcon,
  MapIcon,
  PinIcon,
  PlusIcon,
  RouteIcon,
  SparkIcon,
  TrashIcon,
} from './Icons';
import { TravelMap } from './TravelMap';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3113';
const TOKEN_KEY = 'pathtrip-access-token';

const api = createPathTripClient({
  baseUrl: API_BASE_URL,
  getAccessToken: () =>
    typeof window === 'undefined'
      ? null
      : window.localStorage.getItem(TOKEN_KEY),
});

const demoPlaces: Place[] = [
  {
    id: 101,
    name: '함덕 해수욕장',
    category: 'TOURIST_SPOT',
    address: '제주시 조천읍 조함해안로 525',
    latitude: 33.5434,
    longitude: 126.6698,
    priority: 'HIGH',
    stayTimeMinutes: 90,
  },
  {
    id: 102,
    name: '도토리 키친',
    category: 'RESTAURANT',
    address: '제주시 북성로 59',
    latitude: 33.5147,
    longitude: 126.5238,
    priority: 'MEDIUM',
    stayTimeMinutes: 60,
  },
  {
    id: 103,
    name: '아베베 베이커리',
    category: 'CAFE',
    address: '제주시 동문로6길 4',
    latitude: 33.5117,
    longitude: 126.5264,
    priority: 'HIGH',
    stayTimeMinutes: 40,
  },
  {
    id: 104,
    name: '사려니숲길',
    category: 'PHOTO_SPOT',
    address: '제주시 조천읍 교래리 산137-1',
    latitude: 33.4085,
    longitude: 126.6264,
    priority: 'MEDIUM',
    stayTimeMinutes: 120,
  },
];

const demoTrips: Trip[] = [
  {
    id: 1,
    title: '느리게 걷는 제주',
    region: '제주도',
    startDate: '2026-10-24',
    endDate: '2026-10-27',
  },
  {
    id: 2,
    title: '가을의 경주',
    region: '경상북도 경주',
    startDate: '2026-11-07',
    endDate: '2026-11-09',
  },
];

const demoRecommendation: RouteRecommendation = {
  totalDistanceMeters: 47800,
  totalMoveTimeMinutes: 82,
  recommendedPlaces: demoPlaces.map((place, index) => ({
    placeId: place.id,
    name: place.name,
    visitOrder: index + 1,
    estimatedArrivalTime: new Date(
      Date.UTC(2026, 9, 24, 0, 30 + index * 120)
    ).toISOString(),
    moveTimeFromPreviousMinutes: index === 0 ? 0 : ([0, 31, 8, 43][index] ?? 0),
    distanceFromPreviousMeters:
      index === 0 ? 0 : ([0, 18500, 2800, 26500][index] ?? 0),
  })),
};

const categoryLabel: Record<PlaceCategory, string> = {
  RESTAURANT: '맛집',
  CAFE: '카페',
  TOURIST_SPOT: '관광',
  HOTEL: '숙소',
  PHOTO_SPOT: '사진',
  ETC: '기타',
};

const optimizationLabel: Record<OptimizationType, string> = {
  DISTANCE: '짧은 거리',
  TIME: '빠른 이동',
  FOOD: '맛집 중심',
  CAFE: '카페 중심',
  TOUR: '관광 중심',
  PHOTO: '사진 중심',
};

const transportLabel: Record<TransportType, string> = {
  CAR: '자동차',
  PUBLIC_TRANSIT: '대중교통',
  BICYCLE: '자전거',
  WALK: '도보',
};

const formatDate = (value: string) => {
  const date = new Date(`${value}T00:00:00+09:00`);
  if (!Number.isFinite(date.getTime())) return '날짜 확인 필요';
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(date);
};

const tripDays = (trip: Trip) => {
  const start = new Date(`${trip.startDate}T00:00:00Z`).getTime();
  const end = new Date(`${trip.endDate}T00:00:00Z`).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end)) return 1;
  return Math.max(1, Math.round((end - start) / 86_400_000) + 1);
};

const errorMessage = (error: unknown) => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError)
    return '서버에 연결할 수 없습니다. API 서버 주소와 실행 상태를 확인해 주세요.';
  return '예상하지 못한 문제가 발생했습니다.';
};

export function PathTripApp() {
  const [screen, setScreen] = useState<
    'landing' | 'auth' | 'dashboard' | 'trip'
  >('landing');
  const [user, setUser] = useState<User | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [selectedTrip, setSelectedTrip] = useState<TripDetail | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [isBooting, setIsBooting] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    const result = await api.listTrips();
    setTrips(result.items);
  }, []);

  useEffect(() => {
    const restore = async () => {
      const token = window.localStorage.getItem(TOKEN_KEY);
      if (!token) {
        setIsBooting(false);
        return;
      }
      try {
        const [profile, tripResult] = await Promise.all([
          api.me(),
          api.listTrips(),
        ]);
        setUser(profile);
        setTrips(tripResult.items);
        setScreen('dashboard');
      } catch {
        window.localStorage.removeItem(TOKEN_KEY);
      } finally {
        setIsBooting(false);
      }
    };
    void restore();
  }, []);

  const openDemo = () => {
    setIsDemo(true);
    setUser({ id: 0, email: 'preview@pathtrip.kr', nickname: '여행자' });
    setTrips(demoTrips);
    setScreen('dashboard');
    setNotice('미리보기 모드입니다. 데이터는 저장되지 않아요.');
  };

  const openTrip = async (trip: Trip) => {
    setIsBusy(true);
    setNotice(null);
    try {
      const detail = isDemo
        ? { ...trip, places: trip.id === 1 ? demoPlaces : [] }
        : await api.getTrip(trip.id);
      setSelectedTrip(detail);
      setScreen('trip');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  const logOut = () => {
    window.localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    setTrips([]);
    setSelectedTrip(null);
    setIsDemo(false);
    setNotice(null);
    setScreen('landing');
  };

  if (isBooting) {
    return (
      <main className="boot-screen">
        <Logo />
        <span className="loader" />
      </main>
    );
  }

  if (screen === 'landing') {
    return <Landing onStart={() => setScreen('auth')} onDemo={openDemo} />;
  }

  if (screen === 'auth') {
    return (
      <AuthScreen
        onBack={() => setScreen('landing')}
        onAuthenticated={async (nextUser, token) => {
          window.localStorage.setItem(TOKEN_KEY, token);
          setUser(nextUser);
          setIsBusy(true);
          try {
            await loadTrips();
            setScreen('dashboard');
          } catch (error) {
            setNotice(errorMessage(error));
            setScreen('dashboard');
          } finally {
            setIsBusy(false);
          }
        }}
      />
    );
  }

  if (screen === 'trip' && selectedTrip) {
    return (
      <TripWorkspace
        trip={selectedTrip}
        user={user}
        isDemo={isDemo}
        onBack={() => {
          setScreen('dashboard');
          setNotice(null);
        }}
        onLogout={logOut}
        onTripChanged={(nextTrip) => {
          setSelectedTrip(nextTrip);
          setTrips((current) =>
            current.map((trip) =>
              trip.id === nextTrip.id ? { ...trip, ...nextTrip } : trip
            )
          );
        }}
      />
    );
  }

  return (
    <Dashboard
      user={user}
      trips={trips}
      isDemo={isDemo}
      isBusy={isBusy}
      notice={notice}
      onDismissNotice={() => setNotice(null)}
      onOpenTrip={openTrip}
      onLogout={logOut}
      onTripCreated={async (input) => {
        setIsBusy(true);
        setNotice(null);
        try {
          if (isDemo) {
            const nextTrip = { ...input, id: Date.now() };
            setTrips((current) => [nextTrip, ...current]);
          } else {
            await api.createTrip(input);
            await loadTrips();
          }
          return true;
        } catch (error) {
          setNotice(errorMessage(error));
          return false;
        } finally {
          setIsBusy(false);
        }
      }}
    />
  );
}

function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <div className={`logo ${compact ? 'logo-compact' : ''}`}>
      <span className="logo-mark">
        <RouteIcon />
      </span>
      <span>PathTrip</span>
    </div>
  );
}

function Landing({
  onStart,
  onDemo,
}: {
  onStart: () => void;
  onDemo: () => void;
}) {
  return (
    <main className="landing">
      <header className="landing-nav page-shell">
        <Logo />
        <nav aria-label="주요 메뉴">
          <a href="#how">이용 방법</a>
          <a href="#features">주요 기능</a>
        </nav>
        <button className="button button-ghost nav-button" onClick={onStart}>
          로그인
        </button>
      </header>

      <section className="hero page-shell">
        <div className="hero-copy">
          <span className="eyebrow">
            <SparkIcon /> 여행 준비의 새로운 기준
          </span>
          <h1>
            헤매지 말고,
            <br />
            <em>여행하세요.</em>
          </h1>
          <p>
            가고 싶은 곳만 담아주세요. PathTrip이 이동 시간과 취향을 계산해 가장
            자연스러운 하루를 완성합니다.
          </p>
          <div className="hero-actions">
            <button
              className="button button-primary button-large"
              onClick={onStart}
            >
              내 여행 만들기 <ArrowIcon />
            </button>
            <button
              className="button button-text button-large"
              onClick={onDemo}
            >
              미리 둘러보기
            </button>
          </div>
          <div className="hero-proof">
            <div className="avatar-stack" aria-hidden="true">
              <span>민</span>
              <span>J</span>
              <span>윤</span>
            </div>
            <p>
              <strong>여행 계획 시간 72% 절약</strong>
              <br />
              먼저 다녀온 여행자들의 평균이에요
            </p>
          </div>
        </div>

        <div className="hero-visual" aria-label="제주 여행 동선 미리보기">
          <div className="sun-disc" />
          <div className="map-card">
            <div className="map-topbar">
              <span>
                <b>제주 · 첫째 날</b>
                <small>10월 24일 토요일</small>
              </span>
              <span className="map-weather">맑음&nbsp; 21°</span>
            </div>
            <div className="map-canvas">
              <svg
                className="route-drawing"
                viewBox="0 0 500 420"
                aria-hidden="true"
              >
                <path d="M82 88 C150 42, 191 155, 245 134 S315 186, 350 224 S397 302, 432 330" />
              </svg>
              {['08:30', '11:10', '13:00', '15:40'].map((time, index) => (
                <span className={`map-pin map-pin-${index + 1}`} key={time}>
                  <b>{index + 1}</b>
                  <small>{time}</small>
                </span>
              ))}
              <span className="map-label label-one">함덕 해수욕장</span>
              <span className="map-label label-two">도토리 키친</span>
              <span className="map-label label-three">사려니숲길</span>
            </div>
            <div className="route-summary">
              <span>
                <RouteIcon />
                <b>47.8 km</b>
                <small>총 이동 거리</small>
              </span>
              <span>
                <ClockIcon />
                <b>1시간 22분</b>
                <small>예상 이동</small>
              </span>
              <button aria-label="동선 열기">
                <ArrowIcon />
              </button>
            </div>
          </div>
          <div className="floating-note">
            <SparkIcon />
            <span>
              <b>동선을 다시 정리했어요</b>
              <small>이동 시간 34분을 아꼈어요</small>
            </span>
          </div>
        </div>
      </section>

      <section className="how-section page-shell" id="how">
        <div className="section-heading">
          <span className="eyebrow">아주 간단하게</span>
          <h2>여행 계획은 세 단계면 충분해요</h2>
        </div>
        <div className="steps-grid">
          <FeatureCard
            number="01"
            icon={<CalendarIcon />}
            title="여행을 만들고"
            text="지역과 날짜를 정해 여행의 시작점을 만들어 보세요."
          />
          <FeatureCard
            number="02"
            icon={<PinIcon />}
            title="장소를 담으면"
            text="맛집, 카페, 꼭 가고 싶은 스팟을 우선순위와 함께 담아요."
          />
          <FeatureCard
            number="03"
            icon={<RouteIcon />}
            title="동선이 완성돼요"
            text="이동 거리와 취향을 고려한 방문 순서를 바로 추천해 드려요."
          />
        </div>
      </section>

      <section className="feature-band" id="features">
        <div className="page-shell feature-band-inner">
          <div>
            <span className="eyebrow eyebrow-light">PathTrip이 계산할게요</span>
            <h2>
              당신은 여행만
              <br />
              기대하면 돼요.
            </h2>
          </div>
          <div className="stat-card">
            <strong>
              47.8<small>km</small>
            </strong>
            <span>복잡한 동선을 한눈에</span>
            <div className="mini-route">
              <i />
              <i />
              <i />
              <i />
            </div>
          </div>
          <div className="stat-card accent">
            <SparkIcon />
            <strong>
              34<small>분</small>
            </strong>
            <span>평균 이동 시간 절약</span>
          </div>
        </div>
      </section>

      <footer className="landing-footer page-shell">
        <Logo compact />
        <p>여행의 순간에 더 오래 머물 수 있도록.</p>
        <span>© 2026 PathTrip</span>
      </footer>
    </main>
  );
}

function FeatureCard({
  number,
  icon,
  title,
  text,
}: {
  number: string;
  icon: ReactNode;
  title: string;
  text: string;
}) {
  return (
    <article className="feature-card">
      <span className="feature-number">{number}</span>
      <span className="feature-icon">{icon}</span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function AuthScreen({
  onBack,
  onAuthenticated,
}: {
  onBack: () => void;
  onAuthenticated: (user: User, token: string) => void;
}) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    try {
      if (mode === 'signup') await api.signup({ email, password, nickname });
      const result = await api.login({ email, password });
      onAuthenticated(result.user, result.accessToken);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="auth-layout">
      <section className="auth-story">
        <button
          className="icon-button auth-back"
          onClick={onBack}
          aria-label="홈으로"
        >
          <BackIcon />
        </button>
        <Logo />
        <div className="auth-quote">
          <span className="eyebrow eyebrow-light">Plan less. Travel more.</span>
          <h1>
            좋은 여행은
            <br />
            좋은 흐름에서
            <br />
            시작됩니다.
          </h1>
          <p>
            가고 싶은 마음이 길을 잃지 않도록,
            <br />
            PathTrip이 순서를 찾아드릴게요.
          </p>
        </div>
        <div className="auth-route-art">
          <i />
          <i />
          <i />
          <i />
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-form-wrap">
          <span className="auth-kicker">
            {mode === 'login' ? '다시 만나 반가워요' : '여행을 시작해 볼까요?'}
          </span>
          <h2>{mode === 'login' ? '로그인' : '회원가입'}</h2>
          <p>
            {mode === 'login'
              ? '저장해 둔 여행으로 돌아가세요.'
              : '하나의 계정으로 웹과 iPhone에서 함께 사용하세요.'}
          </p>
          <div className="segmented-control">
            <button
              className={mode === 'login' ? 'active' : ''}
              onClick={() => {
                setMode('login');
                setError(null);
              }}
            >
              로그인
            </button>
            <button
              className={mode === 'signup' ? 'active' : ''}
              onClick={() => {
                setMode('signup');
                setError(null);
              }}
            >
              회원가입
            </button>
          </div>
          <form onSubmit={submit} className="form-stack">
            {mode === 'signup' && (
              <Field label="닉네임">
                <input
                  value={nickname}
                  onChange={(event) => setNickname(event.target.value)}
                  minLength={2}
                  maxLength={30}
                  placeholder="여행에서 불릴 이름"
                  required
                />
              </Field>
            )}
            <Field label="이메일">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </Field>
            <Field label="비밀번호">
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={mode === 'signup' ? 8 : 1}
                maxLength={72}
                placeholder={
                  mode === 'signup' ? '8자 이상 입력' : '비밀번호 입력'
                }
                autoComplete={
                  mode === 'login' ? 'current-password' : 'new-password'
                }
                required
              />
            </Field>
            {error && (
              <div className="form-error" role="alert">
                {error}
              </div>
            )}
            <button
              className="button button-primary button-full"
              disabled={isSubmitting}
            >
              {isSubmitting
                ? '연결 중…'
                : mode === 'login'
                  ? '로그인하기'
                  : '가입하고 시작하기'}{' '}
              <ArrowIcon />
            </button>
          </form>
          <p className="auth-help">
            API 서버: <code>{API_BASE_URL}</code>
          </p>
        </div>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

type NewTripInput = CreateTripInput;

function Dashboard({
  user,
  trips,
  isDemo,
  isBusy,
  notice,
  onDismissNotice,
  onOpenTrip,
  onLogout,
  onTripCreated,
}: {
  user: User | null;
  trips: Trip[];
  isDemo: boolean;
  isBusy: boolean;
  notice: string | null;
  onDismissNotice: () => void;
  onOpenTrip: (trip: Trip) => void;
  onLogout: () => void;
  onTripCreated: (input: NewTripInput) => Promise<boolean>;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const nearestTrip = trips[0];
  return (
    <main className="app-background">
      <AppHeader user={user} isDemo={isDemo} onLogout={onLogout} />
      <section className="dashboard page-shell">
        {notice && <Notice text={notice} onClose={onDismissNotice} />}
        <div className="dashboard-heading">
          <div>
            <span className="eyebrow">나의 여행 서랍</span>
            <h1>
              {user?.nickname ?? '여행자'}님,
              <br />
              어디로 떠나볼까요?
            </h1>
          </div>
          <button
            className="button button-primary"
            onClick={() => setShowCreate(true)}
          >
            <PlusIcon /> 새 여행 만들기
          </button>
        </div>

        {nearestTrip && (
          <button
            className="next-trip-card"
            onClick={() => onOpenTrip(nearestTrip)}
            disabled={isBusy}
          >
            <div className="next-trip-copy">
              <span className="trip-status">
                <i /> 다음 여행 · D-
                {Math.max(
                  0,
                  Math.ceil(
                    (new Date(
                      `${nearestTrip.startDate}T00:00:00+09:00`
                    ).getTime() -
                      Date.now()) /
                      86_400_000
                  )
                )}
              </span>
              <h2>{nearestTrip.title}</h2>
              <p>
                <PinIcon /> {nearestTrip.region}
                <span />
                <CalendarIcon /> {formatDate(nearestTrip.startDate)} —{' '}
                {formatDate(nearestTrip.endDate)}
              </p>
              <span className="text-link">
                계획 이어가기 <ArrowIcon />
              </span>
            </div>
            <div className="next-trip-art" aria-hidden="true">
              <span className="art-sun" />
              <span className="art-island" />
              <span className="art-route">
                <i />
                <i />
                <i />
              </span>
            </div>
          </button>
        )}

        <div className="list-heading">
          <h2>모든 여행</h2>
          <span>{trips.length}개의 여행</span>
        </div>
        {trips.length === 0 ? (
          <div className="empty-state">
            <span>
              <MapIcon />
            </span>
            <h3>아직 만든 여행이 없어요</h3>
            <p>첫 여행을 만들고 가고 싶은 장소를 하나씩 담아보세요.</p>
            <button
              className="button button-secondary"
              onClick={() => setShowCreate(true)}
            >
              <PlusIcon /> 여행 만들기
            </button>
          </div>
        ) : (
          <div className="trip-grid">
            {trips.map((trip, index) => (
              <TripCard
                key={trip.id}
                trip={trip}
                index={index}
                onClick={() => onOpenTrip(trip)}
              />
            ))}
            <button
              className="trip-card trip-card-new"
              onClick={() => setShowCreate(true)}
            >
              <span>
                <PlusIcon />
              </span>
              <b>새 여행</b>
              <small>다음 목적지를 담아보세요</small>
            </button>
          </div>
        )}
      </section>
      {showCreate && (
        <CreateTripModal
          onClose={() => setShowCreate(false)}
          onSubmit={async (input) => {
            const success = await onTripCreated(input);
            if (success) setShowCreate(false);
          }}
        />
      )}
    </main>
  );
}

function AppHeader({
  user,
  isDemo,
  onLogout,
}: {
  user: User | null;
  isDemo: boolean;
  onLogout: () => void;
}) {
  return (
    <header className="app-header">
      <div className="page-shell app-header-inner">
        <Logo compact />
        <div className="app-header-actions">
          {isDemo && <span className="demo-badge">미리보기</span>}
          <span className="user-chip">
            <b>{user?.nickname.slice(0, 1) ?? '여'}</b>
            {user?.nickname ?? '여행자'}
          </span>
          <button
            className="icon-button"
            onClick={onLogout}
            aria-label="로그아웃"
          >
            <LogOutIcon />
          </button>
        </div>
      </div>
    </header>
  );
}

function TripCard({
  trip,
  index,
  onClick,
}: {
  trip: Trip;
  index: number;
  onClick: () => void;
}) {
  const palettes = ['orange', 'blue', 'rose', 'green'];
  return (
    <button className="trip-card" onClick={onClick}>
      <span className={`trip-thumbnail ${palettes[index % palettes.length]}`}>
        <span className="thumbnail-sun" />
        <span className="thumbnail-land" />
        <small>{trip.region}</small>
      </span>
      <span className="trip-card-body">
        <small>
          {tripDays(trip) - 1}박 {tripDays(trip)}일
        </small>
        <b>{trip.title}</b>
        <span>{formatDate(trip.startDate)}부터</span>
      </span>
      <ArrowIcon className="trip-card-arrow" />
    </button>
  );
}

function CreateTripModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (input: NewTripInput) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [region, setRegion] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [destinationType, setDestinationType] =
    useState<DestinationType>('DOMESTIC');
  const [dateError, setDateError] = useState<string | null>(null);
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-trip-title"
      >
        <button
          className="icon-button modal-close"
          aria-label="새 여행 창 닫기"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
        <span className="modal-icon">
          <CalendarIcon />
        </span>
        <span className="eyebrow">새로운 여정</span>
        <h2 id="new-trip-title">어디로 떠나나요?</h2>
        <p>대략적인 일정만 정해도 괜찮아요. 나중에 언제든 바꿀 수 있어요.</p>
        <form
          className="form-stack"
          onSubmit={async (event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const submittedStart = String(form.get('startDate') ?? '');
            const submittedEnd = String(form.get('endDate') ?? '');
            const validDate = (value: string) => {
              const date = new Date(`${value}T00:00:00Z`);
              return (
                /^\d{4}-\d{2}-\d{2}$/.test(value) &&
                Number.isFinite(date.getTime()) &&
                date.toISOString().slice(0, 10) === value
              );
            };
            if (
              !validDate(submittedStart) ||
              !validDate(submittedEnd) ||
              submittedEnd < submittedStart
            ) {
              setDateError('출발일과 돌아오는 날을 올바르게 선택해 주세요.');
              return;
            }
            setDateError(null);
            setBusy(true);
            await onSubmit({
              title,
              region,
              startDate: submittedStart,
              endDate: submittedEnd,
              destinationType,
              mapPreference: 'AUTO',
            });
            setBusy(false);
          }}
        >
          {dateError && <p role="alert">{dateError}</p>}
          <Field label="여행 이름">
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              maxLength={100}
              placeholder="예: 느리게 걷는 제주"
              required
            />
          </Field>
          <Field label="여행 구분">
            <select
              value={destinationType}
              onChange={(event) =>
                setDestinationType(event.target.value as DestinationType)
              }
            >
              <option value="DOMESTIC">국내 여행 · 카카오맵 기본</option>
              <option value="INTERNATIONAL">
                해외 여행 · Google Maps 기본
              </option>
            </select>
          </Field>
          <Field label="여행 지역">
            <input
              value={region}
              onChange={(event) => setRegion(event.target.value)}
              maxLength={100}
              placeholder="예: 제주도"
              required
            />
          </Field>
          <div className="field-row">
            <Field label="출발일">
              <input
                type="date"
                name="startDate"
                value={startDate}
                onInput={(event) => setStartDate(event.currentTarget.value)}
                onChange={(event) => setStartDate(event.target.value)}
                required
              />
            </Field>
            <Field label="돌아오는 날">
              <input
                type="date"
                name="endDate"
                value={endDate}
                onInput={(event) => setEndDate(event.currentTarget.value)}
                min={startDate}
                onChange={(event) => setEndDate(event.target.value)}
                required
              />
            </Field>
          </div>
          <button className="button button-primary button-full" disabled={busy}>
            {busy ? '만드는 중…' : '여행 만들기'} <ArrowIcon />
          </button>
        </form>
      </section>
    </div>
  );
}

function TripWorkspace({
  trip,
  user,
  isDemo,
  onBack,
  onLogout,
  onTripChanged,
}: {
  trip: TripDetail;
  user: User | null;
  isDemo: boolean;
  onBack: () => void;
  onLogout: () => void;
  onTripChanged: (trip: TripDetail) => void;
}) {
  const [tab, setTab] = useState<'places' | 'route'>('places');
  const [showPlaceForm, setShowPlaceForm] = useState(false);
  const [recommendation, setRecommendation] =
    useState<RouteRecommendation | null>(
      isDemo && trip.id === 1 ? demoRecommendation : null
    );
  const [transport, setTransport] = useState<TransportType>('CAR');
  const [optimization, setOptimization] = useState<OptimizationType>('TIME');
  const [isBusy, setIsBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [savingMap, setSavingMap] = useState(false);
  const provider = resolveMapProvider(trip);
  const changeMap = async (
    input: Pick<CreateTripInput, 'destinationType' | 'mapPreference'>
  ) => {
    setSavingMap(true);
    try {
      const updated = isDemo
        ? { ...trip, ...input }
        : await api.updateTrip(trip.id, input);
      onTripChanged({ ...trip, ...updated });
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setSavingMap(false);
    }
  };

  const recommend = async () => {
    setIsBusy(true);
    setNotice(null);
    try {
      const result = isDemo
        ? demoRecommendation
        : await api.recommendRoute(trip.id, {
            startTime: new Date().toISOString(),
            transportType: transport,
            optimizationType: optimization,
          });
      setRecommendation(result);
      setTab('route');
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  const save = async () => {
    if (!recommendation || isDemo) {
      setNotice(
        isDemo
          ? '미리보기에서는 서버에 저장되지 않아요.'
          : '먼저 동선을 추천받아 주세요.'
      );
      return;
    }
    setIsBusy(true);
    setNotice(null);
    try {
      await api.saveRoute(trip.id, {
        name: `${trip.title} 추천 동선`,
        optimizationType: optimization,
        totalDistanceMeters: recommendation.totalDistanceMeters,
        totalMoveTimeMinutes: recommendation.totalMoveTimeMinutes,
        places: recommendation.recommendedPlaces,
      });
      setNotice('추천 동선을 여행에 저장했습니다.');
    } catch (error) {
      setNotice(errorMessage(error));
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <main className="app-background workspace-background">
      <AppHeader user={user} isDemo={isDemo} onLogout={onLogout} />
      <section className="workspace page-shell">
        <button className="back-link" onClick={onBack}>
          <BackIcon /> 모든 여행
        </button>
        {notice && <Notice text={notice} onClose={() => setNotice(null)} />}
        <div className="workspace-title">
          <div>
            <span className="eyebrow">
              {trip.region} · {tripDays(trip) - 1}박 {tripDays(trip)}일
            </span>
            <h1>{trip.title}</h1>
            <p>
              <CalendarIcon /> {formatDate(trip.startDate)} —{' '}
              {formatDate(trip.endDate)}
            </p>
          </div>
          <button
            className="button button-secondary"
            onClick={() => setShowPlaceForm(true)}
          >
            <PlusIcon /> 장소 추가
          </button>
        </div>
        <div className="map-preferences">
          <Field label="여행 구분">
            <select
              aria-label="여행 구분"
              value={trip.destinationType ?? 'DOMESTIC'}
              disabled={savingMap}
              onChange={(event) =>
                void changeMap({
                  destinationType: event.target.value as DestinationType,
                })
              }
            >
              <option value="DOMESTIC">국내 여행</option>
              <option value="INTERNATIONAL">해외 여행</option>
            </select>
          </Field>
          <Field label="사용할 지도">
            <select
              aria-label="사용할 지도"
              value={trip.mapPreference ?? 'AUTO'}
              disabled={savingMap}
              onChange={(event) =>
                void changeMap({
                  mapPreference: event.target.value as MapPreference,
                })
              }
            >
              <option value="AUTO">자동 선택</option>
              <option value="KAKAO">카카오맵</option>
              <option value="GOOGLE">Google Maps</option>
            </select>
          </Field>
          <p role="status">
            {savingMap
              ? '선택을 저장하는 중…'
              : `${mapProviderLabel[provider]} 지도와 장소 검색을 사용합니다.`}
            {trip.destinationType === 'INTERNATIONAL' &&
              provider === 'KAKAO' && (
                <small>해외 지도·장소 검색은 Google Maps를 권장해요.</small>
              )}
          </p>
        </div>
        <div className="workspace-tabs">
          <button
            className={tab === 'places' ? 'active' : ''}
            onClick={() => setTab('places')}
          >
            담은 장소 <span>{trip.places.length}</span>
          </button>
          <button
            className={tab === 'route' ? 'active' : ''}
            onClick={() => setTab('route')}
          >
            추천 동선 {recommendation && <i />}
          </button>
        </div>

        {tab === 'places' ? (
          <div className="workspace-grid">
            <section className="places-panel">
              <div className="places-map">
                <TravelMap
                  provider={provider}
                  destination={trip.destinationType ?? 'DOMESTIC'}
                  points={trip.places}
                />
              </div>
              {trip.places.length === 0 ? (
                <div className="empty-state small">
                  <span>
                    <PinIcon />
                  </span>
                  <h3>가고 싶은 곳을 담아보세요</h3>
                  <p>동선을 추천하려면 최소 두 곳이 필요해요.</p>
                  <button
                    className="button button-secondary"
                    onClick={() => setShowPlaceForm(true)}
                  >
                    <PlusIcon /> 첫 장소 추가
                  </button>
                </div>
              ) : (
                trip.places.map((place, index) => (
                  <PlaceRow
                    key={place.id}
                    place={place}
                    index={index}
                    onDelete={async () => {
                      setIsBusy(true);
                      try {
                        if (!isDemo) await api.deletePlace(place.id);
                        onTripChanged({
                          ...trip,
                          places: trip.places.filter(
                            (item) => item.id !== place.id
                          ),
                        });
                        setRecommendation(null);
                      } catch (error) {
                        setNotice(errorMessage(error));
                      } finally {
                        setIsBusy(false);
                      }
                    }}
                  />
                ))
              )}
            </section>
            <aside className="route-control-card">
              <span className="control-icon">
                <SparkIcon />
              </span>
              <h2>
                최적의 순서를
                <br />
                찾아볼까요?
              </h2>
              <p>
                {trip.places.length < 2
                  ? `장소를 ${2 - trip.places.length}곳 더 추가하면 동선을 만들 수 있어요.`
                  : `${trip.places.length}개 장소의 거리와 우선순위를 계산합니다.`}
              </p>
              <Field label="이동 수단">
                <select
                  value={transport}
                  onChange={(event) =>
                    setTransport(event.target.value as TransportType)
                  }
                >
                  {Object.entries(transportLabel).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="여행 스타일">
                <select
                  value={optimization}
                  onChange={(event) =>
                    setOptimization(event.target.value as OptimizationType)
                  }
                >
                  {Object.entries(optimizationLabel).map(([value, label]) => (
                    <option value={value} key={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </Field>
              <button
                className="button button-primary button-full"
                onClick={recommend}
                disabled={trip.places.length < 2 || isBusy}
              >
                {isBusy ? '계산 중…' : '동선 추천받기'} <ArrowIcon />
              </button>
            </aside>
          </div>
        ) : (
          <RouteView
            trip={trip}
            recommendation={recommendation}
            optimization={optimization}
            isBusy={isBusy}
            onRecommend={recommend}
            onSave={save}
          />
        )}
      </section>
      {showPlaceForm && (
        <AddPlaceModal
          region={trip.region}
          provider={provider}
          isDemo={isDemo}
          onClose={() => setShowPlaceForm(false)}
          onSubmit={async (input) => {
            setIsBusy(true);
            setNotice(null);
            try {
              if (isDemo) {
                const place: Place = {
                  ...input,
                  id: Date.now(),
                  address: input.address ?? null,
                  priority: input.priority ?? 'MEDIUM',
                  stayTimeMinutes: input.stayTimeMinutes ?? 60,
                };
                onTripChanged({ ...trip, places: [...trip.places, place] });
              } else {
                await api.createPlace(trip.id, input);
                onTripChanged(await api.getTrip(trip.id));
              }
              setRecommendation(null);
              setShowPlaceForm(false);
            } catch (error) {
              setNotice(errorMessage(error));
            } finally {
              setIsBusy(false);
            }
          }}
        />
      )}
    </main>
  );
}

function PlaceRow({
  place,
  index,
  onDelete,
}: {
  place: Place;
  index: number;
  onDelete: () => void;
}) {
  return (
    <article className="place-row">
      <span className="place-order">{String(index + 1).padStart(2, '0')}</span>
      <span className={`place-symbol category-${place.category.toLowerCase()}`}>
        <PinIcon />
      </span>
      <div className="place-copy">
        <span>
          {categoryLabel[place.category]} ·{' '}
          {place.priority === 'HIGH'
            ? '꼭 가기'
            : place.priority === 'MEDIUM'
              ? '가고 싶어요'
              : '시간 되면'}
        </span>
        <h3>{place.name}</h3>
        {place.googlePlaceId && (
          <span className="google-attribution" translate="no">
            Google Maps
          </span>
        )}
        {place.attributions?.map((attribution, i) => (
          <span className="discovery-note" key={i}>
            {attribution.provider}
          </span>
        ))}
        <p>
          {place.address ?? '주소 미입력'} · 약 {place.stayTimeMinutes}분
        </p>
      </div>
      <button
        className="icon-button delete-button"
        onClick={onDelete}
        aria-label={`${place.name} 삭제`}
      >
        <TrashIcon />
      </button>
    </article>
  );
}

function AddPlaceModal({
  provider,
  region,
  isDemo,
  onClose,
  onSubmit,
}: {
  provider: MapProvider;
  region: string;
  isDemo: boolean;
  onClose: () => void;
  onSubmit: (input: CreatePlaceInput) => Promise<void>;
}) {
  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal modal-wide"
        role="dialog"
        aria-modal="true"
        aria-labelledby="discovery-title"
      >
        <button
          className="icon-button modal-close"
          aria-label="닫기"
          onClick={onClose}
        >
          <CloseIcon />
        </button>
        <h2 id="discovery-title">어디에 가고 싶나요?</h2>
        <PlaceDiscovery
          region={region}
          provider={provider}
          isDemo={isDemo}
          api={api}
          onSubmit={onSubmit}
        />
      </section>
    </div>
  );
}

function RouteView({
  trip,
  recommendation,
  optimization,
  isBusy,
  onRecommend,
  onSave,
}: {
  trip: TripDetail;
  recommendation: RouteRecommendation | null;
  optimization: OptimizationType;
  isBusy: boolean;
  onRecommend: () => void;
  onSave: () => void;
}) {
  if (!recommendation)
    return (
      <div className="empty-state route-empty">
        <span>
          <RouteIcon />
        </span>
        <h3>아직 추천 동선이 없어요</h3>
        <p>장소 두 곳 이상을 담고 가장 자연스러운 방문 순서를 찾아보세요.</p>
        <button
          className="button button-primary"
          onClick={onRecommend}
          disabled={trip.places.length < 2 || isBusy}
        >
          동선 추천받기 <SparkIcon />
        </button>
      </div>
    );
  return (
    <div className="route-layout">
      <section className="route-map">
        <TravelMap
          provider={resolveMapProvider(trip)}
          destination={trip.destinationType ?? 'DOMESTIC'}
          connect
          points={recommendation.recommendedPlaces.flatMap((item) => {
            const place = trip.places.find(
              (place) => place.id === item.placeId
            );
            return place ? [place] : [];
          })}
        />
      </section>
      <aside className="route-result">
        <span className="eyebrow">
          <SparkIcon /> {optimizationLabel[optimization]} 추천
        </span>
        <h2>오늘의 동선</h2>
        <p className="map-estimate-note">
          선은 방문 순서이며, 거리·시간은 직선거리 기반 추정치예요.
        </p>
        <div className="route-metrics">
          <span>
            <b>{(recommendation.totalDistanceMeters / 1000).toFixed(1)} km</b>
            <small>총 이동 거리</small>
          </span>
          <span>
            <b>{recommendation.totalMoveTimeMinutes}분</b>
            <small>예상 이동</small>
          </span>
        </div>
        <div className="timeline">
          {recommendation.recommendedPlaces.map((item, index) => (
            <div className="timeline-item" key={item.placeId}>
              <span className="timeline-dot">{item.visitOrder}</span>
              <div>
                <small>
                  {new Intl.DateTimeFormat('ko-KR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Seoul',
                  }).format(new Date(item.estimatedArrivalTime))}
                  {index > 0 && ` · ${item.moveTimeFromPreviousMinutes}분 이동`}
                </small>
                <b>{item.name}</b>
              </div>
            </div>
          ))}
        </div>
        <button
          className="button button-primary button-full"
          onClick={onSave}
          disabled={isBusy}
        >
          {isBusy ? '저장 중…' : '이 동선 저장하기'} <ArrowIcon />
        </button>
      </aside>
    </div>
  );
}

function Notice({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div className="notice" role="status">
      <span>{text}</span>
      <button onClick={onClose} aria-label="알림 닫기">
        <CloseIcon />
      </button>
    </div>
  );
}
