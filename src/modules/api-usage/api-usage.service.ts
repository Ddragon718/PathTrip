import { env } from '../../config/env.js';
import { ERROR_CODE } from '../../constants/error-code.js';
import { AppError } from '../../utils/AppError.js';
import { apiUsageRepository } from './api-usage.repository.js';

// Conservative development ceilings, not a guarantee of the provider's bill.
// Text Search Pro and Enterprise deliberately share the smaller allowance.
export const API_USAGE_LIMITS = {
  GOOGLE_TEXT_SEARCH: { daily: 20, monthly: 600 },
  GOOGLE_PLACE_DETAILS: { daily: 80, monthly: 2400 },
  GOOGLE_GEOCODING: { daily: 80, monthly: 2400 },
  KAKAO_LOCAL: { daily: 200, monthly: 6000 },
} as const;
export type MeteredApi = keyof typeof API_USAGE_LIMITS;

export function usagePeriod(service: MeteredApi, now: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: service === 'KAKAO_LOCAL' ? 'Asia/Seoul' : 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)!.value;
  const month = `${part('year')}-${part('month')}`;
  return { day: `${month}-${part('day')}`, month };
}

export const apiUsageService = {
  async reserve(service: MeteredApi): Promise<void> {
    const enabled =
      service === 'KAKAO_LOCAL'
        ? env.KAKAO_MAPS_REQUESTS_ENABLED
        : env.GOOGLE_MAPS_REQUESTS_ENABLED;
    if (!enabled) {
      throw new AppError(
        503,
        ERROR_CODE.MAP_REQUESTS_DISABLED,
        '비용 보호를 위해 실제 장소 조회를 잠시 꺼 두었어요. 연결 설정이 끝나면 이용할 수 있어요.'
      );
    }
    const limits = API_USAGE_LIMITS[service];
    const period = usagePeriod(service, new Date());
    let reserved: boolean;
    try {
      reserved = await apiUsageRepository.reserve(
        service,
        period.day,
        period.month,
        limits.daily,
        limits.monthly
      );
    } catch {
      // Fail closed: never send a provider request without a durable reservation.
      throw new AppError(
        503,
        ERROR_CODE.MAP_USAGE_UNAVAILABLE,
        '사용량을 확인하지 못해 장소 조회를 잠시 멈췄어요. 잠시 후 다시 시도해 주세요.'
      );
    }
    if (!reserved) {
      throw new AppError(
        429,
        ERROR_CODE.MAP_USAGE_LIMIT_REACHED,
        '비용 보호를 위한 일간 또는 월간 조회 한도에 도달했어요. 한도가 갱신된 후 다시 이용해 주세요.'
      );
    }
  },
};
