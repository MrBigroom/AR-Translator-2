/** Shared domain types for Translator App for CY. */

/** A BCP-47-ish language code as used by ML Kit (e.g. "en", "zh", "es"). */
export type LanguageCode = string;

/** Sentinel meaning "auto-detect the source language from the recognized text". */
export const AUTO = 'auto' as const;
export type SourceSelection = LanguageCode | typeof AUTO;

/** Which translation backend to use. */
export type EngineMode = 'on-device' | 'cloud';

/** Raw result of recognizing text from a single camera frame. */
export interface OcrResult {
  /** Full recognized text, blocks joined by newlines. */
  text: string;
  /** Optional per-block bounding boxes (for the stretch overlay feature). */
  blocks?: OcrBlock[];
}

export interface OcrBlock {
  text: string;
  frame?: { x: number; y: number; width: number; height: number };
}

/** A translation request after the source text has been stabilized. */
export interface TranslationRequest {
  text: string;
  source: SourceSelection;
  target: LanguageCode;
}

/** Result of a translation, including which engine actually served it. */
export interface TranslationResult {
  originalText: string;
  translatedText: string;
  detectedSource: LanguageCode | null;
  target: LanguageCode;
  engine: EngineMode;
  /** True when we asked for cloud but fell back to on-device. */
  usedFallback: boolean;
}
