import {
  existsSync,
  readFileSync,
  appendFileSync,
  writeFileSync,
} from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { parse } from 'dotenv';

// Local file preparation/status only. This script never contacts a provider.
const root = fileURLToPath(new URL('../', import.meta.url));
const files = [
  {
    file: '.env',
    keys: [
      'KAKAO_MAP_REST_API_KEY',
      'GOOGLE_PLACES_API_KEY',
      'GOOGLE_GEOCODING_API_KEY',
    ],
    flags: ['GOOGLE_MAPS_REQUESTS_ENABLED', 'KAKAO_MAPS_REQUESTS_ENABLED'],
    defaults: {},
  },
  {
    file: 'apps/web/.env.local',
    keys: [
      'NEXT_PUBLIC_KAKAO_MAP_JS_KEY',
      'NEXT_PUBLIC_GOOGLE_MAPS_API_KEY',
      'NEXT_PUBLIC_GOOGLE_MAP_ID',
    ],
    flags: ['GOOGLE_MAPS_WEB_ENABLED', 'KAKAO_MAPS_WEB_ENABLED'],
    defaults: { NEXT_PUBLIC_API_BASE_URL: 'http://localhost:3113' },
  },
  {
    file: 'apps/mobile/.env',
    keys: ['EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY'],
    flags: [],
    defaults: {
      EXPO_PUBLIC_API_BASE_URL: 'http://localhost:3113',
      EXPO_PUBLIC_MAP_WEB_BASE_URL: 'http://localhost:3000',
    },
  },
];
const prepare = process.argv.includes('--prepare');
for (const group of files) {
  const path = resolve(root, group.file);
  let content = existsSync(path) ? readFileSync(path, 'utf8') : '';
  let values = parse(content);
  if (prepare) {
    const defaults = {
      ...group.defaults,
      ...Object.fromEntries(group.keys.map((key) => [key, ''])),
      ...Object.fromEntries(group.flags.map((key) => [key, 'false'])),
    };
    const missing = Object.entries(defaults).filter(
      ([key]) => !(key in values)
    );
    if (missing.length) {
      const addition =
        '\n# PathTrip 지도 연결: 키 입력 후에도 활성화 설정은 별도로 확인하세요.\n' +
        missing.map(([key, value]) => `${key}=${value}`).join('\n') +
        '\n';
      if (existsSync(path)) appendFileSync(path, addition);
      else writeFileSync(path, addition, { mode: 0o600, flag: 'wx' });
      content += addition;
      values = parse(content);
    }
  }
  process.stdout.write(`\n${group.file}\n`);
  for (const key of group.keys) {
    process.stdout.write(
      `  ${key}: ${values[key]?.trim() ? '입력됨 (유효성·요금 설정 미검증)' : '입력 필요'}\n`
    );
  }
  for (const flag of group.flags) {
    process.stdout.write(
      `  ${flag}: ${values[flag] === 'true' ? '켜짐 — 공급자 무료 쿼터/제한 확인 필요' : '꺼짐'}\n`
    );
  }
}
process.stdout.write(
  '\n외부 API 요청 없이 확인했습니다. 안내: docs/api-keys-guide.md\n'
);
