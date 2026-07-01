import LanguageIdentification from '@react-native-ml-kit/identify-languages';

import { LanguageCode } from '../types';
import { isSupportedLanguage } from '../config/languages';

/**
 * On-device source-language auto-detection via ML Kit Language Identification.
 * Returns null when the text is too ambiguous ("und") or the detected language
 * isn't one we can translate on-device.
 */
export async function detectLanguage(text: string): Promise<LanguageCode | null> {
  const trimmed = text.trim();
  if (trimmed.length === 0) return null;
  try {
    const code = await LanguageIdentification.identify(trimmed);
    if (!code || code === 'und') return null;
    // ML Kit may return region-tagged codes (e.g. "zh-Latn"); take the base tag.
    const base = code.split('-')[0];
    return isSupportedLanguage(base) ? base : null;
  } catch {
    return null;
  }
}
