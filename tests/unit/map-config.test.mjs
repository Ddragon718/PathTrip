import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

const { outputText } = ts.transpileModule(
  readFileSync(
    new URL('../../apps/web/src/lib/map-config.ts', import.meta.url),
    'utf8'
  ),
  { compilerOptions: { module: ts.ModuleKind.CommonJS } }
);
const context = { exports: {} };
vm.runInNewContext(outputText, context);
const { buildMapConfig } = context.exports;

test('웹 지도는 명시적 활성화 전 키를 응답에 포함하지 않으며 공급자별로 따로 켠다', () => {
  const environment = {
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'google-test-only',
    NEXT_PUBLIC_KAKAO_MAP_JS_KEY: 'kakao-test-only',
    GOOGLE_MAPS_WEB_ENABLED: 'false',
    KAKAO_MAPS_WEB_ENABLED: 'true',
  };
  const google = buildMapConfig('GOOGLE', 'INTERNATIONAL', environment);
  assert.equal(google.key, '');
  assert.ok(google.disabledMessage);
  assert.equal(JSON.stringify(google).includes('google-test-only'), false);
  assert.equal(
    buildMapConfig('KAKAO', 'DOMESTIC', environment).key,
    'kakao-test-only'
  );
  for (const flag of [undefined, '', 'false', 'TRUE', '1']) {
    assert.equal(
      buildMapConfig('GOOGLE', 'DOMESTIC', {
        ...environment,
        GOOGLE_MAPS_WEB_ENABLED: flag,
      }).key,
      ''
    );
  }
  const enabled = buildMapConfig('GOOGLE', 'INTERNATIONAL', {
    ...environment,
    GOOGLE_MAPS_WEB_ENABLED: 'true',
  });
  assert.equal(enabled.key, 'google-test-only');
  assert.equal(enabled.disabledMessage, '');
});
