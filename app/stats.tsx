import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { ALL_CONTRACTS } from '../src/engine/types';
import { tr } from '../src/i18n/tr';
import { useStatsStore } from '../src/store/statsStore';
import { useTheme } from '../src/theme/useTheme';

export default function StatsScreen() {
  const theme = useTheme();
  const stats = useStatsStore((s) => s.stats);

  const winRate = stats.gamesPlayed > 0 ? Math.round((stats.wins / stats.gamesPlayed) * 100) : 0;

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.table }]} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={[styles.back, { color: theme.text }]}>←</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: theme.text }]}>{tr.stats.title}</Text>

      <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
        <SummaryRow label={tr.stats.gamesPlayed} value={String(stats.gamesPlayed)} />
        <SummaryRow label={tr.stats.winRate} value={`%${winRate}`} />
        <SummaryRow label={tr.stats.bestScore} value={stats.bestScore === null ? '—' : String(stats.bestScore)} />
      </View>

      <Text style={[styles.label, { color: theme.textMuted }]}>{tr.stats.byContract}</Text>
      <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
        {ALL_CONTRACTS.map((contract) => {
          const stat = stats.contractStats[contract];
          const avg = stat.count > 0 ? (stat.totalScore / stat.count).toFixed(0) : '—';
          return (
            <View key={contract} style={styles.contractRow}>
              <Text style={[styles.contractLabel, { color: theme.text }]}>{tr.contracts[contract]}</Text>
              <Text style={[styles.contractMeta, { color: theme.textMuted }]}>{stat.count}x</Text>
              <Text style={[styles.contractAvg, { color: theme.text }]}>{avg}</Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={styles.summaryRow}>
      <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>{label}</Text>
      <Text style={[styles.summaryValue, { color: theme.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingTop: 56,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  back: {
    fontSize: 24,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: 20,
  },
  summaryCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  contractRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  contractLabel: {
    flex: 1,
    fontSize: 14,
  },
  contractMeta: {
    fontSize: 12,
    width: 40,
    textAlign: 'right',
  },
  contractAvg: {
    fontSize: 14,
    fontWeight: '700',
    width: 56,
    textAlign: 'right',
  },
});
