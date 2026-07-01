import { EngineDeps, runTranslation } from '../src/services/translationEngine';
import { TranslationRequest } from '../src/types';

function makeDeps(overrides: Partial<EngineDeps> = {}): EngineDeps {
  return {
    onDevice: async (text, source, target) => ({
      translatedText: `ondevice:${source ?? '?'}->${target}:${text}`,
      detectedSource: source,
    }),
    cloud: async (text, source, target) => ({
      translatedText: `cloud:${source ?? '?'}->${target}:${text}`,
      detectedSource: source ?? 'xx',
    }),
    isOnline: () => true,
    detectLanguage: async () => 'fr',
    ...overrides,
  };
}

const req: TranslationRequest = { text: 'bonjour', source: 'fr', target: 'en' };

describe('runTranslation', () => {
  it('uses on-device when mode is on-device', async () => {
    const r = await runTranslation(req, 'on-device', makeDeps());
    expect(r.engine).toBe('on-device');
    expect(r.translatedText).toBe('ondevice:fr->en:bonjour');
    expect(r.usedFallback).toBe(false);
  });

  it('uses cloud when mode is cloud, online, and configured', async () => {
    const r = await runTranslation(req, 'cloud', makeDeps());
    expect(r.engine).toBe('cloud');
    expect(r.translatedText).toBe('cloud:fr->en:bonjour');
    expect(r.usedFallback).toBe(false);
  });

  it('falls back to on-device when cloud throws', async () => {
    const deps = makeDeps({
      cloud: async () => {
        throw new Error('network');
      },
    });
    const r = await runTranslation(req, 'cloud', deps);
    expect(r.engine).toBe('on-device');
    expect(r.usedFallback).toBe(true);
  });

  it('falls back to on-device when offline even in cloud mode', async () => {
    const deps = makeDeps({ isOnline: () => false });
    const r = await runTranslation(req, 'cloud', deps);
    expect(r.engine).toBe('on-device');
    expect(r.usedFallback).toBe(true);
  });

  it('falls back to on-device when cloud is not configured', async () => {
    const deps = makeDeps({ cloud: undefined });
    const r = await runTranslation(req, 'cloud', deps);
    expect(r.engine).toBe('on-device');
    expect(r.usedFallback).toBe(true);
  });

  it('resolves auto source via detectLanguage', async () => {
    const autoReq: TranslationRequest = { text: 'hola', source: 'auto', target: 'en' };
    const r = await runTranslation(autoReq, 'on-device', makeDeps({ detectLanguage: async () => 'es' }));
    expect(r.detectedSource).toBe('es');
    expect(r.translatedText).toBe('ondevice:es->en:hola');
  });

  it('passes null source through when auto-detection is undetermined', async () => {
    const autoReq: TranslationRequest = { text: '???', source: 'auto', target: 'en' };
    const r = await runTranslation(autoReq, 'on-device', makeDeps({ detectLanguage: async () => null }));
    expect(r.detectedSource).toBeNull();
    expect(r.translatedText).toBe('ondevice:?->en:???');
  });
});
