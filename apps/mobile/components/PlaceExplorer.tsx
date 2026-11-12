import { useState, type ComponentProps } from 'react';
import { Text, View } from 'react-native';
import { PlaceDiscovery } from './PlaceDiscovery';
import { VisitorRecommendations } from './VisitorRecommendations';
import { AppPressable as Pressable } from './AppPressable';
import { discoveryStyles as s } from './discovery-styles';

export function PlaceExplorer(props: ComponentProps<typeof PlaceDiscovery>) {
  const [tab, setTab] = useState('places');
  const [search, setSearch] =
    useState<ComponentProps<typeof PlaceDiscovery>['initialSearch']>(null);
  return (
    <View style={s.root}>
      <View style={s.row}>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'places' }}
          style={[s.chip, tab === 'places' && s.active]}
          onPress={() => {
            setSearch(null);
            setTab('places');
          }}
        >
          <Text style={s.chipText}>장소 추천</Text>
        </Pressable>
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{ selected: tab === 'visitors' }}
          style={[s.chip, tab === 'visitors' && s.active]}
          onPress={() => setTab('visitors')}
        >
          <Text style={s.chipText}>방문자 추천</Text>
        </Pressable>
      </View>
      {tab === 'places' ? (
        <PlaceDiscovery {...props} initialSearch={search ?? null} />
      ) : (
        <VisitorRecommendations
          region={props.region}
          api={props.api}
          isDemo={props.isDemo}
          onFindPlace={(name, category) => {
            setSearch({ name, category });
            setTab('places');
          }}
        />
      )}
    </View>
  );
}
