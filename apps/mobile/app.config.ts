import type { ConfigContext, ExpoConfig } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: config.name ?? 'PathTrip',
  slug: config.slug ?? 'pathtrip',
  plugins: [
    ...(config.plugins ?? []),
    './plugins/withSceneLifecycle.cjs',
    [
      'react-native-maps',
      {
        ...(process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY
          ? {
              iosGoogleMapsApiKey:
                process.env.EXPO_PUBLIC_GOOGLE_MAPS_IOS_API_KEY,
            }
          : {}),
      },
    ],
  ],
});
