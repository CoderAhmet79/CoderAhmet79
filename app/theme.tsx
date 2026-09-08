import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { PlayingCard } from '../src/components/Card';
import { tr } from '../src/i18n/tr';
import { Theme } from '../src/theme/themes';
import { useThemeContext } from '../src/theme/useTheme';

export default function ThemeScreen() {
  const { theme, themeId, setThemeId, themes } = useThemeContext();

  return (
    <View style={[styles.container, { backgroundColor: theme.table }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.back, { color: theme.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>{tr.theme.title}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {themes.map((t) => (
          <ThemeCard key={t.id} theme={t} active={t.id === themeId} onPress={() => setThemeId(t.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

function ThemeCard({ theme, active, onPress }: { theme: Theme; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.card,
        { backgroundColor: theme.table, borderColor: active ? theme.accent : 'transparent' },
      ]}
    >
      <View style={styles.previewRow}>
        <PlayingCard card={{ suit: 'S', rank: 14 }} width={44} />
        <View style={styles.overlap}>
          <PlayingCard card={{ suit: 'H', rank: 13 }} width={44} />
        </View>
        <View style={styles.overlap}>
          <PlayingCard faceDown width={44} />
        </View>
      </View>
      <Text style={[styles.cardName, { color: theme.text }]}>{theme.name}</Text>
      {active ? <Text style={[styles.activeLabel, { color: theme.accent }]}>✓</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 56,
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 16,
  },
  back: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 12,
  },
  card: {
    borderRadius: 12,
    borderWidth: 2,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  previewRow: {
    flexDirection: 'row',
  },
  overlap: {
    marginLeft: -12,
  },
  cardName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  activeLabel: {
    fontSize: 20,
    fontWeight: '700',
  },
});
