import TranslateText from '@react-native-ml-kit/translate-text';

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

  const result = await TranslateText.translate({
    text,
    sourceLanguage: source,
    targetLanguage: target,
    downloadModelIfNeeded: true,
  });

  return {
    translatedText: result?.text ?? text,
    detectedSource: source,
  };
}
