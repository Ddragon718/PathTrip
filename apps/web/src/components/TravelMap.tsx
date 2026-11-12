'use client';

import { useEffect, useRef } from 'react';
import {
  mapProviderLabel,
  type DestinationType,
  type MapProvider,
} from '@pathtrip/api-client';

export type MapPoint = {
  name: string;
  latitude: number;
  longitude: number;
  googlePlaceId?: string;
  locationUnavailable?: boolean;
};

export function TravelMap({
  provider,
  destination,
  points,
  connect = false,
}: {
  provider: MapProvider;
  destination: DestinationType;
  points: MapPoint[];
  connect?: boolean;
}) {
  const frame = useRef<HTMLIFrameElement>(null);
  const payload = JSON.stringify({
    type: 'PATHTRIP_MAP_DATA',
    points: points.filter(
      (point) =>
        !point.locationUnavailable &&
        (provider === 'GOOGLE' || !point.googlePlaceId)
    ),
    connect:
      connect &&
      points.every(
        (point) =>
          !point.locationUnavailable &&
          (provider === 'GOOGLE' || !point.googlePlaceId)
      ),
  });
  useEffect(() => {
    const send = () =>
      frame.current?.contentWindow?.postMessage(
        JSON.parse(payload),
        window.location.origin
      );
    const receive = (event: MessageEvent) => {
      if (
        event.source === frame.current?.contentWindow &&
        event.origin === window.location.origin &&
        event.data?.type === 'PATHTRIP_MAP_READY'
      )
        send();
    };
    window.addEventListener('message', receive);
    send();
    return () => window.removeEventListener('message', receive);
  }, [payload, provider, destination]);
  return (
    <>
      {points.some(
        (point) =>
          point.locationUnavailable ||
          (provider === 'KAKAO' && point.googlePlaceId)
      ) && (
        <p className="discovery-note">
          일부 장소는 위치 확인이 필요하거나 Google Maps에서만 표시됩니다.
        </p>
      )}
      <iframe
        ref={frame}
        key={`${provider}-${destination}`}
        className="travel-map"
        title={`${mapProviderLabel[provider]} 여행 지도`}
        src={`/maps/view?provider=${provider}&destination=${destination}`}
        onLoad={() =>
          frame.current?.contentWindow?.postMessage(
            JSON.parse(payload),
            window.location.origin
          )
        }
      />
    </>
  );
}
