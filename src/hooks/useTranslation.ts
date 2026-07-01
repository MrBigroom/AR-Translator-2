import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { TextStabilizer } from '../lib/textStabilizer';
import { EngineDeps, runTranslation } from '../services/translationEngine';
import { onDeviceTranslate } from '../services/onDeviceTranslate';
import { makeCloudTranslate } from '../services/cloudTranslate';
import { detectLanguage } from '../services/languageId';
import { useSettingsStore } from '../store/settingsStore';
import { TranslationResult } from '../types';
import { useOnlineStatus } from './useOnlineStatus';

/**
 * The translation pipeline. Feed raw OCR text via `submit`; it is gated through
 * the stabilizer (so we only translate on meaningful change), then translated by
 * the hybrid engine. `result` holds the latest translation, `busy` is true while
 * a translation is in flight, and `paused` freezes the panel on the current text.
 */
export function useTranslation() {
  const source = useSettingsStore((s) => s.source);
  const target = useSettingsStore((s) => s.target);
  const engine = useSettingsStore((s) => s.engine);
  const online = useOnlineStatus();

  const [result, setResult] = useState<TranslationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [paused, setPaused] = useState(false);

  const stabilizer = useRef(new TextStabilizer());
  // Monotonic id so stale in-flight translations can't overwrite newer results.
  const latestReq = useRef(0);

  const cloud = useMemo(() => makeCloudTranslate(), []);
  const onlineRef = useRef(online);
  onlineRef.current = online;

  const deps = useMemo<EngineDeps>(
    () => ({
      onDevice: onDeviceTranslate,
      cloud,
      isOnline: () => onlineRef.current,
      detectLanguage,
    }),
    [cloud],
  );

  const translateNow = useCallback(
    (text: string) => {
      const reqId = ++latestReq.current;
      setBusy(true);
      runTranslation({ text, source, target }, engine, deps)
        .then((r) => {
          if (reqId === latestReq.current) {
            setResult(r);
            setBusy(false);
          }
        })
        .catch(() => {
          if (reqId === latestReq.current) setBusy(false);
        });
    },
    [source, target, engine, deps],
  );

  const submit = useCallback(
    (raw: string) => {
      if (paused) return;
      const stable = stabilizer.current.push(raw);
      if (stable == null) return;
      translateNow(stable);
    },
    [paused, translateNow],
  );

  // When the user changes source/target/engine, re-translate the current text so
  // the panel updates without needing the camera to see something new.
  useEffect(() => {
    const current = stabilizer.current.current;
    if (current) translateNow(current);
    // translateNow already depends on source/target/engine.
  }, [translateNow]);

  const togglePause = useCallback(() => setPaused((p) => !p), []);

  const clear = useCallback(() => {
    stabilizer.current.reset();
    latestReq.current += 1;
    setResult(null);
    setBusy(false);
  }, []);

  return { result, busy, paused, submit, togglePause, clear };
}
