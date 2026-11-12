import type { Place } from '@prisma/client';
import { discoveryClient } from '../discovery/discovery.client.js';

// Persist only an exempt Google place ID. Provider content is fetched on demand,
// never written to the place record or a shared application cache.
export async function resolvePlaceData(place: Place, strict = false) {
  const base = {
    id: place.id,
    name: place.name,
    category: place.category,
    address: place.address,
    latitude: place.latitude,
    longitude: place.longitude,
    priority: place.priority,
    stayTimeMinutes: place.stayTimeMinutes,
  };
  if (!place.googlePlaceId) return base;
  try {
    const details = await discoveryClient.googleDetails(place.googlePlaceId);
    return {
      ...base,
      name: details.displayName.text,
      address: details.formattedAddress,
      ...details.location,
      googlePlaceId: place.googlePlaceId,
      attributions: details.attributions,
    };
  } catch (error) {
    if (strict) throw error;
    return {
      ...base,
      name: 'Google Maps 장소 · 정보 다시 불러오기 필요',
      googlePlaceId: place.googlePlaceId,
      locationUnavailable: true,
    };
  }
}
