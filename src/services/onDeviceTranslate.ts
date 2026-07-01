import TranslateText, { TranslateLanguage } from '@react-native-ml-kit/translate-text';

import { LanguageCode } from '../types';

/**
 * On-device translation via Google ML Kit (@react-native-ml-kit/translate-text).
 *
 * ML Kit needs a concrete source language, so "auto" must already be resolved by
 * the caller (see languageId.detectLanguage). When the source is still unknown we
 * return the original text unchanged rather than guessing wrong.
 *
 * Translation models (~30MB/language pair) download on demand the first time a
 * language is used; `downloadModelIfNeeded` handles that transparently, which is
 * why the first translation for a new language can take a few seconds and needs
 * network. After that it is fully offline.
 */
export async function onDeviceTranslate(
  text: string,
  source: LanguageCode | null,
  target: LanguageCode,
): Promise<{ translatedText: string; detectedSource: LanguageCode | null }> {
  if (!source) {
    return { translatedText: text, detectedSource: null };
  }
  if (source === target) {
    return { translatedText: text, detectedSource: source };
  }

  // The native module resolves translate() with the translated string directly
  // (TranslateTextModule.java: `promise.resolve(translatedText)`), even though the
  // package types the result as an empty object — so cast through unknown.
  const translated = (await TranslateText.translate({
    text,
    sourceLanguage: source as TranslateLanguage,
    targetLanguage: target as TranslateLanguage,
    downloadModelIfNeeded: true,
  })) as unknown as string;

  return {
    translatedText: translated || text,
    detectedSource: source,
  };
}
