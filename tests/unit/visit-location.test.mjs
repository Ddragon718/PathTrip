import assert from 'node:assert/strict';
import test from 'node:test';
import { readFile } from 'node:fs/promises';
import vm from 'node:vm';
import ts from 'typescript';

for (const file of [
  'apps/mobile/lib/visit-location.web.ts',
  'apps/web/src/lib/visit-location.ts',
]) {
  test(`${file}: 호출 전에는 위치 요청을 하지 않고 현재 측정값만 전달한다`, async () => {
    const source = await readFile(
      new URL(`../../${file}`, import.meta.url),
      'utf8'
    );
    const compiled = ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
      },
    }).outputText;
    let calls = 0;
    const context = vm.createContext({
      exports: {},
      navigator: {
        geolocation: {
          getCurrentPosition(success, _failure, options) {
            calls++;
            assert.equal(options.maximumAge, 0);
            assert.equal(options.enableHighAccuracy, true);
            assert.ok(options.timeout <= 25000);
            success({
              coords: { latitude: 26.3, longitude: 127.8, accuracy: 15 },
              timestamp: 1000,
            });
          },
        },
      },
    });
    vm.runInContext(compiled, context);
    assert.equal(calls, 0);
    const value = await context.exports.getVisitLocation();
    assert.equal(calls, 1);
    assert.deepEqual(JSON.parse(JSON.stringify(value)), {
      latitude: 26.3,
      longitude: 127.8,
      accuracy: 15,
      capturedAt: '1970-01-01T00:00:01.000Z',
    });
    context.navigator.geolocation.getCurrentPosition = (_success, fail) =>
      fail({ code: 1 });
    await assert.rejects(() => context.exports.getVisitLocation(), /위치 권한/);
    context.navigator.geolocation.getCurrentPosition = (success) =>
      success({
        coords: { latitude: 26, longitude: 127, accuracy: 1000 },
        timestamp: 1000,
      });
    await assert.rejects(() => context.exports.getVisitLocation(), /100m/);
  });
}

test('iOS 위치 설정은 foreground 설명만 사용하고 배경 위치를 켜지 않는다', async () => {
  const config = JSON.parse(
    await readFile(
      new URL('../../apps/mobile/app.json', import.meta.url),
      'utf8'
    )
  );
  const [, options] = config.expo.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === 'expo-location'
  );
  assert.ok(options.locationWhenInUsePermission.includes('방문 인증'));
  assert.equal(options.locationAlwaysAndWhenInUsePermission, false);
  assert.equal(options.locationAlwaysPermission, false);
  assert.equal(options.motionUsagePermission, false);
  assert.equal(options.isIosBackgroundLocationEnabled, false);
  assert.equal(options.isAndroidBackgroundLocationEnabled, false);
});
