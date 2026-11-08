'use client';

import { useEffect, useRef } from 'react';
import {
  mapProviderLabel,
  type DestinationType,
  type MapProvider,
} from '@pathtrip/api-client';

export type MapPoint = { name: string; latitude: number; longitude: number };

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
    points,
    connect,
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
  );
}
