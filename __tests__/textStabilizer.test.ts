import {
  TextStabilizer,
  changeRatio,
  levenshtein,
  normalize,
} from '../src/lib/textStabilizer';

describe('normalize', () => {
  it('collapses whitespace and trims', () => {
    expect(normalize('  hello   world \n')).toBe('hello world');
  });
});

describe('levenshtein', () => {
  it('is zero for identical strings', () => {
    expect(levenshtein('abc', 'abc')).toBe(0);
  });
  it('counts single edits', () => {
    expect(levenshtein('kitten', 'sitten')).toBe(1); // substitution
    expect(levenshtein('cat', 'cats')).toBe(1); // insertion
  });
  it('handles empty strings', () => {
    expect(levenshtein('', 'abc')).toBe(3);
    expect(levenshtein('abc', '')).toBe(3);
  });
});

describe('changeRatio', () => {
  it('is 0 for identical (post-normalize) text', () => {
    expect(changeRatio('hola  mundo', 'hola mundo')).toBe(0);
  });
  it('is 1 for fully different text of equal length', () => {
    expect(changeRatio('aaaa', 'bbbb')).toBe(1);
  });
});

describe('TextStabilizer', () => {
  it('accepts the first meaningful text', () => {
    const s = new TextStabilizer();
    expect(s.push('Bonjour le monde')).toBe('Bonjour le monde');
    expect(s.current).toBe('Bonjour le monde');
  });

  it('ignores text below the minimum length', () => {
    const s = new TextStabilizer({ minLength: 3 });
    expect(s.push('hi')).toBeNull();
    expect(s.push('  a ')).toBeNull();
  });

  it('ignores identical repeats', () => {
    const s = new TextStabilizer();
    expect(s.push('hello world')).toBe('hello world');
    expect(s.push('hello world')).toBeNull();
    // whitespace-only difference is also ignored (normalized)
    expect(s.push('hello   world')).toBeNull();
  });

  it('ignores tiny changes below the change ratio', () => {
    const s = new TextStabilizer({ minChangeRatio: 0.15 });
    const base = 'the quick brown fox jumps';
    expect(s.push(base)).toBe(base);
    // one-character OCR jitter is well under 15% of ~25 chars
    expect(s.push('the quick brown fox jumps')).toBeNull();
  });

  it('accepts a meaningful change', () => {
    const s = new TextStabilizer({ minChangeRatio: 0.15 });
    expect(s.push('good morning')).toBe('good morning');
    const next = 'buenas noches amigo';
    expect(s.push(next)).toBe(next);
    expect(s.current).toBe(next);
  });

  it('resets its accepted text', () => {
    const s = new TextStabilizer();
    s.push('hello world');
    s.reset();
    expect(s.current).toBe('');
    expect(s.push('hello world')).toBe('hello world');
  });
});
