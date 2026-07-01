import { LanguageCode } from '../types';
import { getCloudConfig } from '../config/env';

/**
 * Cloud translation client. Currently supports Google Cloud Translation v2 and
 * DeepL, selected via GIFT_CLOUD_TRANSLATE_PROVIDER. Returns undefined when no
 * API key is configured, in which case the app is on-device only.
 *
 * SECURITY: a raw key shipped in the app binary is extractable. For real use,
 * route these calls through a small serverless proxy that holds the key and set
 * the app's endpoint to that proxy instead.
 */
export function makeCloudTranslate():
  | ((
      text: string,
      source: LanguageCode | null,
      target: LanguageCode,
    ) => Promise<{ translatedText: string; detectedSource: LanguageCode | null }>)
  | undefined {
  const cfg = getCloudConfig();
  if (!cfg.enabled) return undefined;

  if (cfg.provider === 'deepl') {
    return (text, source, target) => deeplTranslate(cfg.apiKey, text, source, target);
  }
  return (text, source, target) => googleTranslate(cfg.apiKey, text, source, target);
}

async function googleTranslate(
  apiKey: string,
  text: string,
  source: LanguageCode | null,
  target: LanguageCode,
): Promise<{ translatedText: string; detectedSource: LanguageCode | null }> {
  const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(
    apiKey,
  )}`;
  const body: Record<string, string> = { q: text, target, format: 'text' };
  if (source) body.source = source;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Google Translate HTTP ${res.status}`);
  const json = await res.json();
  const t = json?.data?.translations?.[0];
  if (!t) throw new Error('Google Translate: empty response');
  return {
    translatedText: t.translatedText as string,
    detectedSource: (t.detectedSourceLanguage as string | undefined) ?? source,
  };
}

async function deeplTranslate(
  apiKey: string,
  text: string,
  source: LanguageCode | null,
  target: LanguageCode,
): Promise<{ translatedText: string; detectedSource: LanguageCode | null }> {
  const params = new URLSearchParams();
  params.append('text', text);
  params.append('target_lang', target.toUpperCase());
  if (source) params.append('source_lang', source.toUpperCase());

  const res = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });
  if (!res.ok) throw new Error(`DeepL HTTP ${res.status}`);
  const json = await res.json();
  const t = json?.translations?.[0];
  if (!t) throw new Error('DeepL: empty response');
  return {
    translatedText: t.text as string,
    detectedSource: (t.detected_source_language as string | undefined)?.toLowerCase() ?? source,
  };
}
