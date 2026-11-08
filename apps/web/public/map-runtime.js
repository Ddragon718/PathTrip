/* Shared map surface for the website and the iOS Kakao WebView. No auth tokens enter this page. */
(() => {
  const config = JSON.parse(document.getElementById('map-config').textContent);
  const status = document.getElementById('status');
  let map;
  let overlays = [];
  let payload = { points: [], connect: false };
  let googleMarker;
  const notify = (type) => {
    const message = { type };
    window.parent.postMessage(message, window.location.origin);
    window.ReactNativeWebView?.postMessage(JSON.stringify(message));
  };
  const fail = (
    message = '지도를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'
  ) => {
    status.textContent = message;
    status.hidden = false;
    notify('PATHTRIP_MAP_ERROR');
  };
  function render() {
    if (!map) return;
    overlays.forEach((overlay) => {
      if (typeof overlay.setMap === 'function') overlay.setMap(null);
      else overlay.map = null;
    });
    overlays = [];
    const points = payload.points;
    if (!points.length) return;
    if (config.provider === 'KAKAO') {
      const sdk = window.kakao.maps;
      const bounds = new sdk.LatLngBounds();
      const path = points.map(
        (point) => new sdk.LatLng(point.latitude, point.longitude)
      );
      path.forEach((position, index) => {
        bounds.extend(position);
        const content = document.createElement('div');
        content.className = 'pin';
        content.textContent = String(index + 1);
        content.title = points[index].name;
        overlays.push(
          new sdk.CustomOverlay({ map, position, content, yAnchor: 1 })
        );
      });
      if (payload.connect && path.length > 1)
        overlays.push(
          new sdk.Polyline({
            map,
            path,
            strokeWeight: 4,
            strokeColor: '#ED734B',
            strokeOpacity: 0.9,
            strokeStyle: 'dash',
          })
        );
      if (path.length === 1) {
        map.setCenter(path[0]);
        map.setLevel(4);
      } else map.setBounds(bounds, 45, 35, 45, 35);
    } else {
      const sdk = window.google.maps;
      const bounds = new sdk.LatLngBounds();
      const path = points.map((point) => ({
        lat: point.latitude,
        lng: point.longitude,
      }));
      path.forEach((position, index) => {
        bounds.extend(position);
        const content = document.createElement('div');
        content.className = 'pin';
        content.textContent = String(index + 1);
        overlays.push(
          new googleMarker({
            map,
            position,
            content,
            title: points[index].name,
          })
        );
      });
      if (payload.connect && path.length > 1)
        overlays.push(
          new sdk.Polyline({
            map,
            path,
            strokeColor: '#ED734B',
            strokeWeight: 4,
          })
        );
      if (path.length === 1) {
        map.setCenter(path[0]);
        map.setZoom(13);
      } else map.fitBounds(bounds, 45);
    }
  }
  function receive(event) {
    // Browser frames only accept their own same-origin parent. RN postMessage has no source.
    if (
      event.source &&
      (event.source !== window.parent ||
        event.origin !== window.location.origin)
    )
      return;
    let data;
    try {
      data =
        typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
    } catch {
      return;
    }
    if (
      data?.type !== 'PATHTRIP_MAP_DATA' ||
      !Array.isArray(data.points) ||
      data.points.length > 500
    )
      return;
    if (
      !data.points.every(
        (point) =>
          point &&
          typeof point.name === 'string' &&
          Number.isFinite(point.latitude) &&
          Math.abs(point.latitude) <= 90 &&
          Number.isFinite(point.longitude) &&
          Math.abs(point.longitude) <= 180
      )
    )
      return;
    payload = { points: data.points, connect: data.connect === true };
    try {
      render();
    } catch {
      fail();
    }
  }
  window.addEventListener('message', receive);
  document.addEventListener('message', receive);
  const timeout = setTimeout(() => fail(), 15000);
  async function ready() {
    try {
      const overseas = config.destination === 'INTERNATIONAL';
      if (config.provider === 'KAKAO') {
        map = new window.kakao.maps.Map(document.getElementById('map'), {
          center: new window.kakao.maps.LatLng(36.2, 127.8),
          level: 13,
        });
      } else {
        const { AdvancedMarkerElement } =
          await window.google.maps.importLibrary('marker');
        googleMarker = AdvancedMarkerElement;
        map = new window.google.maps.Map(document.getElementById('map'), {
          center: overseas ? { lat: 20, lng: 0 } : { lat: 36.2, lng: 127.8 },
          zoom: overseas ? 2 : 7,
          mapId: config.mapId,
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',
        });
      }
      clearTimeout(timeout);
      status.hidden = true;
      render();
      notify('PATHTRIP_MAP_READY');
    } catch {
      clearTimeout(timeout);
      fail();
    }
  }
  window.gm_authFailure = () => {
    clearTimeout(timeout);
    fail();
  };
  if (!config.key) {
    clearTimeout(timeout);
    fail(
      `${config.provider === 'KAKAO' ? '카카오맵' : 'Google Maps'} 연결을 준비 중이에요. 장소 목록은 계속 이용할 수 있어요.`
    );
    return;
  }
  const script = document.createElement('script');
  script.async = true;
  script.onerror = () => {
    clearTimeout(timeout);
    fail();
  };
  if (config.provider === 'KAKAO') {
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(config.key)}&autoload=false`;
    script.onload = () => {
      if (!window.kakao?.maps) {
        clearTimeout(timeout);
        fail();
        return;
      }
      window.kakao.maps.load(ready);
    };
  } else {
    window.pathtripGoogleReady = ready;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(config.key)}&loading=async&callback=pathtripGoogleReady&v=weekly`;
  }
  document.head.appendChild(script);
})();
