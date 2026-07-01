/**
 * Text stabilizer.
 *
 * OCR runs many times per second and produces noisy, near-duplicate text as the
 * camera and lighting jitter. Translating every frame would be wasteful (and, in
 * cloud mode, expensive) and would make the bottom panel flicker. The stabilizer
 * decides when the recognized text has changed *meaningfully* enough to warrant a
 * new translation.
 *
 * It is deliberately pure and dependency-free so it can be unit-tested in Node.
 */

export interface StabilizerOptions {
  /**
   * Minimum normalized difference (0..1) between the last accepted text and a new
   * candidate for it to count as "changed". 0.15 ≈ 15% of characters differ.
   */
  minChangeRatio: number;
  /** Ignore candidates shorter than this many non-space characters (noise). */
  minLength: number;
}

export const DEFAULT_STABILIZER_OPTIONS: StabilizerOptions = {
  minChangeRatio: 0.15,
  minLength: 2,
};

/** Collapse whitespace and trim so trivial spacing changes don't count. */
export function normalize(text: string): string {
  return text.replace(/\s+/g, ' ').trim();
}

/**
 * Levenshtein edit distance between two strings. Iterative with a single row to
 * keep it O(min(a,b)) memory. Used to measure how different two OCR reads are.
 */
export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Ensure `a` is the shorter string for the single-row buffer.
  if (a.length > b.length) {
    const tmp = a;
    a = b;
    b = tmp;
  }

  let prev = new Array<number>(a.length + 1);
  for (let i = 0; i <= a.length; i++) prev[i] = i;

  for (let j = 1; j <= b.length; j++) {
    let prevDiag = prev[0];
    prev[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      const temp = prev[i];
      prev[i] = Math.min(
        prev[i] + 1, // deletion
        prev[i - 1] + 1, // insertion
        prevDiag + cost, // substitution
      );
      prevDiag = temp;
    }
  }
  return prev[a.length];
}

/** Normalized change ratio in [0,1]: edit distance over the longer length. */
export function changeRatio(a: string, b: string): number {
  const na = normalize(a);
  const nb = normalize(b);
  const longer = Math.max(na.length, nb.length);
  if (longer === 0) return 0;
  return levenshtein(na, nb) / longer;
}

/**
 * Stateful gate over a stream of OCR reads. Call `push(text)` for every frame;
 * it returns the text to translate when a meaningful change is detected, or
 * `null` when the frame should be ignored (empty, too short, or too similar to
 * the last accepted text).
 */
export class TextStabilizer {
  private readonly options: StabilizerOptions;
  private lastAccepted = '';

  constructor(options: Partial<StabilizerOptions> = {}) {
    this.options = { ...DEFAULT_STABILIZER_OPTIONS, ...options };
  }

  /** The last text that was accepted for translation. */
  get current(): string {
    return this.lastAccepted;
  }

  reset(): void {
    this.lastAccepted = '';
  }

  push(raw: string): string | null {
    const text = normalize(raw);
    const meaningfulLength = text.replace(/\s/g, '').length;
    if (meaningfulLength < this.options.minLength) {
      return null;
    }
    if (this.lastAccepted === '') {
      this.lastAccepted = text;
      return text;
    }
    if (text === this.lastAccepted) {
      return null;
    }
    if (changeRatio(this.lastAccepted, text) < this.options.minChangeRatio) {
      return null;
    }
    this.lastAccepted = text;
    return text;
  }
}
