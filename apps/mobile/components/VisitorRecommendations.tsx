import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  ApiError,
  discoveryCategories,
  type CommunityRegion,
  type PathTripClient,
  type PlaceCategory,
  type VisitorRecommendationList,
} from '@pathtrip/api-client';
import { AppPressable as Pressable } from './AppPressable';
import { discoveryStyles as s } from './discovery-styles';
import { getVisitLocation } from '../lib/visit-location';
import { Alert } from '../lib/dialogs';

type Props = {
  region: string;
  isDemo: boolean;
  api: PathTripClient;
  onFindPlace: (name: string, category: PlaceCategory) => void;
};
const message = (error: unknown) =>
  error instanceof Error ? error.message : '요청을 처리하지 못했어요.';

export function VisitorRecommendations({
  region,
  isDemo,
  api,
  onFindPlace,
}: Props) {
  const [area, setArea] = useState<CommunityRegion | null>(null);
  const [category, setCategory] = useState<PlaceCategory>('TOURIST_SPOT');
  const [data, setData] = useState<VisitorRecommendationList | null>(null);
  const [page, setPage] = useState(1);
  const [attempt, setAttempt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [action, setAction] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [consent, setConsent] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [note, setNote] = useState('');
  useEffect(() => {
    let active = true;
    setArea(null);
    setExpiresAt(null);
    setConsent(false);
    setError('');
    if (isDemo) return;
    setBusy(true);
    api
      .resolveCommunityRegion(region)
      .then((result) => {
        if (active) setArea(result);
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
  }, [region, isDemo, api, attempt]);
  useEffect(() => {
    let active = true;
    setData(null);
    if (!area) return;
    setBusy(true);
    setError('');
    api
      .listVisitorRecommendations(area.id, category, page)
      .then((result) => {
        if (active) {
          setData(result);
          setExpiresAt(result.verification?.expiresAt ?? null);
        }
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
  }, [area, category, page, api]);
  useEffect(() => {
    if (!expiresAt) return;
    const timer = setTimeout(
      () => setExpiresAt(null),
      Math.max(0, Date.parse(expiresAt) - Date.now())
    );
    return () => clearTimeout(timer);
  }, [expiresAt]);
  const verified = expiresAt !== null && Date.parse(expiresAt) > Date.now();
  const perform = async (label: string, task: () => Promise<void>) => {
    if (action) return;
    setAction(label);
    setError('');
    setNotice('');
    try {
      await task();
    } catch (caught) {
      setError(message(caught));
      if (
        caught instanceof ApiError &&
        caught.code === 'VISIT_VERIFICATION_REQUIRED'
      )
        setExpiresAt(null);
    } finally {
      setAction('');
    }
  };
  return (
    <View style={s.root}>
      <Text style={s.heading}>{region} 방문자가 추천해요</Text>
      <Text style={s.muted}>
        이 지역에서 위치를 인증한 여행자의 추천입니다. 거주자 인증은 아니에요.
      </Text>
      {isDemo ? (
        <View style={s.card}>
          <Text style={s.name}>첫 방문자의 이야기를 기다려요</Text>
          <Text style={s.muted}>
            로그인 후 현재 위치를 인증하면 추천을 남길 수 있어요. 미리보기에는
            실제 방문자 글을 표시하지 않습니다.
          </Text>
        </View>
      ) : (
        <>
          {area && (
            <View style={s.card}>
              <Text style={s.name}>인증 지역 · {area.label}</Text>
              <Text style={s.google}>Google Maps</Text>
              <Text style={s.note}>
                방문하려는 지역이 맞는지 확인해 주세요.
              </Text>
            </View>
          )}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={s.chips}
          >
            {discoveryCategories.map((item) => (
              <Pressable
                key={item.value}
                hitSlop={0}
                style={[s.chip, category === item.value && s.active]}
                accessibilityRole="button"
                accessibilityState={{ selected: category === item.value }}
                disabled={!!action}
                onPress={() => {
                  setCategory(item.value);
                  setPage(1);
                }}
              >
                <Text style={s.chipText}>{item.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          {busy && <ActivityIndicator color="#173E35" />}
          {error ? (
            <Text accessibilityRole="alert" style={s.error}>
              {error}
            </Text>
          ) : null}
          {notice ? (
            <Text accessibilityLiveRegion="polite" style={s.stats}>
              {notice}
            </Text>
          ) : null}
          {!busy && (
            <Pressable
              style={s.chip}
              onPress={() => setAttempt((n) => n + 1)}
              disabled={!!action}
              accessibilityRole="button"
            >
              <Text style={s.chipText}>목록 새로고침</Text>
            </Pressable>
          )}
          {area && (
            <View style={s.card}>
              <Text style={s.name}>
                {verified
                  ? '방문 인증 완료'
                  : '직접 방문했다면 추천을 남겨주세요'}
              </Text>
              {verified ? (
                <Text style={s.note}>
                  {new Date(expiresAt!).toLocaleString('ko-KR')}까지 등록할 수
                  있어요.
                </Text>
              ) : (
                <>
                  <Text style={s.muted}>
                    인증을 누르면 현재 위치와 정확도를 PathTrip 서버와 Google에
                    보내 지역을 확인합니다. 정확한 좌표는 DB에 저장하지 않으며
                    인증은 24시간 유효합니다.
                  </Text>
                  <Pressable
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: consent }}
                    style={s.smallChip}
                    onPress={() => setConsent((value) => !value)}
                  >
                    <Text style={s.chipText}>
                      {consent ? '☑' : '☐'} 위 위치 전송에 동의합니다
                    </Text>
                  </Pressable>
                  <Pressable
                    style={[
                      s.button,
                      (!consent || !!action) && { opacity: 0.45 },
                    ]}
                    accessibilityRole="button"
                    disabled={!consent || !!action}
                    onPress={() =>
                      void perform('위치 확인 중…', async () => {
                        const location = await getVisitLocation();
                        const result = await api.verifyRegionVisit(
                          area.id,
                          location
                        );
                        setExpiresAt(result.expiresAt);
                        setNotice('이 지역의 방문 인증이 완료됐어요.');
                      })
                    }
                  >
                    <Text style={s.white}>
                      {action || '현재 위치로 방문 인증'}
                    </Text>
                  </Pressable>
                </>
              )}
              {verified && (
                <>
                  <Text style={s.note}>
                    현재 분류:{' '}
                    {
                      discoveryCategories.find(
                        (item) => item.value === category
                      )?.label
                    }{' '}
                    · 직접 경험한 장소와 이유를 적어주세요.
                  </Text>
                  <TextInput
                    style={s.input}
                    accessibilityLabel="추천 장소명"
                    placeholder="추천 장소명"
                    value={name}
                    onChangeText={setName}
                    maxLength={150}
                  />
                  <TextInput
                    style={s.input}
                    accessibilityLabel="추천 장소 주소"
                    placeholder="주소 (선택)"
                    value={address}
                    onChangeText={setAddress}
                    maxLength={300}
                  />
                  <TextInput
                    style={[
                      s.input,
                      { minHeight: 100, textAlignVertical: 'top' },
                    ]}
                    accessibilityLabel="추천 이유"
                    placeholder="추천 이유와 방문 팁 (10자 이상)"
                    value={note}
                    onChangeText={setNote}
                    multiline
                    maxLength={1000}
                  />
                  <Pressable
                    accessibilityRole="button"
                    style={[
                      s.button,
                      (!!action || !name.trim() || note.trim().length < 10) && {
                        opacity: 0.45,
                      },
                    ]}
                    disabled={
                      !!action || !name.trim() || note.trim().length < 10
                    }
                    onPress={() =>
                      void perform('등록 중…', async () => {
                        await api.createVisitorRecommendation({
                          regionId: area.id,
                          category,
                          placeName: name.trim(),
                          ...(address.trim()
                            ? { address: address.trim() }
                            : {}),
                          note: note.trim(),
                        });
                        setName('');
                        setAddress('');
                        setNote('');
                        setPage(1);
                        setData(
                          await api.listVisitorRecommendations(
                            area.id,
                            category,
                            1
                          )
                        );
                        setNotice('추천을 등록했어요.');
                      })
                    }
                  >
                    <Text style={s.white}>{action || '방문자 추천 등록'}</Text>
                  </Pressable>
                </>
              )}
            </View>
          )}
          {data && (
            <Text style={s.note}>최신 등록순 · {data.total}개의 추천</Text>
          )}
          {!busy && data?.items.length === 0 && (
            <Text style={s.muted}>
              아직 이 분류의 추천이 없어요. 첫 방문 팁을 남겨보세요.
            </Text>
          )}
          {data?.items.map((item) => (
            <View key={item.id} style={s.card}>
              <Text style={s.name}>{item.placeName}</Text>
              {item.address && <Text style={s.muted}>{item.address}</Text>}
              <Text style={s.stats}>
                ✓ 작성 당시 방문 인증 ·{' '}
                {new Date(item.verifiedAt).toLocaleDateString('ko-KR')}
              </Text>
              <Text style={s.muted}>{item.note}</Text>
              <Text style={s.note}>
                {item.author} ·{' '}
                {new Date(item.createdAt).toLocaleDateString('ko-KR')}
              </Text>
              <Pressable
                style={s.chip}
                accessibilityRole="button"
                onPress={() => onFindPlace(item.placeName, item.category)}
              >
                <Text style={s.chipText}>이 장소 찾아서 여행에 담기</Text>
              </Pressable>
              {item.canDelete && (
                <Pressable
                  style={s.smallChip}
                  disabled={!!action}
                  onPress={() =>
                    Alert.alert('추천 삭제', '이 추천을 삭제할까요?', [
                      { text: '취소', style: 'cancel' },
                      {
                        text: '삭제',
                        style: 'destructive',
                        onPress: () =>
                          void perform('삭제 중…', async () => {
                            await api.deleteVisitorRecommendation(item.id);
                            if (page > 1 && data.items.length === 1)
                              setPage(page - 1);
                            else
                              setData(
                                await api.listVisitorRecommendations(
                                  area!.id,
                                  category,
                                  page
                                )
                              );
                          }),
                      },
                    ])
                  }
                >
                  <Text style={s.error}>추천 삭제</Text>
                </Pressable>
              )}
            </View>
          ))}
          {data && data.totalPages > 1 && (
            <View style={s.row}>
              <Pressable
                style={s.chip}
                disabled={page === 1 || busy || !!action}
                onPress={() => setPage((p) => p - 1)}
              >
                <Text>이전</Text>
              </Pressable>
              <Text>
                {page} / {data.totalPages}
              </Text>
              <Pressable
                style={s.chip}
                disabled={page >= data.totalPages || busy || !!action}
                onPress={() => setPage((p) => p + 1)}
              >
                <Text>다음</Text>
              </Pressable>
            </View>
          )}
        </>
      )}
    </View>
  );
}
