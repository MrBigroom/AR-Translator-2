import { create } from 'zustand';

import { AUTO, EngineMode, LanguageCode, SourceSelection } from '../types';
import { DEFAULT_TARGET } from '../config/languages';
import { getCloudConfig } from '../config/env';

/**
 * Global user settings for the translator. Kept small and serializable so it can
 * later be persisted (e.g. AsyncStorage) without restructuring.
 */
interface SettingsState {
  source: SourceSelection;
  target: LanguageCode;
  engine: EngineMode;
  /** Whether the cloud engine is even available (API key configured). */
  cloudAvailable: boolean;

  setSource: (source: SourceSelection) => void;
  setTarget: (target: LanguageCode) => void;
  setEngine: (engine: EngineMode) => void;
  swapLanguages: () => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  source: AUTO,
  target: DEFAULT_TARGET,
  engine: 'on-device',
  cloudAvailable: getCloudConfig().enabled,

  setSource: (source) => set({ source }),
  setTarget: (target) => set({ target }),
  // Guard against selecting cloud when it isn't configured.
  setEngine: (engine) =>
    set({ engine: engine === 'cloud' && !get().cloudAvailable ? 'on-device' : engine }),
  // Swapping only makes sense when the source is a concrete language, not "auto".
  swapLanguages: () =>
    set((s) => (s.source === AUTO ? s : { source: s.target, target: s.source })),
}));
