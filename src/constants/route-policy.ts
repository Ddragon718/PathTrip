export const TRANSPORT_SPEED_KMH = {
  CAR: 35,
  PUBLIC_TRANSIT: 25,
  BICYCLE: 15,
  WALK: 4.5,
} as const;

export type TransportType = keyof typeof TRANSPORT_SPEED_KMH;
export type OptimizationType =
  | 'DISTANCE'
  | 'TIME'
  | 'FOOD'
  | 'CAFE'
  | 'TOUR'
  | 'PHOTO';

export interface RoutablePlace {
  id: number;
  name: string;
  category: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  latitude: number;
  longitude: number;
  stayTimeMinutes: number;
}

export interface RecommendedPlace {
  placeId: number;
  name: string;
  visitOrder: number;
  estimatedArrivalTime: string;
  moveTimeFromPreviousMinutes: number;
  distanceFromPreviousMeters: number;
}

const preferenceCategory: Partial<Record<OptimizationType, string>> = {
  FOOD: 'RESTAURANT',
  CAFE: 'CAFE',
  TOUR: 'TOURIST_SPOT',
  PHOTO: 'PHOTO_SPOT',
};

const priorityRank = { HIGH: 0, MEDIUM: 1, LOW: 2 } as const;
const priorityMultiplier = { HIGH: 0.75, MEDIUM: 1, LOW: 1.25 } as const;

export const haversineDistanceMeters = (
  first: Pick<RoutablePlace, 'latitude' | 'longitude'>,
  second: Pick<RoutablePlace, 'latitude' | 'longitude'>
): number => {
  const earthRadiusMeters = 6_371_000;
  const toRadians = (degree: number): number => (degree * Math.PI) / 180;
  const latitudeDelta = toRadians(second.latitude - first.latitude);
  const longitudeDelta = toRadians(second.longitude - first.longitude);
  const firstLatitude = toRadians(first.latitude);
  const secondLatitude = toRadians(second.latitude);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(firstLatitude) *
      Math.cos(secondLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  const normalized = Math.min(1, Math.max(0, a));
  return (
    earthRadiusMeters *
    2 *
    Math.atan2(Math.sqrt(normalized), Math.sqrt(1 - normalized))
  );
};

const initialSort = (
  places: RoutablePlace[],
  optimizationType: OptimizationType
): RoutablePlace[] => {
  const preferred = preferenceCategory[optimizationType];
  return [...places].sort((a, b) => {
    const categoryA = preferred && a.category === preferred ? 0 : 1;
    const categoryB = preferred && b.category === preferred ? 0 : 1;
    return (
      categoryA - categoryB ||
      priorityRank[a.priority] - priorityRank[b.priority] ||
      a.id - b.id
    );
  });
};

export const recommendRoute = (
  places: RoutablePlace[],
  startTime: Date,
  transportType: TransportType,
  optimizationType: OptimizationType
): {
  recommendedPlaces: RecommendedPlace[];
  totalMoveTimeMinutes: number;
  totalDistanceMeters: number;
} => {
  if (places.length < 2) {
    throw new Error('At least two places are required');
  }

  const ordered: RoutablePlace[] = [];
  const remaining = initialSort(places, optimizationType);
  const first = remaining.shift();
  if (!first) {
    throw new Error('At least two places are required');
  }
  ordered.push(first);

  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1];
    if (!current) break;
    const preferred = preferenceCategory[optimizationType];
    remaining.sort((a, b) => {
      const score = (place: RoutablePlace): number => {
        const categoryMultiplier =
          preferred && place.category === preferred ? 0.7 : 1;
        return (
          haversineDistanceMeters(current, place) *
          priorityMultiplier[place.priority] *
          categoryMultiplier
        );
      };
      return score(a) - score(b) || a.id - b.id;
    });
    const next = remaining.shift();
    if (next) ordered.push(next);
  }

  const speedMetersPerMinute = (TRANSPORT_SPEED_KMH[transportType] * 1000) / 60;
  let arrival = new Date(startTime);
  let totalDistanceMeters = 0;
  let totalMoveTimeMinutes = 0;

  const recommendedPlaces = ordered.map((place, index): RecommendedPlace => {
    const previous = ordered[index - 1];
    let distanceFromPreviousMeters = 0;
    let moveTimeFromPreviousMinutes = 0;
    if (previous) {
      distanceFromPreviousMeters = Math.round(
        haversineDistanceMeters(previous, place)
      );
      moveTimeFromPreviousMinutes =
        distanceFromPreviousMeters === 0
          ? 0
          : Math.max(
              1,
              Math.round(distanceFromPreviousMeters / speedMetersPerMinute)
            );
      arrival = new Date(
        arrival.getTime() +
          (previous.stayTimeMinutes + moveTimeFromPreviousMinutes) * 60_000
      );
      totalDistanceMeters += distanceFromPreviousMeters;
      totalMoveTimeMinutes += moveTimeFromPreviousMinutes;
    }
    return {
      placeId: place.id,
      name: place.name,
      visitOrder: index + 1,
      estimatedArrivalTime: arrival.toISOString(),
      moveTimeFromPreviousMinutes,
      distanceFromPreviousMeters,
    };
  });

  return { recommendedPlaces, totalMoveTimeMinutes, totalDistanceMeters };
};
