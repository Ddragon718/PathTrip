import * as Location from 'expo-location';
import type { VisitLocation } from '@pathtrip/api-client';

// Called only after the user agrees and explicitly presses Verify.
export async function getVisitLocation(): Promise<VisitLocation> {
  const permission = await Location.requestForegroundPermissionsAsync();
  if (permission.status !== 'granted')
    throw new Error(
      '방문 인증에는 현재 위치 권한이 필요해요. 설정에서 허용한 뒤 다시 시도해 주세요.'
    );
  let timeout: ReturnType<typeof setTimeout> | undefined;
  try {
    const position = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      new Promise<never>((_, reject) => {
        timeout = setTimeout(
          () =>
            reject(
              new Error(
                '위치를 가져오는 데 시간이 걸리고 있어요. 위치 서비스를 확인하고 다시 시도해 주세요.'
              )
            ),
          25_000
        );
      }),
    ]);
    if (position.mocked)
      throw new Error('모의 위치로는 방문 인증할 수 없습니다.');
    if (position.coords.accuracy === null || position.coords.accuracy > 100)
      throw new Error(
        '정확도 100m 이내의 위치가 필요해요. 정확한 위치를 허용하고 다시 시도해 주세요.'
      );
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      capturedAt: new Date(position.timestamp).toISOString(),
    };
  } finally {
    if (timeout) clearTimeout(timeout);
  }
}
