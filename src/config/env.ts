import Constants from 'expo-constants';

/**
 * Reads optional cloud-translation configuration from the Expo config `extra`
 * block (populated from env vars in app.config.ts). When the API key is empty,
 * the app runs on-device only and the Cloud engine toggle is disabled.
 */
interface CloudConfig {
  apiKey: string;
  provider: 'google' | 'deepl';
  enabled: boolean;
}

function readExtra(): Record<string, unknown> {
  // expoConfig is the modern location; fall back defensively for older runtimes.
  return (
    (Constants.expoConfig?.extra as Record<string, unknown> | undefined) ??
    (Constants.manifest2 as { extra?: Record<string, unknown> } | undefined)?.extra ??
    {}
  );
}

export function getCloudConfig(): CloudConfig {
  const extra = readExtra();
  const apiKey = String(extra.cloudTranslateApiKey ?? '').trim();
  const provider = extra.cloudTranslateProvider === 'deepl' ? 'deepl' : 'google';
  return { apiKey, provider, enabled: apiKey.length > 0 };
}
