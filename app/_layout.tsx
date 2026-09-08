import { Stack } from 'expo-router';
import { useEffect } from 'react';

import { useSettingsStore } from '../src/store/settingsStore';
import { useStatsStore } from '../src/store/statsStore';
import { ThemeProvider } from '../src/theme/ThemeProvider';

export default function RootLayout() {
  const loadSettings = useSettingsStore((s) => s.load);
  const loadStats = useStatsStore((s) => s.load);

  useEffect(() => {
    loadSettings();
    loadStats();
  }, [loadSettings, loadStats]);

  return (
    <ThemeProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="new-game" />
        <Stack.Screen name="game" />
        <Stack.Screen name="game-over" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="theme" />
        <Stack.Screen name="stats" />
      </Stack>
    </ThemeProvider>
  );
}
