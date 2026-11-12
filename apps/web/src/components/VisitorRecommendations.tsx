'use client';

import { useEffect, useState } from 'react';
import {
  ApiError,
  discoveryCategories,
  type CommunityRegion,
  type PathTripClient,
  type PlaceCategory,
  type VisitorRecommendationList,
} from '@pathtrip/api-client';
import { getVisitLocation } from '../lib/visit-location';

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
    <div className="discovery">
      <div>
        <h3>{region} 방문자가 추천해요</h3>
        <p>
          이 지역에서 위치를 인증한 여행자의 추천입니다. 거주자 인증은 아니에요.
        </p>
      </div>
      {isDemo ? (
        <div className="discovery-card">
          <h3>첫 방문자의 이야기를 기다려요</h3>
          <p>
            로그인 후 현재 위치를 인증하면 추천을 남길 수 있어요. 미리보기에는
            실제 방문자 글을 표시하지 않습니다.
          </p>
        </div>
      ) : (
        <>
          {area && (
            <div className="discovery-card">
              <h3>인증 지역 · {area.label}</h3>
              <span className="google-attribution" translate="no">
                Google Maps
              </span>
              <p>방문하려는 지역이 맞는지 확인해 주세요.</p>
            </div>
          )}
          <div className="discovery-chips">
            {discoveryCategories.map((item) => (
              <button
                key={item.value}
                disabled={!!action}
                aria-pressed={category === item.value}
                onClick={() => {
                  setCategory(item.value);
                  setPage(1);
                }}
              >
                {item.label}
              </button>
            ))}
          </div>
          {busy && <p role="status">방문자 추천을 불러오고 있어요…</p>}
          {error && <p role="alert">{error}</p>}
          {notice && <p role="status">{notice}</p>}
          {!busy && (
            <button
              className="button button-secondary"
              disabled={!!action}
              onClick={() => setAttempt((n) => n + 1)}
            >
              목록 새로고침
            </button>
          )}
          {area && (
            <div className="discovery-card">
              <h3>
                {verified
                  ? '방문 인증 완료'
                  : '직접 방문했다면 추천을 남겨주세요'}
              </h3>
              {verified ? (
                <p>
                  {new Date(expiresAt!).toLocaleString('ko-KR')}까지 등록할 수
                  있어요.
                </p>
              ) : (
                <>
                  <p>
                    인증을 누르면 현재 위치와 정확도를 PathTrip 서버와 Google에
                    보내 지역을 확인합니다. 정확한 좌표는 DB에 저장하지 않으며
                    인증은 24시간 유효합니다.
                  </p>
                  <label className="visitor-consent">
                    <input
                      type="checkbox"
                      checked={consent}
                      onChange={(event) => setConsent(event.target.checked)}
                    />{' '}
                    위 위치 전송에 동의합니다
                  </label>
                  <button
                    className="button button-primary"
                    disabled={!consent || !!action}
                    onClick={() =>
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
                    {action || '현재 위치로 방문 인증'}
                  </button>
                </>
              )}
              {verified && (
                <form
                  className="visitor-form"
                  onSubmit={(event) => {
                    event.preventDefault();
                    void perform('등록 중…', async () => {
                      await api.createVisitorRecommendation({
                        regionId: area.id,
                        category,
                        placeName: name.trim(),
                        ...(address.trim() ? { address: address.trim() } : {}),
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
                    });
                  }}
                >
                  <p>
                    현재 분류:{' '}
                    {
                      discoveryCategories.find(
                        (item) => item.value === category
                      )?.label
                    }{' '}
                    · 직접 경험한 장소와 이유를 적어주세요.
                  </p>
                  <label>
                    추천 장소명
                    <input
                      value={name}
                      onChange={(event) => setName(event.target.value)}
                      maxLength={150}
                      required
                    />
                  </label>
                  <label>
                    주소 (선택)
                    <input
                      value={address}
                      onChange={(event) => setAddress(event.target.value)}
                      maxLength={300}
                    />
                  </label>
                  <label>
                    추천 이유와 방문 팁
                    <textarea
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      minLength={10}
                      maxLength={1000}
                      rows={4}
                      required
                    />
                  </label>
                  <button
                    className="button button-primary"
                    type="submit"
                    disabled={
                      !!action || !name.trim() || note.trim().length < 10
                    }
                  >
                    {action || '방문자 추천 등록'}
                  </button>
                </form>
              )}
            </div>
          )}
          {data && (
            <p className="discovery-note">
              최신 등록순 · {data.total}개의 추천
            </p>
          )}
          {!busy && data?.items.length === 0 && (
            <p>아직 이 분류의 추천이 없어요. 첫 방문 팁을 남겨보세요.</p>
          )}
          {data?.items.map((item) => (
            <article key={item.id} className="discovery-card">
              <h3>{item.placeName}</h3>
              {item.address && <p>{item.address}</p>}
              <span className="discovery-stats">
                ✓ 작성 당시 방문 인증 ·{' '}
                {new Date(item.verifiedAt).toLocaleDateString('ko-KR')}
              </span>
              <p className="visitor-note">{item.note}</p>
              <p className="discovery-note">
                {item.author} ·{' '}
                {new Date(item.createdAt).toLocaleDateString('ko-KR')}
              </p>
              <button
                className="button button-secondary"
                onClick={() => onFindPlace(item.placeName, item.category)}
              >
                이 장소 찾아서 여행에 담기
              </button>
              {item.canDelete && (
                <button
                  className="button button-secondary"
                  disabled={!!action}
                  onClick={() => {
                    if (window.confirm('이 추천을 삭제할까요?'))
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
                      });
                  }}
                >
                  추천 삭제
                </button>
              )}
            </article>
          ))}
          {data && data.totalPages > 1 && (
            <div className="discovery-actions">
              <button
                className="button button-secondary"
                disabled={page === 1 || busy || !!action}
                onClick={() => setPage((p) => p - 1)}
              >
                이전
              </button>
              <span>
                {page} / {data.totalPages}
              </span>
              <button
                className="button button-secondary"
                disabled={page >= data.totalPages || busy || !!action}
                onClick={() => setPage((p) => p + 1)}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
