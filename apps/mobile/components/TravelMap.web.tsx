import { StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import {
  mapProviderLabel,
  type DestinationType,
  type MapProvider,
} from '@pathtrip/api-client';

export function TravelMap({
  provider,
  points,
  connect = false,
}: {
  provider: MapProvider;
  destination: DestinationType;
  points: { name: string; latitude: number; longitude: number }[];
  connect?: boolean;
}) {
  return (
    <View
      style={styles.map}
      accessibilityLabel={`${mapProviderLabel[provider]} 앱 미리보기`}
    >
      <View style={styles.icon}>
        <Ionicons name="map-outline" size={28} color="#173E35" />
      </View>
      <Text style={styles.title}>{mapProviderLabel[provider]}</Text>
      <Text style={styles.subtitle}>지도는 실제 iPhone에서 확인해 주세요.</Text>
      <Text style={styles.caption}>
        이 미리보기에서는 지도 표시를 생략합니다.
      </Text>
      <View style={styles.badge}>
        <Text style={styles.badgeText}>
          {connect ? '추천 방문 순서' : '담은 장소'} · {points.length}곳
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  map: {
    height: 240,
    borderRadius: 20,
    backgroundColor: '#ECEEE4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    padding: 20,
  },
  icon: {
    width: 60,
    height: 60,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D7EA8A',
    marginBottom: 12,
  },
  title: { fontSize: 17, fontWeight: '700', color: '#173E35', marginBottom: 8 },
  subtitle: { fontSize: 12, color: '#53685E' },
  caption: { fontSize: 11, color: '#718078', marginTop: 5 },
  badge: {
    marginTop: 16,
    backgroundColor: '#FFFDF9',
    borderRadius: 14,
    paddingVertical: 7,
    paddingHorizontal: 12,
  },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#173E35' },
});
