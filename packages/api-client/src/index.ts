export type PlaceCategory =
  | 'RESTAURANT'
  | 'CAFE'
  | 'TOURIST_SPOT'
  | 'HOTEL'
  | 'PHOTO_SPOT'
  | 'ETC';

export type PlacePriority = 'HIGH' | 'MEDIUM' | 'LOW';
export type TransportType = 'CAR' | 'PUBLIC_TRANSIT' | 'BICYCLE' | 'WALK';
export type OptimizationType =
  | 'DISTANCE'
  | 'TIME'
  | 'FOOD'
  | 'CAFE'
  | 'TOUR'
  | 'PHOTO';

export interface User {
  id: number;
  email: string;
  nickname: string;
  role?: 'USER' | 'ADMIN';
}

export interface Trip {
  id: number;
  title: string;
  region: string;
  startDate: string;
  endDate: string;
  destinationType?: DestinationType;
  mapPreference?: MapPreference;
}

export type DestinationType = 'DOMESTIC' | 'INTERNATIONAL';
export type MapProvider = 'KAKAO' | 'GOOGLE';
export type MapPreference = 'AUTO' | MapProvider;
export const mapProviderLabel: Record<MapProvider, string> = {
  KAKAO: '카카오맵',
  GOOGLE: 'Google Maps',
};
export function resolveMapProvider(
  trip: Pick<Trip, 'destinationType' | 'mapPreference'>
): MapProvider {
  if (trip.mapPreference === 'KAKAO' || trip.mapPreference === 'GOOGLE')
    return trip.mapPreference;
  return trip.destinationType === 'INTERNATIONAL' ? 'GOOGLE' : 'KAKAO';
}

export interface Place {
  id: number;
  name: string;
  category: PlaceCategory;
  address: string | null;
  latitude: number;
  longitude: number;
  priority: PlacePriority;
  stayTimeMinutes: number;
  googlePlaceId?: string;
  locationUnavailable?: boolean;
  attributions?: Array<{ provider: string; providerUri?: string }>;
}

export interface TripDetail extends Trip {
  places: Place[];
}

export interface RecommendedPlace {
  placeId: number;
  name: string;
  visitOrder: number;
  estimatedArrivalTime: string;
  moveTimeFromPreviousMinutes: number;
  distanceFromPreviousMeters: number;
}

export interface RouteRecommendation {
  recommendedPlaces: RecommendedPlace[];
  totalMoveTimeMinutes: number;
  totalDistanceMeters: number;
}

export interface SavedRoute {
  id: number;
  name: string | null;
  optimizationType: OptimizationType;
  totalDistanceMeters: number;
  totalMoveTimeMinutes: number;
  places: RecommendedPlace[];
}

export interface MapSearchResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface DiscoveryInput {
  region: string;
  category: PlaceCategory;
  provider: MapProvider;
  sort?: 'REVIEWS' | 'RATING' | 'RELEVANCE';
  q?: string;
}
export interface DiscoveryPlace extends MapSearchResult {
  id: string;
  category: PlaceCategory;
  source: MapProvider | 'DEMO';
  googlePlaceId?: string;
  rating: number | null;
  reviewCount: number | null;
  sourceUrl: string | null;
  attributions: Array<{ provider: string; providerUri?: string }>;
}
export interface DiscoveryResult {
  items: DiscoveryPlace[];
  sort: 'REVIEWS' | 'RATING' | 'RELEVANCE';
  note: string;
}

export interface CreateTripInput {
  title: string;
  region: string;
  startDate: string;
  endDate: string;
  destinationType?: DestinationType;
  mapPreference?: MapPreference;
}

export interface CreatePlaceInput {
  googlePlaceId?: string;
  name: string;
  category: PlaceCategory;
  address?: string;
  latitude: number;
  longitude: number;
  priority?: PlacePriority;
  stayTimeMinutes?: number;
}

export interface RecommendRouteInput {
  startTime: string;
  transportType: TransportType;
  optimizationType: OptimizationType;
}

interface SuccessResponse<T> {
  success: true;
  data: T;
}

interface ListResponse<T> {
  success: true;
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

interface ErrorResponse {
  success: false;
  code?: string;
  message?: string;
}

export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    if (code !== undefined) this.code = code;
  }
}

export interface PathTripClientOptions {
  baseUrl: string;
  getAccessToken?: () => string | null | Promise<string | null>;
}

const withoutTrailingSlash = (value: string) => value.replace(/\/+$/, '');

export const createPathTripClient = ({
  baseUrl,
  getAccessToken,
}: PathTripClientOptions) => {
  const request = async <T>(
    path: string,
    options: RequestInit = {}
  ): Promise<T> => {
    const token = await getAccessToken?.();
    const response = await fetch(`${withoutTrailingSlash(baseUrl)}${path}`, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(options.body ? { 'Content-Type': 'application/json' } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers,
      },
    });

    if (response.status === 204) return undefined as T;

    const payload = (await response.json().catch(() => null)) as
      | SuccessResponse<T>
      | ErrorResponse
      | null;

    if (!response.ok || !payload || payload.success === false) {
      const error = payload && payload.success === false ? payload : null;
      throw new ApiError(
        error?.message ?? '서버 요청을 처리하지 못했습니다.',
        response.status,
        error?.code
      );
    }

    return payload.data;
  };

  return {
    health: () => request<{ status: string; timestamp: string }>('/health'),
    signup: (input: { email: string; password: string; nickname: string }) =>
      request<User>('/api/v1/auth/signup', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    login: (input: { email: string; password: string }) =>
      request<{ accessToken: string; user: User }>('/api/v1/auth/login', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    me: () => request<User>('/api/v1/users/me'),
    listTrips: async (page = 1, limit = 20) => {
      const token = await getAccessToken?.();
      const response = await fetch(
        `${withoutTrailingSlash(baseUrl)}/api/v1/trips?page=${page}&limit=${limit}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : {} }
      );
      const payload = (await response.json().catch(() => null)) as
        | ListResponse<Trip>
        | ErrorResponse
        | null;
      if (!response.ok || !payload || payload.success === false) {
        const error = payload && payload.success === false ? payload : null;
        throw new ApiError(
          error?.message ?? '여행 목록을 불러오지 못했습니다.',
          response.status,
          error?.code
        );
      }
      return { items: payload.data, meta: payload.meta };
    },
    createTrip: (input: CreateTripInput) =>
      request<{ tripId: number }>('/api/v1/trips', {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    getTrip: (tripId: number) => request<TripDetail>(`/api/v1/trips/${tripId}`),
    updateTrip: (tripId: number, input: Partial<CreateTripInput>) =>
      request<Trip>(`/api/v1/trips/${tripId}`, {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    deleteTrip: (tripId: number) =>
      request<void>(`/api/v1/trips/${tripId}`, { method: 'DELETE' }),
    listPlaces: (tripId: number) =>
      request<Place[]>(`/api/v1/trips/${tripId}/places`),
    createPlace: (tripId: number, input: CreatePlaceInput) =>
      request<{ placeId: number }>(`/api/v1/trips/${tripId}/places`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    deletePlace: (placeId: number) =>
      request<void>(`/api/v1/places/${placeId}`, { method: 'DELETE' }),
    searchPlaces: (query: string, provider: MapProvider = 'KAKAO') =>
      request<MapSearchResult[]>(
        `/api/v1/maps/search?q=${encodeURIComponent(query)}&provider=${provider}`
      ),
    discoverPlaces: (input: DiscoveryInput) =>
      request<DiscoveryResult>(
        `/api/v1/discovery?${new URLSearchParams({ region: input.region, category: input.category, provider: input.provider, sort: input.sort ?? 'REVIEWS', q: input.q ?? '' })}`
      ),
    recommendRoute: (tripId: number, input: RecommendRouteInput) =>
      request<RouteRecommendation>(`/api/v1/trips/${tripId}/routes/recommend`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    saveRoute: (
      tripId: number,
      input: {
        name?: string;
        optimizationType: OptimizationType;
        totalDistanceMeters: number;
        totalMoveTimeMinutes: number;
        places: RecommendedPlace[];
      }
    ) =>
      request<{ routeId: number }>(`/api/v1/trips/${tripId}/routes`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    listRoutes: (tripId: number) =>
      request<SavedRoute[]>(`/api/v1/trips/${tripId}/routes`),
  };
};

export type PathTripClient = ReturnType<typeof createPathTripClient>;
export { discoveryCategories, previewDiscovery } from './discovery-preview.js';
