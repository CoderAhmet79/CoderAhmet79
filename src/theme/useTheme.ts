import { useContext } from 'react';

import { ThemeContext, ThemeContextValue } from './ThemeProvider';
import { Theme } from './themes';

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useThemeContext, ThemeProvider içinde kullanılmalı');
  return ctx;
}

export function useTheme(): Theme {
  return useThemeContext().theme;
}
