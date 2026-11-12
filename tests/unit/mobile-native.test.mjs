import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {
  updateAppDelegate,
} = require('../../apps/mobile/plugins/withSceneLifecycle.cjs');

const legacy = `class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?
  var reactNativeFactory: RCTReactNativeFactory?
  func launch() {
#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif
    GMSServices.provideAPIKey("test-key")
    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}`;

test('iOS scene이 앱 창을 생성하도록 전환하고 지도 초기화는 보존한다', () => {
  const result = updateAppDelegate(legacy);
  assert.match(result, /ExpoAppDelegate, ExpoReactNativeFactoryProvider/);
  assert.doesNotMatch(result, /factory\.startReactNative|UIScreen\.main/);
  assert.match(result, /GMSServices\.provideAPIKey\("test-key"\)/);
  assert.match(result, /var reactNativeFactory: RCTReactNativeFactory\?/);
  assert.equal(updateAppDelegate(result), result);
});

test('알 수 없는 네이티브 시작 코드는 조용히 덮어쓰지 않는다', () => {
  assert.throws(
    () => updateAppDelegate('class CustomDelegate {}'),
    /unsupported/
  );
  assert.throws(
    () =>
      updateAppDelegate(
        'class AppDelegate: ExpoAppDelegate { factory.startReactNative(custom) }'
      ),
    /review the custom/
  );
});
