import type { VisitLocation } from '@pathtrip/api-client';

export function getVisitLocation(): Promise<VisitLocation> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('이 브라우저에서는 현재 위치를 확인할 수 없습니다.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (
          !Number.isFinite(position.coords.accuracy) ||
          position.coords.accuracy > 100 ||
          position.coords.accuracy < 0
        ) {
          reject(
            new Error(
              '정확도 100m 이내의 위치가 필요해요. 정확한 위치를 허용한 뒤 다시 시도해 주세요.'
            )
          );
          return;
        }
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          capturedAt: new Date(position.timestamp).toISOString(),
        });
      },
      (error) =>
        reject(
          new Error(
            error.code === 1
              ? '위치 권한을 허용한 뒤 다시 시도해 주세요.'
              : '현재 위치를 가져오지 못했어요. 위치 서비스를 확인해 주세요.'
          )
        ),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 20_000 }
    );
  });
}
