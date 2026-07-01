import { EngineMode, LanguageCode, TranslationRequest, TranslationResult } from '../types';

/**
 * Pure translation orchestrator.
 *
 * The dispatch/fallback policy lives here, decoupled from React Native and the
 * ML Kit / cloud SDKs, so it can be unit-tested headlessly. The hook layer wires
 * in real implementations of these dependencies.
 */
export interface TranslateFn {
  (text: string, source: LanguageCode | null, target: LanguageCode): Promise<{
    translatedText: string;
    detectedSource: LanguageCode | null;
  }>;
}

export interface EngineDeps {
  /** On-device (ML Kit) translation. Always available offline once models exist. */
  onDevice: TranslateFn;
  /** Cloud translation. May be undefined when no API key is configured. */
  cloud?: TranslateFn;
  /** Whether the device currently has network connectivity. */
  isOnline: () => boolean;
  /**
   * Detect the source language for auto mode. Returns null when undetermined.
   * Only called when the request source is "auto".
   */
  detectLanguage: (text: string) => Promise<LanguageCode | null>;
}

/**
 * Translate `request` according to `mode`, applying the hybrid policy:
 *  - Cloud is used only when selected, online, and actually configured.
 *  - Any cloud failure (or being offline) transparently falls back to on-device.
 *  - Source "auto" is resolved via detectLanguage before translating.
 */
export async function runTranslation(
  request: TranslationRequest,
  mode: EngineMode,
  deps: EngineDeps,
): Promise<TranslationResult> {
  const source: LanguageCode | null =
    request.source === 'auto' ? await deps.detectLanguage(request.text) : request.source;

  const wantsCloud = mode === 'cloud' && !!deps.cloud && deps.isOnline();

  if (wantsCloud && deps.cloud) {
    try {
      const out = await deps.cloud(request.text, source, request.target);
      return {
        originalText: request.text,
        translatedText: out.translatedText,
        detectedSource: out.detectedSource ?? source,
        target: request.target,
        engine: 'cloud',
        usedFallback: false,
      };
    } catch {
      // fall through to on-device
    }
  }

  const out = await deps.onDevice(request.text, source, request.target);
  return {
    originalText: request.text,
    translatedText: out.translatedText,
    detectedSource: out.detectedSource ?? source,
    target: request.target,
    engine: 'on-device',
    usedFallback: mode === 'cloud',
  };
}
