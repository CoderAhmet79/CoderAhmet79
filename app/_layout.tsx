import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="new-game" />
      <Stack.Screen name="game" />
      <Stack.Screen name="game-over" />
      <Stack.Screen name="settings" />
      <Stack.Screen name="theme" />
      <Stack.Screen name="stats" />
    </Stack>
  );
}
