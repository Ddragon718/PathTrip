import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { WebView } from 'react-native-webview';
import { AppPressable as Pressable } from './AppPressable';
import {
  mapProviderLabel,
  type DestinationType,
  type MapProvider,
} from '@pathtrip/api-client';

type Point = {
  name: string;
  latitude: number;
  longitude: number;
  googlePlaceId?: string;
  locationUnavailable?: boolean;
};
const webBase =
  process.env.EXPO_PUBLIC_MAP_WEB_BASE_URL ?? 'http://localhost:3000';

function GoogleMap({
  points,
  connect,
  destination,
}: {
  points: Point[];
  connect: boolean;
  destination: DestinationType;
}) {
  const ref = useRef<MapView>(null);
  const fit = () => {
    if (points.length > 1)
      ref.current?.fitToCoordinates(points, {
        edgePadding: { top: 45, right: 35, bottom: 45, left: 35 },
        animated: false,
      });
    else if (points[0])
      ref.current?.animateToRegion(
        { ...points[0], latitudeDelta: 0.04, longitudeDelta: 0.04 },
        200
      );
  };
  useEffect(fit, [points]);
  return (
    <MapView
      ref={ref}
      provider={PROVIDER_GOOGLE}
      style={styles.fill}
      onMapReady={fit}
      initialRegion={
        destination === 'DOMESTIC'
          ? {
              latitude: 36.2,
              longitude: 127.8,
              latitudeDelta: 6,
              longitudeDelta: 6,
            }
          : {
              latitude: 20,
              longitude: 0,
              latitudeDelta: 100,
              longitudeDelta: 180,
            }
      }
      showsUserLocation={false}
      accessibilityLabel="Google Maps 여행 지도"
    >
      {points.map((point, index) => (
        <Marker
          key={`${index}-${point.latitude}-${point.longitude}`}
          coordinate={point}
          title={`${index + 1}. ${point.name}`}
        >
          <View style={styles.pin}>
            <Text style={styles.pinText}>{index + 1}</Text>
          </View>
        </Marker>
      ))}
      {connect && points.length > 1 && (
        <Polyline coordinates={points} strokeWidth={4} strokeColor="#ED734B" />
      )}
    </MapView>
  );
}

export function TravelMap({
  provider,
  destination,
  points,
  connect = false,
}: {
  provider: MapProvider;
  destination: DestinationType;
  points: Point[];
  connect?: boolean;
}) {
  const web = useRef<WebView>(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const visiblePoints = points.filter(
    (point) =>
      !point.locationUnavailable &&
      (provider === 'GOOGLE' || !point.googlePlaceId)
  );
  const payload = JSON.stringify({
    type: 'PATHTRIP_MAP_DATA',
    points: visiblePoints,
    connect: connect && visiblePoints.length === points.length,
  });
  const send = () => web.current?.postMessage(payload);
  useEffect(() => {
    send();
  }, [payload]);
  useEffect(() => {
    setError(false);
  }, [provider, destination]);
  const googleConfigured =
    Platform.OS === 'ios' &&
    Boolean(process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY);
  const uri = `${webBase.replace(/\/+$/, '')}/maps/view?provider=${provider}&destination=${destination}`;
  let origin: string;
  try {
    origin = new URL(webBase).origin;
  } catch {
    origin = '';
  }

  return (
    <View style={styles.container}>
      {visiblePoints.length !== points.length && (
        <Text style={styles.statusText}>
          일부 장소는 위치 확인이 필요하거나 Google Maps에서만 표시됩니다.
        </Text>
      )}
      {provider === 'GOOGLE' && googleConfigured ? (
        <GoogleMap
          key={destination}
          points={visiblePoints}
          connect={connect && visiblePoints.length === points.length}
          destination={destination}
        />
      ) : provider === 'GOOGLE' ? (
        <View style={styles.status}>
          <Text style={styles.statusText}>
            Google Maps 연결을 준비 중이에요. 장소 목록은 계속 이용할 수 있어요.
          </Text>
        </View>
      ) : !origin || error ? (
        <View style={styles.status}>
          <Text style={styles.statusText}>카카오맵을 불러오지 못했어요.</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              setError(false);
              setAttempt((value) => value + 1);
            }}
          >
            <Text style={styles.retry}>다시 불러오기</Text>
          </Pressable>
        </View>
      ) : (
        <WebView
          key={`${provider}-${destination}-${attempt}`}
          ref={web}
          source={{ uri }}
          style={styles.fill}
          originWhitelist={[origin]}
          onShouldStartLoadWithRequest={(request) =>
            request.url === 'about:blank' ||
            request.url.startsWith(`${origin}/`)
          }
          javaScriptEnabled
          setSupportMultipleWindows={false}
          startInLoadingState
          renderLoading={() => (
            <View style={[StyleSheet.absoluteFill, styles.status]}>
              <ActivityIndicator color="#ED734B" />
            </View>
          )}
          onLoadEnd={send}
          onError={() => setError(true)}
          onHttpError={() => setError(true)}
          onMessage={(event) => {
            try {
              if (
                JSON.parse(event.nativeEvent.data).type === 'PATHTRIP_MAP_READY'
              )
                send();
            } catch {
              /* Ignore unrelated page events. */
            }
          }}
          accessibilityLabel={`${mapProviderLabel[provider]} 여행 지도`}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 260,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#F5F1E8',
    marginBottom: 18,
  },
  fill: { flex: 1 },
  status: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  statusText: {
    color: '#718078',
    fontSize: 13,
    lineHeight: 21,
    textAlign: 'center',
  },
  retry: { color: '#173E35', fontWeight: '700', padding: 14 },
  pin: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#173E35',
    borderWidth: 3,
    borderColor: '#FFFDF9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinText: { color: '#fff', fontSize: 12, fontWeight: '800' },
});
