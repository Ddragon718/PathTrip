import { NextRequest } from 'next/server';
import { buildMapConfig } from '@/lib/map-config';

export const dynamic = 'force-dynamic';

export function GET(request: NextRequest) {
  const provider =
    request.nextUrl.searchParams.get('provider') === 'GOOGLE'
      ? 'GOOGLE'
      : 'KAKAO';
  const destination =
    request.nextUrl.searchParams.get('destination') === 'INTERNATIONAL'
      ? 'INTERNATIONAL'
      : 'DOMESTIC';
  const config = JSON.stringify(
    buildMapConfig(provider, destination, process.env)
  ).replace(/</g, '\\u003c');
  return new Response(
    `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>PathTrip 지도</title>
<style>html,body,#map{width:100%;height:100%;margin:0}body{background:#F5F1E8;font-family:system-ui,sans-serif;color:#173E35}#status{position:absolute;inset:0;display:grid;place-content:center;text-align:center;padding:28px;background:#F5F1E8;z-index:10;font-size:14px;line-height:1.7}#status[hidden]{display:none}.pin{border:3px solid #fff;background:#173E35;color:#fff;border-radius:50%;width:30px;height:30px;display:grid;place-items:center;font-size:13px;font-weight:800;box-shadow:0 3px 9px #0003}</style></head><body><div id="map" aria-label="여행 장소 지도"></div><div id="status" role="status">지도를 불러오는 중이에요…</div><script id="map-config" type="application/json">${config}</script><script src="/map-runtime.js"></script></body></html>`,
    {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin',
      },
    }
  );
}
