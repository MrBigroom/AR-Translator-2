/**
 * Minimal time-based throttle gate, pure and testable.
 *
 * The OCR frame processor calls `shouldRun(now)` on every frame; it returns true
 * at most once per `intervalMs`. We pass `now` explicitly (instead of reading a
 * clock) so the logic is deterministic in tests and safe to call from a worklet.
 */
export class ThrottleGate {
  private lastRun = -Infinity;

  constructor(private readonly intervalMs: number) {}

  shouldRun(now: number): boolean {
    if (now - this.lastRun >= this.intervalMs) {
      this.lastRun = now;
      return true;
    }
    return false;
  }

  reset(): void {
    this.lastRun = -Infinity;
  }
}

/** Frames-per-second the OCR pipeline targets. ~4x/sec balances latency vs load. */
export const OCR_TARGET_FPS = 4;
export const OCR_INTERVAL_MS = Math.round(1000 / OCR_TARGET_FPS);

/**
 * Run OCR every Nth camera frame. Frame-count throttling is used inside the
 * worklet because it is unit-agnostic (frame.timestamp units vary by platform).
 * Assuming ~30fps capture, every 8th frame ≈ 3.75 OCR passes/second.
 */
export const OCR_EVERY_N_FRAMES = 8;
