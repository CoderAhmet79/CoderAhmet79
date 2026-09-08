import { router } from 'expo-router';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';

import { tr } from '../src/i18n/tr';
import { AnimationSpeed, useSettingsStore } from '../src/store/settingsStore';
import { useTheme } from '../src/theme/useTheme';

export default function SettingsScreen() {
  const theme = useTheme();
  const settings = useSettingsStore((s) => s.settings);
  const update = useSettingsStore((s) => s.update);
  const updateRuleSet = useSettingsStore((s) => s.updateRuleSet);

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.table }]} contentContainerStyle={styles.content}>
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={[styles.back, { color: theme.text }]}>←</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: theme.text }]}>{tr.settings.title}</Text>

      <ToggleRow
        label={tr.settings.mustTrumpWhenVoid}
        value={settings.ruleSet.mustTrumpWhenVoid}
        onChange={(v) => updateRuleSet({ mustTrumpWhenVoid: v })}
      />
      <ToggleRow
        label={tr.settings.earlyEnd}
        value={settings.ruleSet.earlyEndOnPenaltyExhausted}
        onChange={(v) => updateRuleSet({ earlyEndOnPenaltyExhausted: v })}
      />
      <ToggleRow
        label={tr.settings.confirmPlay}
        value={settings.confirmPlay}
        onChange={(v) => update({ confirmPlay: v })}
      />
      <ToggleRow
        label={tr.settings.haptics}
        value={settings.hapticsEnabled}
        onChange={(v) => update({ hapticsEnabled: v })}
      />
      <ToggleRow label={tr.settings.sound} value={settings.soundEnabled} onChange={(v) => update({ soundEnabled: v })} />

      <Text style={[styles.label, { color: theme.textMuted }]}>{tr.settings.animationSpeed}</Text>
      <View style={styles.speedRow}>
        {(['slow', 'normal', 'fast'] as AnimationSpeed[]).map((speed) => (
          <TouchableOpacity
            key={speed}
            onPress={() => update({ animationSpeed: speed })}
            style={[
              styles.speedButton,
              { borderColor: theme.accent, backgroundColor: settings.animationSpeed === speed ? theme.accent : 'transparent' },
            ]}
          >
            <Text style={[styles.speedButtonText, { color: settings.animationSpeed === speed ? theme.table : theme.text }]}>
              {speedLabel(speed)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function speedLabel(speed: AnimationSpeed): string {
  switch (speed) {
    case 'slow':
      return 'Yavaş';
    case 'normal':
      return 'Normal';
    case 'fast':
      return 'Hızlı';
  }
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, { color: theme.text }]}>{label}</Text>
      <Switch value={value} onValueChange={onChange} trackColor={{ true: theme.accent }} />
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.3)',
  },
  rowLabel: {
    fontSize: 15,
    flex: 1,
    marginRight: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 8,
  },
  speedRow: {
    flexDirection: 'row',
    gap: 10,
  },
  speedButton: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  speedButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
