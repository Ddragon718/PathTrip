import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  discoveryCategories,
  discoveryPlaceInput,
  previewDiscovery,
  type CreatePlaceInput,
  type DiscoveryInput,
  type DiscoveryResult,
  type MapProvider,
  type PathTripClient,
  type PlaceCategory,
} from '@pathtrip/api-client';
import { AppPressable as Pressable } from './AppPressable';
import { discoveryStyles as s } from './discovery-styles';

type Props = {
  region: string;
  provider: MapProvider;
  isDemo: boolean;
  api: PathTripClient;
  onSubmit: (input: CreatePlaceInput) => Promise<void>;
  initialSearch?: { name: string; category: PlaceCategory } | null;
};
const message = (error: unknown) =>
  error instanceof Error ? error.message : '다시 시도해 주세요.';

export function PlaceDiscovery({
  region,
  provider,
  isDemo,
  api,
  onSubmit,
  initialSearch,
}: Props) {
  const [category, setCategory] = useState<PlaceCategory>(
    initialSearch?.category ?? 'TOURIST_SPOT'
  );
  const [sort, setSort] =
    useState<NonNullable<DiscoveryInput['sort']>>('REVIEWS');
  const [query, setQuery] = useState(initialSearch?.name ?? '');
  const [keyword, setKeyword] = useState(initialSearch?.name ?? '');
  const [attempt, setAttempt] = useState(0);
  const [data, setData] = useState<DiscoveryResult | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setBusy(true);
    setError('');
    setData(null);
    const input = { region, provider, category, sort, q: keyword };
    (isDemo
      ? Promise.resolve(previewDiscovery(input))
      : api.discoverPlaces(input)
    )
      .then((result) => {
        if (active) setData(result);
      })
      .catch((caught) => {
        if (active) setError(message(caught));
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [region, provider, category, sort, keyword, attempt, isDemo, api]);

  return (
    <View style={s.root}>
      <Text style={s.heading}>{region}, 어디부터 가볼까요?</Text>
      <Text style={s.muted}>
        장소 이름을 몰라도 괜찮아요. 관심 있는 분류를 골라보세요.
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.chips}
      >
        {discoveryCategories.map((item) => (
          <Pressable
            key={item.value}
            hitSlop={0}
            accessibilityRole="button"
            accessibilityState={{ selected: category === item.value }}
            onPress={() => {
              setCategory(item.value);
              setKeyword('');
              setQuery('');
            }}
            style={[s.chip, category === item.value && s.active]}
          >
            <Text style={s.chipText}>{item.label}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={s.row}>
        <TextInput
          accessibilityLabel="추천 장소 검색어"
          placeholder="이 지역에서 더 찾아보기"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => {
            setKeyword(query.trim());
            setAttempt((n) => n + 1);
          }}
          style={s.input}
          returnKeyType="search"
        />
        <Pressable
          style={s.button}
          accessibilityRole="button"
          onPress={() => {
            setKeyword(query.trim());
            setAttempt((n) => n + 1);
          }}
        >
          <Text style={s.white}>검색</Text>
        </Pressable>
      </View>
      {provider === 'GOOGLE' && !isDemo && (
        <View style={s.chips}>
          {(['REVIEWS', 'RATING', 'RELEVANCE'] as const).map((value, index) => (
            <Pressable
              key={value}
              style={[s.smallChip, sort === value && s.active]}
              accessibilityRole="button"
              accessibilityState={{ selected: sort === value }}
              onPress={() => setSort(value)}
            >
              <Text style={s.chipText}>
                {['리뷰 많은 순', '평점순', '관련도순'][index]}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
      {data && <Text style={s.note}>{data.note}</Text>}
      {busy && (
        <View style={s.empty}>
          <ActivityIndicator color="#173E35" />
          <Text style={s.muted}>{region}의 추천 장소를 찾고 있어요…</Text>
        </View>
      )}
      {error ? (
        <View style={s.empty}>
          <Text accessibilityRole="alert" style={s.error}>
            {error}
          </Text>
          <Pressable onPress={() => setAttempt((n) => n + 1)} style={s.chip}>
            <Text>다시 불러오기</Text>
          </Pressable>
        </View>
      ) : null}
      {!busy && data?.items.length === 0 && (
        <View style={s.empty}>
          <Text style={s.heading}>아직 표시할 장소가 없어요</Text>
          <Text style={s.muted}>
            {isDemo
              ? '이 지역의 샘플은 준비되지 않았어요. 실제 추천은 로그인 후 API 연결이 필요해요.'
              : '다른 분류를 선택하거나 도시·지역 이름을 더 구체적으로 설정해 보세요.'}
          </Text>
        </View>
      )}
      {data?.items.map((place, index) => (
        <View key={place.id} style={s.card}>
          <View style={s.row}>
            <View style={s.number}>
              <Text style={s.chipText}>{index + 1}</Text>
            </View>
            <View style={s.copy}>
              <Text style={s.name}>{place.name}</Text>
              <Text style={s.muted}>{place.address}</Text>
            </View>
          </View>
          <Text style={s.stats}>
            {place.source === 'DEMO'
              ? '미리보기 샘플'
              : `★ ${place.rating ?? '평점 정보 없음'}  ·  ${place.reviewCount === null ? '리뷰 수 미제공' : `리뷰 ${place.reviewCount.toLocaleString()}개`}`}
          </Text>
          {place.source === 'GOOGLE' && (
            <Text style={s.google}>Google Maps</Text>
          )}
          {place.attributions.map((attribution, n) => (
            <Text key={n} style={s.note}>
              {attribution.provider}
            </Text>
          ))}
          <View style={s.row}>
            {place.sourceUrl && (
              <Pressable
                accessibilityRole="link"
                style={s.link}
                onPress={() => {
                  void Linking.openURL(place.sourceUrl!).catch(() =>
                    setError('장소 링크를 열지 못했어요.')
                  );
                }}
              >
                <Text style={s.muted}>상세·리뷰 보기 ↗</Text>
              </Pressable>
            )}
            <Pressable
              style={[s.button, s.add]}
              accessibilityRole="button"
              accessibilityLabel={`${place.name} 여행에 담기`}
              disabled={saving !== null}
              onPress={async () => {
                setSaving(place.id);
                try {
                  await onSubmit(discoveryPlaceInput(place));
                } catch (caught) {
                  setError(message(caught));
                } finally {
                  setSaving(null);
                }
              }}
            >
              <Text style={s.white}>
                {saving === place.id ? '담는 중…' : '+ 여행에 담기'}
              </Text>
            </Pressable>
          </View>
        </View>
      ))}
    </View>
  );
}
