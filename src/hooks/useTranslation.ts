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
 *
 * `captureTranslate` is the one-shot path for the "Read handwriting" button: it
 * translates a specific string (from Cloud Vision OCR) directly, bypassing the
 * stabilizer and the pause gate, and freezes the panel on it.
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
  // Serialize translations (one at a time). ML Kit's translator creates + downloads
  // + closes a model per call, so concurrent per-frame calls jam the downloader and
  // hang. Only translate when nothing is in flight.
  const inFlight = useRef(false);
  // The last text we translated (live or captured); re-run on setting change.
  const lastTextRef = useRef('');

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

  // Low-level translate: always runs; clears the in-flight guard when it settles.
  const doTranslate = useCallback(
    (text: string) => {
      const reqId = ++latestReq.current;
      lastTextRef.current = text;
      setBusy(true);
      runTranslation({ text, source, target }, engine, deps)
        .then((r) => {
          if (reqId === latestReq.current) setResult(r);
        })
        .catch(() => {})
        .finally(() => {
          inFlight.current = false;
          if (reqId === latestReq.current) setBusy(false);
        });
    },
    [source, target, engine, deps],
  );

  // Live path: serialize so per-frame OCR can't launch concurrent translations.
  const translateNow = useCallback(
    (text: string) => {
      if (inFlight.current) return;
      inFlight.current = true;
      doTranslate(text);
    },
    [doTranslate],
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

  // One-shot capture (e.g. Cloud Vision handwriting OCR): translate the given text
  // directly, bypassing the stabilizer + pause gate, and freeze the panel on it.
  const captureTranslate = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) return;
      setPaused(true);
      stabilizer.current.reset();
      inFlight.current = true; // keep frame translations from racing this one
      doTranslate(t);
    },
    [doTranslate],
  );

  // When the user changes source/target/engine, re-translate the current text so
  // the panel updates without needing the camera to see something new.
  useEffect(() => {
    if (lastTextRef.current) translateNow(lastTextRef.current);
    // translateNow already depends on source/target/engine.
  }, [translateNow]);

  const togglePause = useCallback(() => setPaused((p) => !p), []);
  const pause = useCallback(() => setPaused(true), []);

  const clear = useCallback(() => {
    stabilizer.current.reset();
    lastTextRef.current = '';
    latestReq.current += 1;
    setResult(null);
    setBusy(false);
  }, []);

  return { result, busy, paused, submit, captureTranslate, togglePause, pause, clear };
}
