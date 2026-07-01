/**
 * Ambient declarations for third-party native modules whose bundled types we
 * don't rely on directly. Kept intentionally narrow to just the surface we use.
 */

declare module 'react-native-vision-camera-ocr-plus' {
  import type { Frame } from 'react-native-vision-camera';

  export interface OcrPlusBlock {
    text: string;
    frame?: { x: number; y: number; width: number; height: number };
  }

  export interface OcrPlusResult {
    resultText: string;
    blocks?: OcrPlusBlock[];
  }

  export interface UseTextRecognitionOptions {
    language?: 'latin' | 'chinese' | 'japanese' | 'korean' | 'devanagari';
  }

  export function useTextRecognition(options?: UseTextRecognitionOptions): {
    scanText: (frame: Frame) => OcrPlusResult;
  };
}
