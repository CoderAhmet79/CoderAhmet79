import { StatusBar } from 'expo-status-bar';
import { Link } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { tr } from '../src/i18n/tr';
import { hasSavedGame } from '../src/store/persistence';
import { useTheme } from '../src/theme/useTheme';

export default function MainMenu() {
  const theme = useTheme();
  const [canContinue, setCanContinue] = useState(false);

  useEffect(() => {
    hasSavedGame().then(setCanContinue);
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.table }]}>
      <Text style={[styles.title, { color: theme.text }]}>{tr.appName}</Text>
      <MenuLink href="/new-game" label={tr.menu.newGame} />
      {canContinue ? <MenuLink href="/game" label={tr.menu.continueGame} /> : null}
      <MenuLink href="/stats" label={tr.menu.stats} />
      <MenuLink href="/settings" label={tr.menu.settings} />
      <MenuLink href="/theme" label={tr.menu.theme} />
      <StatusBar style={theme.isDark ? 'light' : 'dark'} />
    </View>
  );
}

function MenuLink({ href, label }: { href: Parameters<typeof Link>[0]['href']; label: string }) {
  const theme = useTheme();
  return (
    <Link href={href} style={[styles.link, { backgroundColor: theme.accent }]}>
      <Text style={[styles.linkText, { color: theme.table }]}>{label}</Text>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 24,
  },
  link: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 200,
  },
  linkText: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
