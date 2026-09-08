import { StatusBar } from 'expo-status-bar';
import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { tr } from '../src/i18n/tr';

export default function MainMenu() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{tr.appName}</Text>
      <MenuLink href="/new-game" label={tr.menu.newGame} />
      <MenuLink href="/game" label={tr.menu.continueGame} />
      <MenuLink href="/stats" label={tr.menu.stats} />
      <MenuLink href="/settings" label={tr.menu.settings} />
      <MenuLink href="/theme" label={tr.menu.theme} />
      <StatusBar style="auto" />
    </View>
  );
}

function MenuLink({ href, label }: { href: Parameters<typeof Link>[0]['href']; label: string }) {
  return (
    <Link href={href} style={styles.link}>
      <Text style={styles.linkText}>{label}</Text>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B5E3A',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FAF7F0',
    marginBottom: 24,
  },
  link: {
    backgroundColor: '#D4AF37',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 200,
  },
  linkText: {
    color: '#1B5E3A',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
});
