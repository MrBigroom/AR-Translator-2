import { useFrameProcessor } from 'react-native-vision-camera';
import type { ReadonlyFrameProcessor } from 'react-native-vision-camera';
import { useTextRecognition } from 'react-native-vision-camera-ocr-plus';
import { useRunOnJS, useSharedValue } from 'react-native-worklets-core';

import { OCR_EVERY_N_FRAMES } from '../lib/throttle';

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

export function useFrameOcr(
  onText: (text: string) => void,
  enabled: boolean,
  language: OcrScript = 'latin',
): ReadonlyFrameProcessor {
  const { scanText } = useTextRecognition({ language });
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
