'use client';

import { useEffect, useState } from 'react';
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
    <div className="discovery">
      <div>
        <h3>{region}, 어디부터 가볼까요?</h3>
        <p>장소 이름을 몰라도 괜찮아요. 관심 있는 분류를 골라보세요.</p>
      </div>
      <div className="discovery-chips" aria-label="추천 분류">
        {discoveryCategories.map((item) => (
          <button
            key={item.value}
            aria-pressed={category === item.value}
            onClick={() => {
              setCategory(item.value);
              setKeyword('');
              setQuery('');
            }}
          >
            {item.label}
          </button>
        ))}
      </div>
      <form
        className="discovery-search"
        onSubmit={(event) => {
          event.preventDefault();
          setKeyword(query.trim());
          setAttempt((n) => n + 1);
        }}
      >
        <input
          aria-label="추천 장소 검색어"
          placeholder="이 지역에서 더 찾아보기"
          maxLength={100}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
        <button className="button button-primary" type="submit">
          검색
        </button>
      </form>
      {provider === 'GOOGLE' && !isDemo && (
        <div className="discovery-chips">
          {(['REVIEWS', 'RATING', 'RELEVANCE'] as const).map((value, index) => (
            <button
              key={value}
              aria-pressed={sort === value}
              onClick={() => setSort(value)}
            >
              {['리뷰 많은 순', '평점순', '관련도순'][index]}
            </button>
          ))}
        </div>
      )}
      {data && <p className="discovery-note">{data.note}</p>}
      {busy && <p role="status">{region}의 추천 장소를 찾고 있어요…</p>}
      {error && (
        <div role="alert">
          <p>{error}</p>
          <button
            className="button button-secondary"
            onClick={() => setAttempt((n) => n + 1)}
          >
            다시 불러오기
          </button>
        </div>
      )}
      {!busy && data?.items.length === 0 && (
        <div className="discovery-empty">
          <h3>아직 표시할 장소가 없어요</h3>
          <p>
            {isDemo
              ? '이 지역의 샘플은 준비되지 않았어요. 실제 추천은 로그인 후 API 연결이 필요해요.'
              : '다른 분류를 선택하거나 도시·지역 이름을 더 구체적으로 설정해 보세요.'}
          </p>
        </div>
      )}
      <div className="discovery-list">
        {data?.items.map((place, index) => (
          <article key={place.id} className="discovery-card">
            <div className="discovery-card-heading">
              <span className="discovery-number">{index + 1}</span>
              <div>
                <h3>{place.name}</h3>
                <p>{place.address}</p>
              </div>
            </div>
            <div className="discovery-stats">
              {place.source === 'DEMO'
                ? '미리보기 샘플'
                : `★ ${place.rating ?? '평점 정보 없음'} · ${place.reviewCount === null ? '리뷰 수 미제공' : `리뷰 ${place.reviewCount.toLocaleString()}개`}`}
            </div>
            {place.source === 'GOOGLE' && (
              <span className="google-attribution" translate="no">
                Google Maps
              </span>
            )}
            {place.attributions.map((attribution, n) => (
              <span className="discovery-note" key={n}>
                {attribution.provider}
              </span>
            ))}
            <div className="discovery-actions">
              {place.sourceUrl && (
                <a href={place.sourceUrl} target="_blank" rel="noreferrer">
                  상세·리뷰 보기 ↗
                </a>
              )}
              <button
                className="button button-primary"
                disabled={saving !== null}
                aria-label={`${place.name} 여행에 담기`}
                onClick={async () => {
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
                {saving === place.id ? '담는 중…' : '+ 여행에 담기'}
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
