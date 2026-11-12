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
import DateTimePicker from './components/AppDatePicker';
import { PlaceDiscovery } from './components/PlaceDiscovery';
import { AppPressable as Pressable } from './components/AppPressable';
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from './lib/token-store';
import { Alert } from './lib/dialogs';
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { TravelMap } from './components/TravelMap';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

const palette = {
  forest: '#173E35',
  forestSoft: '#28584C',
  ink: '#17302A',
  cream: '#F5F1E8',
  paper: '#FFFDF9',
  orange: '#ED734B',
  orangeSoft: '#FBE3D9',
  lime: '#D7EA8A',
  muted: '#718078',
  line: '#DFDED7',
  white: '#FFFFFF',
  danger: '#B34B31',
};

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3113';
const TOKEN_KEY = 'pathtrip-access-token';

const api = createPathTripClient({
  baseUrl: API_BASE_URL,
  getAccessToken: () => SecureStore.getItemAsync(TOKEN_KEY),
});

const categories: Array<{ value: PlaceCategory; label: string; icon: string }> =
  [
    { value: 'TOURIST_SPOT', label: '관광', icon: '◒' },
    { value: 'RESTAURANT', label: '맛집', icon: '◇' },
    { value: 'CAFE', label: '카페', icon: '○' },
    { value: 'PHOTO_SPOT', label: '사진', icon: '✦' },
    { value: 'HOTEL', label: '숙소', icon: '⌂' },
    { value: 'ETC', label: '기타', icon: '·' },
  ];

const transports: Array<{ value: TransportType; label: string }> = [
  { value: 'CAR', label: '자동차' },
  { value: 'PUBLIC_TRANSIT', label: '대중교통' },
  { value: 'BICYCLE', label: '자전거' },
  { value: 'WALK', label: '도보' },
];

const optimizations: Array<{ value: OptimizationType; label: string }> = [
  { value: 'TIME', label: '빠른 이동' },
  { value: 'DISTANCE', label: '짧은 거리' },
  { value: 'FOOD', label: '맛집 중심' },
  { value: 'CAFE', label: '카페 중심' },
  { value: 'TOUR', label: '관광 중심' },
  { value: 'PHOTO', label: '사진 중심' },
];

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
      Date.UTC(2026, 9, 24, index * 2, 30)
    ).toISOString(),
    moveTimeFromPreviousMinutes: [0, 31, 8, 43][index] ?? 0,
    distanceFromPreviousMeters: [0, 18500, 2800, 26500][index] ?? 0,
  })),
};

const apiErrorText = (error: unknown) => {
  if (error instanceof ApiError) return error.message;
  if (error instanceof TypeError)
    return '서버에 연결하지 못했어요. API 주소와 실행 상태를 확인해 주세요.';
  return '잠시 후 다시 시도해 주세요.';
};

const formatDate = (date: string) =>
  new Intl.DateTimeFormat('ko-KR', { month: 'short', day: 'numeric' }).format(
    new Date(`${date}T00:00:00+09:00`)
  );

const days = (trip: Trip) =>
  Math.max(
    1,
    Math.round(
      (new Date(`${trip.endDate}T00:00:00Z`).getTime() -
        new Date(`${trip.startDate}T00:00:00Z`).getTime()) /
        86_400_000
    ) + 1
  );

const toDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const lightTap = () => {
  if (Platform.OS === 'web') return;
  void Haptics.selectionAsync().catch(() => {});
};

const successTap = () => {
  if (Platform.OS === 'web') return;
  void Haptics.notificationAsync(
    Haptics.NotificationFeedbackType.Success
  ).catch(() => {});
};

type Screen = 'auth' | 'home' | 'trip';

function AppContent({ preview = false }: { preview?: boolean }) {
  const [screen, setScreen] = useState<Screen>(preview ? 'home' : 'auth');
  const [user, setUser] = useState<User | null>(
    preview ? { id: 0, email: 'preview@pathtrip.kr', nickname: '여행자' } : null
  );
  const [trips, setTrips] = useState<Trip[]>(preview ? demoTrips : []);
  const [selectedTrip, setSelectedTrip] = useState<TripDetail | null>(null);
  const [isDemo, setIsDemo] = useState(preview);
  const [loading, setLoading] = useState(!preview);
  const [message, setMessage] = useState<string | null>(null);

  const loadTrips = useCallback(async () => {
    const result = await api.listTrips();
    setTrips(result.items);
  }, []);

  useEffect(() => {
    if (preview) return;
    const restore = async () => {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const [profile, tripResult] = await Promise.all([
          api.me(),
          api.listTrips(),
        ]);
        setUser(profile);
        setTrips(tripResult.items);
        setScreen('home');
      } catch {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } finally {
        setLoading(false);
      }
    };
    void restore();
  }, [preview]);

  const showDemo = () => {
    successTap();
    setIsDemo(true);
    setUser({ id: 0, email: 'preview@pathtrip.kr', nickname: '여행자' });
    setTrips(demoTrips);
    setScreen('home');
    setMessage('미리보기 모드 · 데이터는 저장되지 않아요');
  };

  const openTrip = async (trip: Trip) => {
    lightTap();
    setLoading(true);
    try {
      const detail: TripDetail = isDemo
        ? { ...trip, places: trip.id === 1 ? demoPlaces : [] }
        : await api.getTrip(trip.id);
      setSelectedTrip(detail);
      setScreen('trip');
    } catch (error) {
      Alert.alert('여행을 열지 못했어요', apiErrorText(error));
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    setUser(null);
    setTrips([]);
    setSelectedTrip(null);
    setIsDemo(false);
    setMessage(null);
    setScreen('auth');
  };

  if (loading && !user) {
    return <LoadingScreen />;
  }

  if (screen === 'auth') {
    return (
      <AuthScreen
        onDemo={showDemo}
        onAuthenticated={async (nextUser, token) => {
          await SecureStore.setItemAsync(TOKEN_KEY, token);
          setUser(nextUser);
          setLoading(true);
          try {
            await loadTrips();
            setScreen('home');
          } catch (error) {
            setMessage(apiErrorText(error));
            setScreen('home');
          } finally {
            setLoading(false);
          }
        }}
      />
    );
  }

  if (screen === 'trip' && selectedTrip) {
    return (
      <TripScreen
        trip={selectedTrip}
        isDemo={isDemo}
        onBack={() => setScreen('home')}
        onChange={(nextTrip) => {
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
    <HomeScreen
      user={user}
      trips={trips}
      isDemo={isDemo}
      loading={loading}
      message={message}
      onDismissMessage={() => setMessage(null)}
      onOpenTrip={openTrip}
      onLogout={logout}
      onCreate={async (input) => {
        setLoading(true);
        try {
          if (isDemo) {
            setTrips((current) => [{ id: Date.now(), ...input }, ...current]);
          } else {
            await api.createTrip(input);
            await loadTrips();
          }
          successTap();
          return true;
        } catch (error) {
          Alert.alert('여행을 만들지 못했어요', apiErrorText(error));
          return false;
        } finally {
          setLoading(false);
        }
      }}
    />
  );
}

export default function App({ preview = false }: { preview?: boolean }) {
  return (
    <SafeAreaProvider>
      <AppContent preview={preview} />
    </SafeAreaProvider>
  );
}

function LoadingScreen() {
  return (
    <SafeAreaView style={styles.loadingScreen}>
      <StatusBar barStyle="dark-content" />
      <Brand />
      <ActivityIndicator
        color={palette.orange}
        style={styles.loadingIndicator}
      />
    </SafeAreaView>
  );
}

function Brand({ light = false }: { light?: boolean }) {
  return (
    <View style={styles.brandRow}>
      <View style={[styles.brandMark, light && styles.brandMarkLight]}>
        <Text
          style={[styles.brandMarkText, light && styles.brandMarkTextLight]}
        >
          ↝
        </Text>
      </View>
      <Text style={[styles.brandText, light && styles.textWhite]}>
        PathTrip
      </Text>
    </View>
  );
}

function AuthScreen({
  onAuthenticated,
  onDemo,
}: {
  onAuthenticated: (user: User, token: string) => void | Promise<void>;
  onDemo: () => void;
}) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email || !password || (mode === 'signup' && !nickname)) {
      setError('필수 항목을 모두 입력해 주세요.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (mode === 'signup') await api.signup({ email, password, nickname });
      const result = await api.login({ email, password });
      await onAuthenticated(result.user, result.accessToken);
    } catch (caught) {
      setError(apiErrorText(caught));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.authScreen}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.authScroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.authHero}>
            <Brand light />
            <View style={styles.authSun} />
            <View style={styles.authPath}>
              <View style={styles.authPathDot} />
              <View style={[styles.authPathDot, styles.authPathDotTwo]} />
              <View style={[styles.authPathDot, styles.authPathDotThree]} />
            </View>
            <View style={styles.authHeadlineWrap}>
              <Text style={styles.kickerLight}>PLAN LESS · TRAVEL MORE</Text>
              <Text style={styles.authHeadline}>
                헤매지 말고,{`\n`}여행하세요.
              </Text>
              <Text style={styles.authSubtitle}>
                가고 싶은 곳을 담으면 가장 자연스러운 하루를 만들어 드려요.
              </Text>
            </View>
          </View>

          <View style={styles.authFormCard}>
            <View style={styles.segmented}>
              <Pressable
                style={[
                  styles.segment,
                  mode === 'login' && styles.segmentActive,
                ]}
                onPress={() => {
                  setMode('login');
                  setError(null);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === 'login' }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    mode === 'login' && styles.segmentTextActive,
                  ]}
                >
                  로그인
                </Text>
              </Pressable>
              <Pressable
                style={[
                  styles.segment,
                  mode === 'signup' && styles.segmentActive,
                ]}
                onPress={() => {
                  setMode('signup');
                  setError(null);
                }}
                accessibilityRole="tab"
                accessibilityState={{ selected: mode === 'signup' }}
              >
                <Text
                  style={[
                    styles.segmentText,
                    mode === 'signup' && styles.segmentTextActive,
                  ]}
                >
                  회원가입
                </Text>
              </Pressable>
            </View>
            {mode === 'signup' && (
              <Input
                label="닉네임"
                value={nickname}
                onChangeText={setNickname}
                placeholder="여행에서 불릴 이름"
              />
            )}
            <Input
              label="이메일"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              textContentType="username"
            />
            <Input
              label="비밀번호"
              value={password}
              onChangeText={setPassword}
              placeholder={
                mode === 'signup' ? '8자 이상 입력' : '비밀번호 입력'
              }
              secureTextEntry
              textContentType={mode === 'signup' ? 'newPassword' : 'password'}
              returnKeyType="go"
              onSubmitEditing={() => {
                if (!busy) void submit();
              }}
            />
            {error && <Text style={styles.errorText}>{error}</Text>}
            <PrimaryButton
              label={
                busy
                  ? '연결 중…'
                  : mode === 'login'
                    ? '로그인하기'
                    : '가입하고 시작하기'
              }
              onPress={submit}
              disabled={busy}
            />
            <Pressable
              onPress={onDemo}
              style={styles.demoLink}
              accessibilityRole="button"
            >
              <Text style={styles.demoLinkText}>먼저 미리 둘러보기 →</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function HomeScreen({
  user,
  trips,
  isDemo,
  loading,
  message,
  onDismissMessage,
  onOpenTrip,
  onLogout,
  onCreate,
}: {
  user: User | null;
  trips: Trip[];
  isDemo: boolean;
  loading: boolean;
  message: string | null;
  onDismissMessage: () => void;
  onOpenTrip: (trip: Trip) => void;
  onLogout: () => void;
  onCreate: (input: CreateTripInput) => Promise<boolean>;
}) {
  const [showCreate, setShowCreate] = useState(false);
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <Header user={user} isDemo={isDemo} onLogout={onLogout} />
      <ScrollView
        contentContainerStyle={styles.homeContent}
        showsVerticalScrollIndicator={false}
      >
        {message && <Notice text={message} onClose={onDismissMessage} />}
        <Text style={styles.kicker}>MY TRAVEL DRAWER</Text>
        <Text style={styles.pageTitle}>
          {user?.nickname ?? '여행자'}님,{`\n`}어디로 떠나볼까요?
        </Text>
        <Pressable
          style={styles.createPill}
          onPress={() => setShowCreate(true)}
          accessibilityRole="button"
        >
          <Text style={styles.createPillPlus}>＋</Text>
          <Text style={styles.createPillText}>새 여행 만들기</Text>
        </Pressable>

        {trips[0] && (
          <HeroTrip trip={trips[0]} onPress={() => onOpenTrip(trips[0]!)} />
        )}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>모든 여행</Text>
          <Text style={styles.sectionCount}>{trips.length}개</Text>
        </View>
        {trips.length === 0 ? (
          <EmptyState
            icon="⌁"
            title="첫 여행을 만들어 보세요"
            text="날짜와 지역을 정하고 가고 싶은 장소를 담아보세요."
            action="여행 만들기"
            onPress={() => setShowCreate(true)}
          />
        ) : (
          trips.map((trip, index) => (
            <TripListCard
              key={trip.id}
              trip={trip}
              index={index}
              onPress={() => onOpenTrip(trip)}
            />
          ))
        )}
        <View style={styles.bottomSpace} />
      </ScrollView>
      {loading && (
        <View style={styles.busyOverlay}>
          <ActivityIndicator color={palette.orange} />
        </View>
      )}
      <CreateTripModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onSubmit={async (input) => {
          const success = await onCreate(input);
          if (success) setShowCreate(false);
        }}
      />
    </SafeAreaView>
  );
}

function Header({
  user,
  isDemo,
  onLogout,
}: {
  user: User | null;
  isDemo: boolean;
  onLogout: () => void;
}) {
  return (
    <View style={styles.header}>
      <Brand />
      <View style={styles.headerRight}>
        {isDemo && <Text style={styles.previewBadge}>미리보기</Text>}
        {!isDemo && user?.role === 'ADMIN' && (
          <Text style={styles.previewBadge}>관리자</Text>
        )}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.nickname.slice(0, 1) ?? '여'}
          </Text>
        </View>
        <Pressable
          onPress={onLogout}
          style={styles.smallButton}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="로그아웃"
        >
          <Text style={styles.logoutText}>나가기</Text>
        </Pressable>
      </View>
    </View>
  );
}

function HeroTrip({ trip, onPress }: { trip: Trip; onPress: () => void }) {
  const dDay = Math.max(
    0,
    Math.ceil(
      (new Date(`${trip.startDate}T00:00:00+09:00`).getTime() - Date.now()) /
        86_400_000
    )
  );
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${trip.title} 여행 계획 열기`}
    >
      <LinearGradient
        colors={[palette.forest, '#24594C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroTrip}
      >
        <View style={styles.heroTripSun} />
        <View style={styles.heroTripLand} />
        <View style={styles.heroTripPath} />
        <Text style={styles.heroTripStatus}>● 다음 여행 · D-{dDay}</Text>
        <Text style={styles.heroTripTitle}>{trip.title}</Text>
        <Text style={styles.heroTripMeta}>
          ⌖ {trip.region} · {formatDate(trip.startDate)} —{' '}
          {formatDate(trip.endDate)}
        </Text>
        <Text style={styles.heroTripLink}>계획 이어가기 →</Text>
      </LinearGradient>
    </Pressable>
  );
}

function TripListCard({
  trip,
  index,
  onPress,
}: {
  trip: Trip;
  index: number;
  onPress: () => void;
}) {
  const colors = ['#E9C5A5', '#BAD7DC', '#EBC2B6', '#B8CDBC'];
  return (
    <Pressable
      style={styles.tripListCard}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${trip.title}, ${trip.region} 여행 열기`}
    >
      <View
        style={[
          styles.tripThumb,
          { backgroundColor: colors[index % colors.length] },
        ]}
      >
        <View style={styles.tripThumbSun} />
        <Text style={styles.tripThumbRegion}>{trip.region}</Text>
      </View>
      <View style={styles.tripListCopy}>
        <Text style={styles.tripNights}>
          {days(trip) - 1}박 {days(trip)}일
        </Text>
        <Text style={styles.tripListTitle}>{trip.title}</Text>
        <Text style={styles.tripListDate}>
          {formatDate(trip.startDate)}부터
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

function TripScreen({
  trip,
  isDemo,
  onBack,
  onChange,
}: {
  trip: TripDetail;
  isDemo: boolean;
  onBack: () => void;
  onChange: (trip: TripDetail) => void;
}) {
  const [tab, setTab] = useState<'places' | 'route'>('places');
  const [showPlace, setShowPlace] = useState(false);
  const [recommendation, setRecommendation] =
    useState<RouteRecommendation | null>(
      isDemo && trip.id === 1 ? demoRecommendation : null
    );
  const [transport, setTransport] = useState<TransportType>('CAR');
  const [optimization, setOptimization] = useState<OptimizationType>('TIME');
  const [busy, setBusy] = useState(false);
  const [showMaps, setShowMaps] = useState(false);
  const provider = resolveMapProvider(trip);

  const recommendationLabel =
    optimizations.find((item) => item.value === optimization)?.label ?? '추천';

  const recommend = async () => {
    if (trip.places.length < 2) {
      Alert.alert(
        '장소가 더 필요해요',
        '동선 추천을 위해 최소 두 곳을 담아주세요.'
      );
      return;
    }
    setBusy(true);
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
      successTap();
    } catch (error) {
      Alert.alert('동선을 만들지 못했어요', apiErrorText(error));
    } finally {
      setBusy(false);
    }
  };

  const saveRoute = async () => {
    if (!recommendation) return;
    if (isDemo) {
      Alert.alert(
        '미리보기 모드',
        '실제 계정으로 로그인하면 동선을 저장할 수 있어요.'
      );
      return;
    }
    setBusy(true);
    try {
      await api.saveRoute(trip.id, {
        name: `${trip.title} 추천 동선`,
        optimizationType: optimization,
        totalDistanceMeters: recommendation.totalDistanceMeters,
        totalMoveTimeMinutes: recommendation.totalMoveTimeMinutes,
        places: recommendation.recommendedPlaces,
      });
      successTap();
      Alert.alert('저장했어요', '추천 동선을 여행에 저장했습니다.');
    } catch (error) {
      Alert.alert('저장하지 못했어요', apiErrorText(error));
    } finally {
      setBusy(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.tripHeader}>
        <Pressable
          style={styles.circleButton}
          onPress={onBack}
          accessibilityRole="button"
          accessibilityLabel="여행 목록으로 돌아가기"
        >
          <Ionicons name="chevron-back" size={22} color={palette.forest} />
        </Pressable>
        <View style={styles.tripHeaderCopy}>
          <Text style={styles.tripHeaderRegion}>
            {trip.region} · {days(trip) - 1}박 {days(trip)}일
          </Text>
          <Text style={styles.tripHeaderTitle}>{trip.title}</Text>
        </View>
        <Pressable
          style={styles.circleButton}
          onPress={() => setShowPlace(true)}
          accessibilityRole="button"
          accessibilityLabel="장소 추가"
        >
          <Ionicons name="add" size={24} color={palette.forest} />
        </Pressable>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="사용할 지도 선택"
        style={styles.mapSettingsButton}
        onPress={() => setShowMaps(true)}
      >
        <Ionicons name="map-outline" size={17} color={palette.forest} />
        <Text style={styles.mapSettingsText}>
          {mapProviderLabel[provider]} ·{' '}
          {(trip.mapPreference ?? 'AUTO') === 'AUTO'
            ? '자동 선택'
            : '직접 선택'}
        </Text>
        <Ionicons name="chevron-down" size={15} color={palette.muted} />
      </Pressable>
      <View style={styles.tabs}>
        <Pressable
          style={[styles.tab, tab === 'places' && styles.tabActive]}
          onPress={() => setTab('places')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'places' }}
        >
          <Text
            style={[styles.tabText, tab === 'places' && styles.tabTextActive]}
          >
            담은 장소 {trip.places.length}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, tab === 'route' && styles.tabActive]}
          onPress={() => setTab('route')}
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'route' }}
        >
          <Text
            style={[styles.tabText, tab === 'route' && styles.tabTextActive]}
          >
            추천 동선{recommendation ? '  ●' : ''}
          </Text>
        </Pressable>
      </View>

      {tab === 'places' ? (
        <ScrollView
          contentContainerStyle={styles.tripContent}
          showsVerticalScrollIndicator={false}
        >
          <TravelMap
            provider={provider}
            destination={trip.destinationType ?? 'DOMESTIC'}
            points={trip.places}
          />
          {trip.places.length === 0 ? (
            <EmptyState
              icon="⌖"
              title="가고 싶은 곳을 담아보세요"
              text="동선을 추천하려면 최소 두 곳이 필요해요."
              action="첫 장소 추가"
              onPress={() => setShowPlace(true)}
            />
          ) : (
            trip.places.map((place, index) => (
              <PlaceCard
                key={place.id}
                place={place}
                index={index}
                onDelete={async () => {
                  setBusy(true);
                  try {
                    if (!isDemo) await api.deletePlace(place.id);
                    onChange({
                      ...trip,
                      places: trip.places.filter(
                        (item) => item.id !== place.id
                      ),
                    });
                    setRecommendation(null);
                  } catch (error) {
                    Alert.alert('삭제하지 못했어요', apiErrorText(error));
                  } finally {
                    setBusy(false);
                  }
                }}
              />
            ))
          )}
          <View style={styles.routeBuilder}>
            <Text style={styles.routeBuilderSpark}>✦</Text>
            <Text style={styles.routeBuilderTitle}>
              최적의 순서를 찾아볼까요?
            </Text>
            <Text style={styles.routeBuilderDescription}>
              {trip.places.length < 2
                ? `장소를 ${2 - trip.places.length}곳 더 추가해 주세요.`
                : `${trip.places.length}개 장소의 거리와 우선순위를 계산해요.`}
            </Text>
            <Text style={styles.inputLabel}>이동 수단</Text>
            <View style={styles.chipRow}>
              {transports.map((item) => (
                <ChoiceChip
                  key={item.value}
                  label={item.label}
                  active={transport === item.value}
                  onPress={() => setTransport(item.value)}
                />
              ))}
            </View>
            <Text style={styles.inputLabel}>여행 스타일</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipRow}
            >
              {optimizations.map((item) => (
                <ChoiceChip
                  key={item.value}
                  label={item.label}
                  active={optimization === item.value}
                  onPress={() => setOptimization(item.value)}
                />
              ))}
            </ScrollView>
            <PrimaryButton
              label={busy ? '계산 중…' : '동선 추천받기'}
              onPress={recommend}
              disabled={busy || trip.places.length < 2}
            />
          </View>
          <View style={styles.bottomSpace} />
        </ScrollView>
      ) : (
        <RouteResult
          provider={provider}
          destination={trip.destinationType ?? 'DOMESTIC'}
          places={trip.places}
          recommendation={recommendation}
          recommendationLabel={recommendationLabel}
          canRecommend={trip.places.length >= 2}
          busy={busy}
          onRecommend={recommend}
          onSave={saveRoute}
        />
      )}
      {busy && (
        <View style={styles.busyOverlay}>
          <ActivityIndicator color={palette.orange} />
        </View>
      )}
      <AddPlaceModal
        region={trip.region}
        provider={provider}
        isDemo={isDemo}
        visible={showPlace}
        onClose={() => setShowPlace(false)}
        onSubmit={async (input) => {
          setBusy(true);
          try {
            if (isDemo) {
              const place: Place = {
                ...input,
                id: Date.now(),
                address: input.address ?? null,
                priority: input.priority ?? 'MEDIUM',
                stayTimeMinutes: input.stayTimeMinutes ?? 60,
              };
              onChange({ ...trip, places: [...trip.places, place] });
            } else {
              await api.createPlace(trip.id, input);
              onChange(await api.getTrip(trip.id));
            }
            successTap();
            setRecommendation(null);
            setShowPlace(false);
          } catch (error) {
            Alert.alert('장소를 담지 못했어요', apiErrorText(error));
          } finally {
            setBusy(false);
          }
        }}
      />
      <MapSettings
        visible={showMaps}
        trip={trip}
        onClose={() => setShowMaps(false)}
        onSave={async (input) => {
          const updated = isDemo
            ? { ...trip, ...input }
            : await api.updateTrip(trip.id, input);
          onChange({ ...trip, ...updated });
          successTap();
          setShowMaps(false);
        }}
      />
    </SafeAreaView>
  );
}

function PlaceCard({
  place,
  index,
  onDelete,
}: {
  place: Place;
  index: number;
  onDelete: () => void;
}) {
  const category = categories.find((item) => item.value === place.category);
  return (
    <View style={styles.placeCard}>
      <Text style={styles.placeIndex}>
        {String(index + 1).padStart(2, '0')}
      </Text>
      <View style={styles.placeIcon}>
        <Text style={styles.placeIconText}>{category?.icon ?? '·'}</Text>
      </View>
      <View style={styles.placeCopy}>
        <Text style={styles.placeCategory}>
          {category?.label ?? '장소'} ·{' '}
          {place.priority === 'HIGH' ? '꼭 가기' : '가고 싶어요'}
        </Text>
        <Text style={styles.placeName}>{place.name}</Text>
        {place.googlePlaceId && (
          <Text style={{ color: '#5E5E5E', fontSize: 12, fontWeight: '400' }}>
            Google Maps
          </Text>
        )}
        {place.attributions?.map((attribution, i) => (
          <Text key={i} style={styles.placeAddress}>
            {attribution.provider}
          </Text>
        ))}
        <Text numberOfLines={1} style={styles.placeAddress}>
          {place.address ?? '주소 미입력'} · {place.stayTimeMinutes}분
        </Text>
      </View>
      <Pressable
        onPress={() =>
          Alert.alert('장소 삭제', `${place.name}을(를) 삭제할까요?`, [
            { text: '취소', style: 'cancel' },
            { text: '삭제', style: 'destructive', onPress: onDelete },
          ])
        }
        hitSlop={8}
        style={styles.smallButton}
        accessibilityRole="button"
        accessibilityLabel={`${place.name} 삭제`}
      >
        <Ionicons name="close" size={20} color="#9AA39E" />
      </Pressable>
    </View>
  );
}

function RouteResult({
  provider,
  destination,
  places,
  recommendation,
  recommendationLabel,
  canRecommend,
  busy,
  onRecommend,
  onSave,
}: {
  provider: MapProvider;
  destination: DestinationType;
  places: Place[];
  recommendation: RouteRecommendation | null;
  recommendationLabel: string;
  canRecommend: boolean;
  busy: boolean;
  onRecommend: () => void;
  onSave: () => void;
}) {
  const routeCoordinates = useMemo(() => {
    if (!recommendation) return [];
    return recommendation.recommendedPlaces.flatMap((recommendedPlace) => {
      const place = places.find((item) => item.id === recommendedPlace.placeId);
      return place ? [place] : [];
    });
  }, [places, recommendation]);

  if (!recommendation) {
    return (
      <ScrollView contentContainerStyle={styles.routeEmptyWrap}>
        <EmptyState
          icon="↝"
          title="아직 추천 동선이 없어요"
          text="담은 장소를 가장 자연스러운 순서로 정리해 드릴게요."
          action="동선 추천받기"
          onPress={onRecommend}
          disabled={!canRecommend || busy}
        />
      </ScrollView>
    );
  }
  return (
    <ScrollView
      contentContainerStyle={styles.routeResultContent}
      showsVerticalScrollIndicator={false}
    >
      <TravelMap
        provider={provider}
        destination={destination}
        points={routeCoordinates}
        connect
      />
      <Text style={styles.mapHelpText}>
        선은 방문 순서이며, 거리·시간은 직선거리 기반 추정치예요.
      </Text>
      <Text style={styles.kicker}>✦ {recommendationLabel} 추천</Text>
      <Text style={styles.routeTitle}>오늘의 동선</Text>
      <View style={styles.metrics}>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>
            {(recommendation.totalDistanceMeters / 1000).toFixed(1)} km
          </Text>
          <Text style={styles.metricLabel}>총 이동 거리</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricValue}>
            {recommendation.totalMoveTimeMinutes}분
          </Text>
          <Text style={styles.metricLabel}>예상 이동</Text>
        </View>
      </View>
      <View style={styles.timeline}>
        {recommendation.recommendedPlaces.map((place, index) => (
          <View key={place.placeId} style={styles.timelineRow}>
            <View style={styles.timelineRail}>
              <View style={styles.timelineDot}>
                <Text style={styles.timelineDotText}>{place.visitOrder}</Text>
              </View>
              {index < recommendation.recommendedPlaces.length - 1 && (
                <View style={styles.timelineLine} />
              )}
            </View>
            <View style={styles.timelineCopy}>
              <Text style={styles.timelineTime}>
                {new Intl.DateTimeFormat('ko-KR', {
                  hour: '2-digit',
                  minute: '2-digit',
                  timeZone: 'Asia/Seoul',
                }).format(new Date(place.estimatedArrivalTime))}
                {index > 0
                  ? ` · ${place.moveTimeFromPreviousMinutes}분 이동`
                  : ''}
              </Text>
              <Text style={styles.timelineName}>{place.name}</Text>
            </View>
          </View>
        ))}
      </View>
      <PrimaryButton
        label={busy ? '저장 중…' : '이 동선 저장하기'}
        onPress={onSave}
        disabled={busy}
      />
      <View style={styles.bottomSpace} />
    </ScrollView>
  );
}

function CreateTripModal({
  visible,
  onClose,
  onSubmit,
}: {
  visible: boolean;
  onClose: () => void;
  onSubmit: (input: CreateTripInput) => Promise<void>;
}) {
  const initialStart = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date;
  }, []);
  const initialEnd = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 3);
    return date;
  }, []);
  const [title, setTitle] = useState('');
  const [region, setRegion] = useState('');
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [destinationType, setDestinationType] =
    useState<DestinationType>('DOMESTIC');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (visible) return;
    const nextStart = new Date();
    nextStart.setDate(nextStart.getDate() + 1);
    const nextEnd = new Date();
    nextEnd.setDate(nextEnd.getDate() + 3);
    setTitle('');
    setRegion('');
    setStartDate(nextStart);
    setEndDate(nextEnd);
    setDestinationType('DOMESTIC');
    setBusy(false);
  }, [visible]);

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="어디로 떠나나요?"
      subtitle="여행 지역에 맞는 지도를 기본으로 준비해 드려요."
    >
      <Text style={styles.inputLabel}>여행 구분</Text>
      <View style={styles.chipRow}>
        <ChoiceChip
          label="국내 · 카카오맵"
          active={destinationType === 'DOMESTIC'}
          onPress={() => setDestinationType('DOMESTIC')}
        />
        <ChoiceChip
          label="해외 · Google Maps"
          active={destinationType === 'INTERNATIONAL'}
          onPress={() => setDestinationType('INTERNATIONAL')}
        />
      </View>
      <Input
        label="여행 이름"
        value={title}
        onChangeText={setTitle}
        placeholder="예: 느리게 걷는 제주"
        returnKeyType="next"
      />
      <Input
        label="여행 지역"
        value={region}
        onChangeText={setRegion}
        placeholder="예: 제주도"
        returnKeyType="done"
      />
      <DateField
        label="출발일"
        value={startDate}
        minimumDate={new Date()}
        onChange={(date) => {
          setStartDate(date);
          if (date > endDate) setEndDate(date);
        }}
      />
      <DateField
        label="돌아오는 날"
        value={endDate}
        minimumDate={startDate}
        onChange={setEndDate}
      />
      <PrimaryButton
        label={busy ? '만드는 중…' : '여행 만들기'}
        disabled={busy || !title.trim() || !region.trim()}
        onPress={async () => {
          setBusy(true);
          await onSubmit({
            title: title.trim(),
            region: region.trim(),
            startDate: toDateInput(startDate),
            endDate: toDateInput(endDate),
            destinationType,
            mapPreference: 'AUTO',
          });
          setBusy(false);
        }}
      />
    </Sheet>
  );
}

function DateField({
  label,
  value,
  minimumDate,
  onChange,
}: {
  label: string;
  value: Date;
  minimumDate: Date;
  onChange: (date: Date) => void;
}) {
  return (
    <View style={styles.dateField}>
      <View>
        <Text style={styles.inputLabel}>{label}</Text>
        <Text style={styles.dateValue}>
          {new Intl.DateTimeFormat('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            weekday: 'short',
          }).format(value)}
        </Text>
      </View>
      <DateTimePicker
        accessibilityLabel={label}
        value={value}
        mode="date"
        display={Platform.OS === 'ios' ? 'compact' : 'default'}
        minimumDate={minimumDate}
        accentColor={palette.orange}
        onChange={(_, date) => {
          if (date) onChange(date);
        }}
      />
    </View>
  );
}

function AddPlaceModal({
  provider,
  region,
  visible,
  isDemo,
  onClose,
  onSubmit,
}: {
  provider: MapProvider;
  region: string;
  visible: boolean;
  isDemo: boolean;
  onClose: () => void;
  onSubmit: (input: CreatePlaceInput) => Promise<void>;
}) {
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="어디에 가고 싶나요?"
      subtitle={
        isDemo
          ? `${region} · 미리보기 샘플`
          : `${region} · ${mapProviderLabel[provider]}`
      }
    >
      {visible && (
        <PlaceDiscovery
          region={region}
          provider={provider}
          isDemo={isDemo}
          api={api}
          onSubmit={onSubmit}
        />
      )}
    </Sheet>
  );
}

function MapSettings({
  visible,
  trip,
  onClose,
  onSave,
}: {
  visible: boolean;
  trip: Trip;
  onClose: () => void;
  onSave: (input: {
    destinationType: DestinationType;
    mapPreference: MapPreference;
  }) => Promise<void>;
}) {
  const [destinationType, setDestinationType] = useState<DestinationType>(
    trip.destinationType ?? 'DOMESTIC'
  );
  const [mapPreference, setMapPreference] = useState<MapPreference>(
    trip.mapPreference ?? 'AUTO'
  );
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (visible) {
      setDestinationType(trip.destinationType ?? 'DOMESTIC');
      setMapPreference(trip.mapPreference ?? 'AUTO');
    }
  }, [visible, trip.destinationType, trip.mapPreference]);
  const selected = resolveMapProvider({ destinationType, mapPreference });
  return (
    <Sheet
      visible={visible}
      onClose={() => {
        if (!busy) onClose();
      }}
      title="나에게 맞는 지도"
      subtitle="선택한 지도는 이 여행에 저장되고 장소 검색에도 적용돼요."
    >
      <Text style={styles.inputLabel}>여행 구분</Text>
      <View style={styles.chipRow}>
        <ChoiceChip
          label="국내 여행"
          active={destinationType === 'DOMESTIC'}
          onPress={() => setDestinationType('DOMESTIC')}
        />
        <ChoiceChip
          label="해외 여행"
          active={destinationType === 'INTERNATIONAL'}
          onPress={() => setDestinationType('INTERNATIONAL')}
        />
      </View>
      {(['AUTO', 'KAKAO', 'GOOGLE'] as const).map((value) => (
        <Pressable
          key={value}
          accessibilityRole="radio"
          accessibilityState={{ checked: mapPreference === value }}
          onPress={() => {
            lightTap();
            setMapPreference(value);
          }}
          style={[
            styles.mapOption,
            mapPreference === value && styles.mapOptionActive,
          ]}
        >
          <View style={styles.flex}>
            <Text style={styles.mapOptionTitle}>
              {value === 'AUTO' ? '자동 선택' : mapProviderLabel[value]}
            </Text>
            <Text style={styles.mapHelpText}>
              {value === 'AUTO'
                ? '국내는 카카오맵 · 해외는 Google Maps'
                : value === 'KAKAO'
                  ? '국내 여행 장소를 카카오에서 검색해요'
                  : '세계 여행 장소를 Google에서 검색해요'}
            </Text>
          </View>
          <Ionicons
            name={
              mapPreference === value ? 'radio-button-on' : 'radio-button-off'
            }
            size={22}
            color={palette.forest}
          />
        </Pressable>
      ))}
      <Text style={styles.mapHelpText}>
        {destinationType === 'INTERNATIONAL' && selected === 'KAKAO'
          ? '카카오맵의 해외 지역 지원은 제한적이에요. 해외 여행에는 Google Maps를 권장해요.'
          : `${mapProviderLabel[selected]}이 적용됩니다.`}
      </Text>
      <PrimaryButton
        disabled={busy}
        label={busy ? '저장 중…' : '이 지도 사용하기'}
        onPress={async () => {
          setBusy(true);
          try {
            await onSave({ destinationType, mapPreference });
          } catch (error) {
            Alert.alert('지도 설정을 저장하지 못했어요', apiErrorText(error));
          } finally {
            setBusy(false);
          }
        }}
      />
    </Sheet>
  );
}

function Sheet({
  visible,
  onClose,
  title,
  subtitle,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Pressable
          style={styles.modalDismissArea}
          hitSlop={0}
          accessible={false}
          onPress={onClose}
        />
        <SafeAreaView style={styles.sheet} edges={['bottom']}>
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <View style={styles.flex}>
              <Text style={styles.sheetTitle}>{title}</Text>
              <Text style={styles.sheetSubtitle}>{subtitle}</Text>
            </View>
            <Pressable
              style={styles.sheetClose}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="닫기"
            >
              <Ionicons name="close" size={20} color={palette.muted} />
            </Pressable>
          </View>
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.sheetContent}
          >
            {children}
          </ScrollView>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function Input(
  props: React.ComponentProps<typeof TextInput> & { label: string }
) {
  const { label, style, ...inputProps } = props;
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.inputLabel}>{label}</Text>
      <TextInput
        placeholderTextColor="#9CA6A0"
        style={[styles.input, style]}
        {...inputProps}
      />
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.primaryButton,
        disabled && styles.buttonDisabled,
        pressed && !disabled && styles.buttonPressed,
      ]}
      onPress={() => {
        lightTap();
        onPress();
      }}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
    >
      <Text style={styles.primaryButtonText}>{label}</Text>
      <Ionicons name="arrow-forward" size={18} color={palette.white} />
    </Pressable>
  );
}

function ChoiceChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.choiceChip, active && styles.choiceChipActive]}
      onPress={() => {
        lightTap();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        style={[styles.choiceChipText, active && styles.choiceChipTextActive]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function EmptyState({
  icon,
  title,
  text,
  action,
  onPress,
  disabled = false,
}: {
  icon: string;
  title: string;
  text: string;
  action: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Text style={styles.emptyIconText}>{icon}</Text>
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyText}>{text}</Text>
      <Pressable
        style={[styles.emptyButton, disabled && styles.buttonDisabled]}
        onPress={onPress}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityState={{ disabled }}
      >
        <Text style={styles.emptyButtonText}>{action}</Text>
      </Pressable>
    </View>
  );
}

function Notice({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <View style={styles.notice}>
      <Text style={styles.noticeText}>{text}</Text>
      <Pressable
        onPress={onClose}
        style={styles.smallButton}
        accessibilityRole="button"
        accessibilityLabel="안내 닫기"
      >
        <Text style={styles.noticeClose}>×</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  mapSettingsButton: {
    minHeight: 46,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: palette.paper,
  },
  mapSettingsText: {
    flex: 1,
    color: palette.forest,
    fontSize: 13,
    fontWeight: '700',
  },
  mapOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 15,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: palette.line,
    marginBottom: 10,
  },
  mapOptionActive: { backgroundColor: '#EEF5F1', borderColor: palette.forest },
  mapOptionTitle: { color: palette.ink, fontWeight: '800', fontSize: 15 },
  mapHelpText: {
    color: palette.muted,
    fontSize: 12,
    lineHeight: 19,
    marginVertical: 8,
  },
  flex: { flex: 1 },
  smallButton: {
    minWidth: 44,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screen: { flex: 1, backgroundColor: palette.cream },
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.cream,
  },
  loadingIndicator: { marginTop: 26 },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandMark: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.forest,
  },
  brandMarkLight: { backgroundColor: palette.lime },
  brandMarkText: {
    color: palette.lime,
    fontSize: 19,
    fontWeight: '800',
    lineHeight: 21,
  },
  brandMarkTextLight: { color: palette.forest },
  brandText: {
    color: palette.forest,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  textWhite: { color: palette.white },
  authScreen: { flex: 1, backgroundColor: palette.forest },
  authScroll: { flexGrow: 1, backgroundColor: palette.paper },
  authHero: {
    height: 390,
    paddingHorizontal: 25,
    paddingTop: 18,
    paddingBottom: 32,
    backgroundColor: palette.forest,
    overflow: 'hidden',
  },
  authSun: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: palette.orange,
    opacity: 0.78,
    right: -65,
    top: 55,
  },
  authPath: {
    position: 'absolute',
    height: 1,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: 'rgba(215,234,138,.4)',
    width: 330,
    right: -15,
    top: 210,
    transform: [{ rotate: '-24deg' }],
  },
  authPathDot: {
    position: 'absolute',
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 3,
    borderColor: palette.lime,
    backgroundColor: palette.forest,
    left: 0,
    top: -8,
  },
  authPathDotTwo: { left: 155 },
  authPathDotThree: { left: 310 },
  authHeadlineWrap: { marginTop: 'auto', zIndex: 2 },
  kickerLight: {
    color: palette.lime,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.6,
  },
  authHeadline: {
    color: palette.white,
    fontSize: 43,
    lineHeight: 48,
    fontWeight: '800',
    letterSpacing: -2,
    marginTop: 10,
  },
  authSubtitle: {
    color: 'rgba(255,255,255,.62)',
    fontSize: 13,
    lineHeight: 21,
    width: 270,
    marginTop: 12,
  },
  authFormCard: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 45,
    backgroundColor: palette.paper,
  },
  segmented: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 13,
    backgroundColor: palette.cream,
    marginBottom: 20,
  },
  segment: {
    flex: 1,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
  },
  segmentActive: {
    backgroundColor: palette.white,
    shadowColor: palette.forest,
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
  },
  segmentText: { color: palette.muted, fontSize: 13, fontWeight: '700' },
  segmentTextActive: { color: palette.forest },
  inputGroup: { marginBottom: 15 },
  inputLabel: {
    color: palette.ink,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 7,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 11,
    paddingHorizontal: 14,
    color: palette.ink,
    fontSize: 14,
    backgroundColor: palette.white,
  },
  errorText: {
    color: palette.danger,
    backgroundColor: '#FFF0EA',
    borderRadius: 9,
    padding: 11,
    marginBottom: 15,
    fontSize: 12,
    lineHeight: 18,
  },
  primaryButton: {
    minHeight: 54,
    borderRadius: 27,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: palette.orange,
    shadowColor: palette.orange,
    shadowOpacity: 0.22,
    shadowRadius: 13,
    shadowOffset: { width: 0, height: 7 },
  },
  primaryButtonText: { color: palette.white, fontSize: 14, fontWeight: '800' },
  primaryButtonArrow: { color: palette.white, fontSize: 18 },
  buttonDisabled: { opacity: 0.45 },
  buttonPressed: { transform: [{ scale: 0.985 }], opacity: 0.92 },
  demoLink: { alignItems: 'center', paddingVertical: 18 },
  demoLinkText: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  header: {
    height: 66,
    backgroundColor: palette.paper,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  previewBadge: {
    color: palette.orange,
    fontSize: 9,
    fontWeight: '800',
    backgroundColor: palette.orangeSoft,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 9,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.forest,
  },
  avatarText: { color: palette.white, fontSize: 11, fontWeight: '800' },
  logoutText: { color: palette.muted, fontSize: 10, fontWeight: '700' },
  homeContent: { paddingHorizontal: 20, paddingTop: 34 },
  kicker: {
    color: palette.orange,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  pageTitle: {
    color: palette.ink,
    fontSize: 36,
    lineHeight: 43,
    letterSpacing: -1.7,
    fontWeight: '800',
    marginTop: 10,
  },
  createPill: {
    minHeight: 44,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: palette.paper,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: palette.line,
    paddingVertical: 9,
    paddingHorizontal: 13,
    marginTop: 21,
  },
  createPillPlus: { color: palette.orange, fontSize: 17 },
  createPillText: { color: palette.forest, fontSize: 11, fontWeight: '800' },
  heroTrip: {
    height: 264,
    marginTop: 28,
    padding: 25,
    borderRadius: 23,
    backgroundColor: palette.forest,
    overflow: 'hidden',
    shadowColor: palette.forest,
    shadowOpacity: 0.18,
    shadowRadius: 17,
    shadowOffset: { width: 0, height: 9 },
  },
  heroTripSun: {
    position: 'absolute',
    right: -5,
    top: 20,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: palette.orange,
  },
  heroTripLand: {
    position: 'absolute',
    right: -55,
    bottom: -54,
    width: 290,
    height: 150,
    borderRadius: 100,
    backgroundColor: '#739589',
    transform: [{ rotate: '-9deg' }],
  },
  heroTripPath: {
    position: 'absolute',
    right: 0,
    bottom: 75,
    width: 170,
    borderTopWidth: 2,
    borderStyle: 'dashed',
    borderColor: palette.white,
    transform: [{ rotate: '18deg' }],
  },
  heroTripStatus: {
    color: palette.lime,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  heroTripTitle: {
    color: palette.white,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1.2,
    marginTop: 17,
  },
  heroTripMeta: { color: 'rgba(255,255,255,.62)', fontSize: 10, marginTop: 9 },
  heroTripLink: {
    color: palette.white,
    fontSize: 11,
    fontWeight: '800',
    marginTop: 'auto',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 39,
    marginBottom: 16,
  },
  sectionTitle: {
    color: palette.ink,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.7,
  },
  sectionCount: { color: palette.muted, fontSize: 10 },
  tripListCard: {
    height: 113,
    marginBottom: 12,
    padding: 10,
    borderRadius: 17,
    backgroundColor: palette.paper,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tripThumb: {
    width: 93,
    height: 93,
    borderRadius: 12,
    overflow: 'hidden',
    padding: 11,
  },
  tripThumbSun: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    right: 5,
    top: 9,
    backgroundColor: 'rgba(237,115,75,.82)',
  },
  tripThumbRegion: {
    color: palette.white,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 'auto',
  },
  tripListCopy: { flex: 1, paddingHorizontal: 15 },
  tripNights: { color: palette.orange, fontSize: 9, fontWeight: '800' },
  tripListTitle: {
    color: palette.ink,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 5,
  },
  tripListDate: { color: palette.muted, fontSize: 10, marginTop: 6 },
  chevron: { color: palette.muted, fontSize: 27, paddingHorizontal: 7 },
  bottomSpace: { height: 35 },
  notice: {
    minHeight: 42,
    marginBottom: 20,
    borderRadius: 11,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF3DC',
  },
  noticeText: { color: '#785627', fontSize: 10, fontWeight: '700' },
  noticeClose: { color: '#785627', fontSize: 20 },
  empty: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#C8CDC8',
    borderRadius: 19,
  },
  emptyIcon: {
    width: 55,
    height: 55,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.paper,
  },
  emptyIconText: { color: palette.orange, fontSize: 25, fontWeight: '700' },
  emptyTitle: {
    color: palette.ink,
    fontSize: 18,
    fontWeight: '800',
    marginTop: 16,
  },
  emptyText: {
    color: palette.muted,
    fontSize: 11,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 7,
    marginBottom: 17,
  },
  emptyButton: {
    height: 40,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: palette.white,
    borderWidth: 1,
    borderColor: palette.line,
  },
  emptyButtonText: { color: palette.forest, fontSize: 11, fontWeight: '800' },
  busyOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,253,249,.54)',
    zIndex: 50,
  },
  tripHeader: {
    minHeight: 90,
    paddingHorizontal: 18,
    paddingVertical: 13,
    backgroundColor: palette.paper,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  circleButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circleButtonText: { color: palette.forest, fontSize: 25, lineHeight: 28 },
  tripHeaderCopy: { alignItems: 'center', flex: 1, paddingHorizontal: 8 },
  tripHeaderRegion: { color: palette.orange, fontSize: 9, fontWeight: '800' },
  tripHeaderTitle: {
    color: palette.ink,
    fontSize: 20,
    fontWeight: '800',
    marginTop: 3,
  },
  tabs: {
    height: 52,
    paddingHorizontal: 20,
    flexDirection: 'row',
    gap: 25,
    backgroundColor: palette.paper,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.line,
  },
  tab: {
    justifyContent: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: palette.orange },
  tabText: { color: palette.muted, fontSize: 12, fontWeight: '700' },
  tabTextActive: { color: palette.ink },
  tripContent: { paddingHorizontal: 16, paddingTop: 17 },
  placeCard: {
    minHeight: 95,
    marginBottom: 9,
    paddingHorizontal: 13,
    paddingVertical: 13,
    borderRadius: 16,
    backgroundColor: palette.paper,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  placeIndex: { color: '#9AA39E', fontSize: 11, fontWeight: '700' },
  placeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF3F0',
  },
  placeIconText: { color: palette.forestSoft, fontSize: 19, fontWeight: '700' },
  placeCopy: { flex: 1 },
  placeCategory: { color: palette.orange, fontSize: 8, fontWeight: '800' },
  placeName: {
    color: palette.ink,
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3,
  },
  placeAddress: { color: palette.muted, fontSize: 9, marginTop: 5 },
  deleteText: { color: '#9AA39E', fontSize: 23, paddingHorizontal: 4 },
  routeBuilder: {
    marginTop: 18,
    padding: 22,
    borderRadius: 20,
    backgroundColor: palette.forest,
  },
  routeBuilderSpark: { color: palette.lime, fontSize: 26 },
  routeBuilderTitle: {
    color: palette.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.8,
    marginTop: 11,
  },
  routeBuilderDescription: {
    color: 'rgba(255,255,255,.6)',
    fontSize: 10,
    lineHeight: 17,
    marginTop: 7,
    marginBottom: 20,
  },
  chipRow: { flexDirection: 'row', gap: 7, paddingBottom: 13 },
  choiceChip: {
    minHeight: 44,
    minWidth: 44,
    borderRadius: 22,
    paddingHorizontal: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: palette.line,
    backgroundColor: palette.paper,
  },
  choiceChipActive: {
    backgroundColor: palette.lime,
    borderColor: palette.lime,
  },
  choiceChipText: { color: palette.muted, fontSize: 10, fontWeight: '700' },
  choiceChipTextActive: { color: palette.forest, fontWeight: '900' },
  routeEmptyWrap: { flexGrow: 1, padding: 18, justifyContent: 'center' },
  routeResultContent: { padding: 17 },
  routeMap: {
    height: 260,
    overflow: 'hidden',
    borderRadius: 21,
    backgroundColor: '#E3E4D6',
    marginBottom: 26,
  },
  nativeMap: { ...StyleSheet.absoluteFill },
  mapMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.forest,
    borderWidth: 3,
    borderColor: palette.paper,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  mapMarkerText: { color: palette.white, fontSize: 11, fontWeight: '900' },
  mapBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(255,253,249,.94)',
  },
  mapBadgeText: { color: palette.forest, fontSize: 9, fontWeight: '800' },
  mapFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapFallbackText: { color: palette.muted, fontSize: 11 },
  routeTitle: {
    color: palette.ink,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -1.1,
    marginTop: 5,
    marginBottom: 17,
  },
  metrics: { flexDirection: 'row', gap: 9, marginBottom: 23 },
  metric: {
    flex: 1,
    padding: 14,
    borderRadius: 13,
    backgroundColor: palette.paper,
  },
  metricValue: { color: palette.ink, fontSize: 18, fontWeight: '800' },
  metricLabel: { color: palette.muted, fontSize: 9, marginTop: 4 },
  timeline: { paddingVertical: 4, marginBottom: 20 },
  timelineRow: { minHeight: 69, flexDirection: 'row' },
  timelineRail: { width: 36, alignItems: 'center' },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: palette.forest,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  timelineDotText: { color: palette.white, fontSize: 9, fontWeight: '900' },
  timelineLine: {
    width: 1,
    flex: 1,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#ACB5B0',
  },
  timelineCopy: { flex: 1, paddingLeft: 8, paddingTop: 1 },
  timelineTime: { color: palette.muted, fontSize: 9 },
  timelineName: {
    color: palette.ink,
    fontSize: 15,
    fontWeight: '800',
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(12,33,28,.54)',
  },
  modalDismissArea: { flex: 1 },
  sheet: {
    maxHeight: '88%',
    backgroundColor: palette.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CDD1CE',
    alignSelf: 'center',
    marginBottom: 15,
  },
  sheetHeader: {
    paddingHorizontal: 22,
    paddingBottom: 19,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  sheetTitle: {
    color: palette.ink,
    fontSize: 25,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  sheetSubtitle: {
    color: palette.muted,
    fontSize: 10,
    lineHeight: 16,
    marginTop: 6,
  },
  sheetClose: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetCloseText: { color: palette.muted, fontSize: 23, lineHeight: 25 },
  sheetContent: { paddingHorizontal: 22, paddingBottom: 28 },
  modalFieldRow: { flexDirection: 'row', gap: 10 },
  dateField: {
    minHeight: 72,
    marginBottom: 13,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 13,
    backgroundColor: palette.white,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dateValue: { color: palette.ink, fontSize: 13, fontWeight: '700' },
  searchRow: { flexDirection: 'row', gap: 8, marginBottom: 9 },
  searchInputWrap: {
    flex: 1,
    height: 50,
    paddingHorizontal: 13,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 12,
    backgroundColor: palette.white,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: palette.ink,
    fontSize: 14,
    paddingVertical: 0,
  },
  searchButton: {
    width: 58,
    height: 50,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.forest,
  },
  searchButtonText: { color: palette.white, fontSize: 12, fontWeight: '800' },
  searchError: {
    color: palette.danger,
    fontSize: 10,
    lineHeight: 15,
    marginBottom: 10,
  },
  searchResults: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: palette.line,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: palette.white,
  },
  searchResult: {
    minHeight: 62,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: palette.line,
  },
  searchResultIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.orangeSoft,
  },
  searchResultCopy: { flex: 1 },
  searchResultName: { color: palette.ink, fontSize: 13, fontWeight: '800' },
  searchResultAddress: { color: palette.muted, fontSize: 9, marginTop: 4 },
  selectedPlace: {
    minHeight: 60,
    marginBottom: 16,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 13,
    backgroundColor: '#EEF5F1',
  },
  selectedPlaceName: { color: palette.ink, fontSize: 13, fontWeight: '800' },
  selectedPlaceAddress: { color: palette.muted, fontSize: 9, marginTop: 3 },
  coordinateNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 17,
  },
  coordinateNoteText: { color: palette.muted, fontSize: 10, flex: 1 },
});
