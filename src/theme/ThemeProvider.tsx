import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useEffect, useState } from 'react';

import { defaultThemeId, getTheme, Theme, ThemeId, themes } from './themes';

const STORAGE_KEY = 'rifki:theme';

export type ThemeContextValue = {
  theme: Theme;
  themeId: ThemeId;
  setThemeId: (id: ThemeId) => void;
  themes: Theme[];
};

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeIdState] = useState<ThemeId>(defaultThemeId);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((stored) => {
        if (stored && themes.some((t) => t.id === stored)) {
          setThemeIdState(stored as ThemeId);
        }
      })
      .catch(() => {});
  }, []);

  const setThemeId = useCallback((id: ThemeId) => {
    setThemeIdState(id);
    AsyncStorage.setItem(STORAGE_KEY, id).catch(() => {});
  }, []);

  const value: ThemeContextValue = {
    theme: getTheme(themeId),
    themeId,
    setThemeId,
    themes,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
