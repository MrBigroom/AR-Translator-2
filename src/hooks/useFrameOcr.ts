import { useFrameProcessor } from 'react-native-vision-camera';
import type { ReadonlyFrameProcessor } from 'react-native-vision-camera';
import { useTextRecognition } from 'react-native-vision-camera-ocr-plus';
import { useRunOnJS, useSharedValue } from 'react-native-worklets-core';

import { OCR_EVERY_N_FRAMES } from '../lib/throttle';
import { AUTO, SourceSelection } from '../types';

/**
 * Wires a VisionCamera frame processor to the ocr-plus text-recognition plugin.
 *
 * The heavy per-frame OCR runs on the camera thread (worklet); we throttle to
 * every Nth frame and marshal only the recognized text string back to JS via
 * useRunOnJS. The plugin is the deliberately swappable seam — if ocr-plus is
 * ever unmaintained, only this file changes (see plan's fallback options).
 *
 * `language` selects the script model. "latin" covers most European languages;
 * pass "chinese" | "japanese" | "korean" | "devanagari" for those scripts.
 */
export type OcrScript = 'latin' | 'chinese' | 'japanese' | 'korean' | 'devanagari';

/**
 * ML Kit text recognition is script-based and processes one script at a time, so
 * the chosen source language selects which OCR model runs. Chinese/Japanese/Korean
 * each have a dedicated model; the Latin model covers all European languages plus
 * Malay, Vietnamese, Indonesian, etc.; Devanagari covers Hindi/Marathi. "auto"
 * uses Latin.
 *
 * NOTE: Thai (and Arabic, Cyrillic, etc.) have NO on-device ML Kit OCR model, so
 * their text cannot be recognized from the camera on-device — reading those would
 * require a cloud OCR such as Google Cloud Vision.
 */
const OCR_SCRIPT_BY_LANGUAGE: Record<string, OcrScript> = {
  zh: 'chinese',
  ja: 'japanese',
  ko: 'korean',
  hi: 'devanagari',
  mr: 'devanagari',
};

export function ocrScriptForSource(source: SourceSelection): OcrScript {
  return source === AUTO ? 'latin' : OCR_SCRIPT_BY_LANGUAGE[source] ?? 'latin';
}

/** Scan region as percentage strings (e.g. "10%") of the camera frame. */
export interface OcrScanRegion {
  left: string;
  top: string;
  width: string;
  height: string;
}

export function useFrameOcr(
  onText: (text: string) => void,
  enabled: boolean,
  language: OcrScript = 'latin',
  scanRegion?: OcrScanRegion,
): ReadonlyFrameProcessor {
  const { scanText } = useTextRecognition(
    scanRegion ? { language, scanRegion } : { language },
  );
  const frameCount = useSharedValue(0);

  const emit = useRunOnJS(
    (text: string) => {
      onText(text);
    },
    [onText],
  );

  const frameProcessor = useFrameProcessor(
    (frame) => {
      'worklet';
      if (!enabled) return;

      // Throttle: only every Nth frame triggers OCR to stay within budget.
      frameCount.value += 1;
      if (frameCount.value % OCR_EVERY_N_FRAMES !== 0) return;

      const result = scanText(frame);
      const text: string = (result && (result.resultText as string)) || '';
      if (text.length > 0) {
        emit(text);
      }
    },
    [enabled, scanText, emit],
  );

  return frameProcessor;
}
