import { getCloudConfig } from '../config/env';

/**
 * Cloud OCR via Google Cloud Vision (DOCUMENT_TEXT_DETECTION) — far stronger on
 * handwriting than the on-device ML Kit recognizer, so it powers the "Read
 * handwriting" capture button. Reuses the same Google API key as cloud
 * translation (the Cloud Vision API must be enabled on that key). Returns
 * undefined when no Google key is configured.
 *
 * SECURITY: like cloudTranslate, a raw key shipped in the binary is extractable;
 * for real distribution, route this through a small proxy that holds the key.
 */
export type CloudVisionOcr = (base64Image: string, languageHints?: string[]) => Promise<string>;

export function makeCloudVisionOcr(): CloudVisionOcr | undefined {
  const cfg = getCloudConfig();
  // Vision is a Google Cloud feature — only meaningful with the Google key.
  if (!cfg.enabled || cfg.provider !== 'google') return undefined;
  return (base64Image, languageHints) => googleVisionOcr(cfg.apiKey, base64Image, languageHints);
}

async function googleVisionOcr(
  apiKey: string,
  base64Image: string,
  languageHints?: string[],
): Promise<string> {
  const url = `https://vision.googleapis.com/v1/images:annotate?key=${encodeURIComponent(apiKey)}`;
  const request: Record<string, unknown> = {
    image: { content: base64Image },
    // DOCUMENT_TEXT_DETECTION is the dense/handwriting-oriented model.
    features: [{ type: 'DOCUMENT_TEXT_DETECTION' }],
  };
  if (languageHints && languageHints.length > 0) {
    request.imageContext = { languageHints };
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: [request] }),
  });
  if (!res.ok) throw new Error(`Cloud Vision HTTP ${res.status}`);
  const json = await res.json();
  const r = json?.responses?.[0];
  if (r?.error?.message) throw new Error(`Cloud Vision: ${r.error.message}`);
  return String(r?.fullTextAnnotation?.text ?? '').trim();
}
