import { ThrottleGate, OCR_INTERVAL_MS } from '../src/lib/throttle';

describe('ThrottleGate', () => {
  it('runs immediately on the first call', () => {
    const g = new ThrottleGate(100);
    expect(g.shouldRun(0)).toBe(true);
  });

  it('suppresses calls inside the interval', () => {
    const g = new ThrottleGate(100);
    expect(g.shouldRun(0)).toBe(true);
    expect(g.shouldRun(50)).toBe(false);
    expect(g.shouldRun(99)).toBe(false);
  });

  it('runs again once the interval has elapsed', () => {
    const g = new ThrottleGate(100);
    expect(g.shouldRun(0)).toBe(true);
    expect(g.shouldRun(100)).toBe(true);
    expect(g.shouldRun(150)).toBe(false);
    expect(g.shouldRun(200)).toBe(true);
  });

  it('reset clears the last-run timestamp', () => {
    const g = new ThrottleGate(100);
    g.shouldRun(1000);
    g.reset();
    expect(g.shouldRun(1001)).toBe(true);
  });

  it('derives a sane interval from the target fps', () => {
    expect(OCR_INTERVAL_MS).toBeGreaterThan(0);
    expect(OCR_INTERVAL_MS).toBeLessThan(1000);
  });
});
