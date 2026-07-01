import { ExpoConfig } from 'expo/config';

/**
 * Expo app configuration for "Gift for CY".
 *
 * The vision-camera config plugin injects the native camera permission wiring;
 * we also declare the human-readable permission strings so the OS prompt makes
 * sense to the user.
 */
const config: ExpoConfig = {
  name: 'Gift for CY',
  slug: 'gift-for-cy',
  scheme: 'giftforcy',
  icon: './assets/icon.png',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'automatic',
  newArchEnabled: true,
  splash: {
    resizeMode: 'contain',
    backgroundColor: '#0B0F19',
  },
  assetBundlePatterns: ['**/*'],
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.giftforcy.app',
    infoPlist: {
      NSCameraUsageDescription:
        'Gift for CY uses the camera to read and translate text in real time.',
    },
  },
  android: {
    package: 'com.giftforcy.app',
    permissions: ['android.permission.CAMERA'],
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#10B981',
    },
  },
  plugins: [
    'expo-dev-client',
    [
      'react-native-vision-camera',
      {
        cameraPermissionText:
          'Gift for CY needs camera access to read and translate text in real time.',
        enableCodeScanner: false,
      },
    ],
    [
      'expo-build-properties',
      {
        // ML Kit's iOS pods (GoogleMLKit) require a modern deployment target.
        ios: { deploymentTarget: '15.5' },
        // Keep Kotlin pinned to RN 0.76.5's version across prebuilds (Compose match).
        android: { kotlinVersion: '1.9.24' },
      },
    ],
  ],
  extra: {
    // Optional cloud translation. Prefer supplying this via an EAS secret or a
    // backend proxy rather than committing a real key. Empty => on-device only.
    cloudTranslateApiKey: process.env.GIFT_CLOUD_TRANSLATE_API_KEY ?? '',
    cloudTranslateProvider: process.env.GIFT_CLOUD_TRANSLATE_PROVIDER ?? 'google',
  },
};

export default config;
