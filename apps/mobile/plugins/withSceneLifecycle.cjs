const { withAppDelegate, withInfoPlist } = require('expo/config-plugins');

// Expo 57's runtime supports UIScene, but its native template still starts the
// window from AppDelegate. Xcode 27 builds must start it from a scene instead.
function updateAppDelegate(contents) {
  if (!contents.includes('ExpoReactNativeFactoryProvider')) {
    const declaration = /class AppDelegate:\s*ExpoAppDelegate\s*\{/;
    if (!declaration.test(contents)) {
      throw new Error('Scene lifecycle: unsupported AppDelegate declaration.');
    }
    contents = contents.replace(
      declaration,
      'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {'
    );
  }

  const legacyWindow =
    /#if os\(iOS\) \|\| os\(tvOS\)\s+window = UIWindow\(frame: UIScreen\.main\.bounds\)\s+factory\.startReactNative\(\s+withModuleName: "main",\s+in: window,\s+launchOptions: launchOptions\)\s+#endif/;
  contents = contents.replace(
    legacyWindow,
    '// ExpoAppSceneDelegate creates the scene window and starts React Native.'
  );
  if (contents.includes('factory.startReactNative(')) {
    throw new Error(
      'Scene lifecycle: review the custom React Native window startup.'
    );
  }
  return contents;
}

function withSceneLifecycle(config) {
  config = withInfoPlist(config, (mod) => {
    mod.modResults.UIApplicationSceneManifest = {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            // Objective-C runtime name exported by Expo SDK 57.
            UISceneDelegateClassName: 'EXExpoAppSceneDelegate',
          },
        ],
      },
    };
    return mod;
  });
  return withAppDelegate(config, (mod) => {
    if (mod.modResults.language !== 'swift') {
      throw new Error('Scene lifecycle requires the Swift Expo AppDelegate.');
    }
    mod.modResults.contents = updateAppDelegate(mod.modResults.contents);
    return mod;
  });
}

module.exports = withSceneLifecycle;
module.exports.updateAppDelegate = updateAppDelegate;
