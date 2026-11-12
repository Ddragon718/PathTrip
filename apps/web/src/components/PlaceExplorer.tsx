'use client';
import { useState, type ComponentProps } from 'react';
import { PlaceDiscovery } from './PlaceDiscovery';
import { VisitorRecommendations } from './VisitorRecommendations';

export function PlaceExplorer(props: ComponentProps<typeof PlaceDiscovery>) {
  const [tab, setTab] = useState('places');
  const [search, setSearch] =
    useState<ComponentProps<typeof PlaceDiscovery>['initialSearch']>(null);
  return (
    <>
      <div className="discovery-chips" role="tablist" aria-label="추천 종류">
        <button
          role="tab"
          aria-selected={tab === 'places'}
          aria-pressed={tab === 'places'}
          onClick={() => {
            setSearch(null);
            setTab('places');
          }}
        >
          장소 추천
        </button>
        <button
          role="tab"
          aria-selected={tab === 'visitors'}
          aria-pressed={tab === 'visitors'}
          onClick={() => setTab('visitors')}
        >
          방문자 추천
        </button>
      </div>
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
    </>
  );
}
