import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';

const source = readFileSync(
  new URL('../../apps/web/public/map-runtime.js', import.meta.url),
  'utf8'
);

// A tiny SDK/DOM harness: no external map requests, credentials or browser state.
function harness(provider, key = 'fake-test-key', disabledMessage = '') {
  const status = { hidden: false, textContent: '' };
  const scripts = [];
  const messages = [];
  const listeners = {};
  const overlays = [];
  const maps = [];
  const parent = { postMessage: (message) => messages.push(message) };
  class Map {
    constructor(_, options) {
      this.options = options;
      maps.push(this);
    }
    setCenter(center) {
      this.center = center;
    }
    setLevel(level) {
      this.level = level;
    }
    setZoom(zoom) {
      this.zoom = zoom;
    }
    setBounds(bounds) {
      this.bounds = bounds;
    }
    fitBounds(bounds) {
      this.bounds = bounds;
    }
  }
  class Overlay {
    constructor(options) {
      Object.assign(this, options);
      overlays.push(this);
    }
    setMap(map) {
      this.map = map;
    }
  }
  class AdvancedMarker {
    constructor(options) {
      Object.assign(this, options);
      overlays.push(this);
    }
  }
  class Bounds {
    points = [];
    extend(point) {
      this.points.push(point);
    }
  }
  const config = {
    provider,
    key,
    disabledMessage,
    destination: 'INTERNATIONAL',
    mapId: 'DEMO_MAP_ID',
  };
  const window = {
    parent,
    location: { origin: 'https://pathtrip.test' },
    addEventListener: (name, handler) => {
      listeners[name] = handler;
    },
    kakao: {
      maps: {
        Map,
        CustomOverlay: Overlay,
        Polyline: Overlay,
        LatLngBounds: Bounds,
        LatLng: class {
          constructor(lat, lng) {
            this.lat = lat;
            this.lng = lng;
          }
        },
        load: (fn) => fn(),
      },
    },
    google: {
      maps: {
        Map,
        Polyline: Overlay,
        LatLngBounds: Bounds,
        importLibrary: async () => ({ AdvancedMarkerElement: AdvancedMarker }),
      },
    },
  };
  const document = {
    getElementById: (id) =>
      id === 'map-config'
        ? { textContent: JSON.stringify(config) }
        : id === 'status'
          ? status
          : {},
    createElement: () => ({}),
    addEventListener: () => {},
    head: { appendChild: (script) => scripts.push(script) },
  };
  vm.runInNewContext(source, {
    window,
    document,
    setTimeout: () => 1,
    clearTimeout: () => {},
  });
  return {
    status,
    scripts,
    messages,
    overlays,
    maps,
    ready: () =>
      provider === 'GOOGLE'
        ? window.pathtripGoogleReady()
        : scripts[0].onload(),
    receive: (points, extra = {}) =>
      listeners.message({
        source: parent,
        origin: window.location.origin,
        data: { type: 'PATHTRIP_MAP_DATA', points, connect: true },
        ...extra,
      }),
  };
}

const points = [
  { name: '<script>not HTML</script>', latitude: 35.7148, longitude: 139.7967 },
  { name: 'Tokyo Station', latitude: 35.6812, longitude: 139.7671 },
];

for (const provider of ['KAKAO', 'GOOGLE']) {
  test(`${provider}: 비용 보호 중에는 키가 있어도 SDK 스크립트와 지도를 생성하지 않는다`, () => {
    const map = harness(provider, 'fake-test-key', '비용 보호 중');
    assert.equal(map.scripts.length, 0);
    assert.equal(map.maps.length, 0);
    assert.equal(map.status.textContent, '비용 보호 중');
    assert.equal(map.messages[0].type, 'PATHTRIP_MAP_ERROR');
  });

  test(`${provider}: 키 누락 시 외부 SDK를 요청하지 않고 안내한다`, () => {
    const map = harness(provider, '');
    assert.equal(map.scripts.length, 0);
    assert.equal(map.status.hidden, false);
    assert.match(map.status.textContent, /연결을 준비/);
    assert.equal(map.messages[0].type, 'PATHTRIP_MAP_ERROR');
  });

  test(`${provider}: 준비 전 좌표를 보관하고 마커·연결선을 교체하며 외부 메시지는 거부한다`, async () => {
    const map = harness(provider);
    map.receive(points);
    assert.equal(map.overlays.length, 0);
    await map.ready();
    assert.equal(map.status.hidden, true);
    assert.equal(map.messages.at(-1).type, 'PATHTRIP_MAP_READY');
    assert.equal(map.overlays.length, 3);
    assert.equal(map.maps[0].bounds.points.length, 2);
    assert.equal(map.overlays[0].content.textContent, '1');
    assert.equal(map.overlays[0].content.innerHTML, undefined);
    map.receive([points[0]], { origin: 'https://untrusted.test' });
    map.receive([{ ...points[0], latitude: 999 }]);
    assert.equal(map.overlays.length, 3);
    map.receive([points[0]], {
      source: null,
      data: JSON.stringify({
        type: 'PATHTRIP_MAP_DATA',
        points: [points[0]],
        connect: false,
      }),
    });
    assert.equal(map.overlays.length, 4);
    assert.ok(
      map.overlays.slice(0, 3).every((overlay) => overlay.map === null)
    );
    assert.ok(map.maps[0].center);
    map.receive([]);
    assert.equal(map.overlays[3].map, null);
  });
}
