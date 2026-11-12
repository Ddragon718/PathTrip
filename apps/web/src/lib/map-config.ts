type MapEnvironment = Record<string, string | undefined>;

export function buildMapConfig(
  provider: 'GOOGLE' | 'KAKAO',
  destination: 'DOMESTIC' | 'INTERNATIONAL',
  environment: MapEnvironment
): {
  provider: 'GOOGLE' | 'KAKAO';
  destination: 'DOMESTIC' | 'INTERNATIONAL';
  key: string;
  mapId: string;
  disabledMessage: string;
} {
  const enabled =
    (provider === 'GOOGLE'
      ? environment.GOOGLE_MAPS_WEB_ENABLED
      : environment.KAKAO_MAPS_WEB_ENABLED) === 'true';
  return {
    provider,
    destination,
    // Do not publish a map key before provider quota settings are checked.
    key: enabled
      ? ((provider === 'GOOGLE'
          ? environment.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
          : environment.NEXT_PUBLIC_KAKAO_MAP_JS_KEY) ?? '')
      : '',
    mapId: environment.NEXT_PUBLIC_GOOGLE_MAP_ID || 'DEMO_MAP_ID',
    disabledMessage: enabled
      ? ''
      : '비용 보호를 위해 지도 연결을 준비 중이에요. 장소 목록은 계속 이용할 수 있어요.',
  };
}
