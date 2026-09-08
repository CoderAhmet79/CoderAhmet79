import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { defaultRuleSet, RuleSet } from '../engine/types';

const STORAGE_KEY = 'rifki:settings';

export type AnimationSpeed = 'slow' | 'normal' | 'fast';

export type Settings = {
  ruleSet: RuleSet;
  confirmPlay: boolean;
  animationSpeed: AnimationSpeed;
  hapticsEnabled: boolean;
  soundEnabled: boolean; // V1'de ses yok; anahtar hazır dursun.
};

export const defaultSettings: Settings = {
  ruleSet: defaultRuleSet,
  confirmPlay: false,
  animationSpeed: 'normal',
  hapticsEnabled: true,
  soundEnabled: false,
};

type SettingsStore = {
  settings: Settings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Settings>) => void;
  updateRuleSet: (patch: Partial<RuleSet>) => void;
};

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  loaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Settings>;
        set({
          settings: { ...defaultSettings, ...parsed, ruleSet: { ...defaultSettings.ruleSet, ...parsed.ruleSet } },
          loaded: true,
        });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  update: (patch) => {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  },

  updateRuleSet: (patch) => {
    const next = { ...get().settings, ruleSet: { ...get().settings.ruleSet, ...patch } };
    set({ settings: next });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  },
}));
