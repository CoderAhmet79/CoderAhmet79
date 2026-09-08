import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { AgentLevel } from '../src/ai/agent';
import { tr } from '../src/i18n/tr';
import { useGameStore } from '../src/store/gameStore';
import { useSettingsStore } from '../src/store/settingsStore';
import { useTheme } from '../src/theme/useTheme';

export default function NewGameScreen() {
  const theme = useTheme();
  const startNewGame = useGameStore((s) => s.startNewGame);
  const ruleSet = useSettingsStore((s) => s.settings.ruleSet);
  const [level, setLevel] = useState<AgentLevel>('MEDIUM');
  const [playerName, setPlayerName] = useState('');
  const [opponent1, setOpponent1] = useState('');
  const [opponent2, setOpponent2] = useState('');
  const [opponent3, setOpponent3] = useState('');

  function handleStart() {
    startNewGame({
      level,
      playerNames: [playerName || 'Sen', opponent1 || 'Kemal', opponent2 || 'Ayşe', opponent3 || 'Selim'],
      ruleSet,
    });
    router.replace('/game');
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.table }]}
      contentContainerStyle={styles.content}
    >
      <TouchableOpacity onPress={() => router.back()}>
        <Text style={[styles.back, { color: theme.text }]}>←</Text>
      </TouchableOpacity>
      <Text style={[styles.title, { color: theme.text }]}>{tr.newGame.title}</Text>

      <Text style={[styles.label, { color: theme.textMuted }]}>{tr.newGame.difficulty}</Text>
      <View style={styles.difficultyRow}>
        <DifficultyButton label={tr.newGame.medium} selected={level === 'MEDIUM'} onPress={() => setLevel('MEDIUM')} />
        <DifficultyButton label={tr.newGame.hard} selected={level === 'HARD'} onPress={() => setLevel('HARD')} />
      </View>

      <Field label={tr.newGame.playerName} value={playerName} onChangeText={setPlayerName} placeholder="Sen" />
      <Field label={tr.newGame.opponent1} value={opponent1} onChangeText={setOpponent1} placeholder="Kemal" />
      <Field label={tr.newGame.opponent2} value={opponent2} onChangeText={setOpponent2} placeholder="Ayşe" />
      <Field label={tr.newGame.opponent3} value={opponent3} onChangeText={setOpponent3} placeholder="Selim" />

      <TouchableOpacity style={[styles.startButton, { backgroundColor: theme.accent }]} onPress={handleStart}>
        <Text style={[styles.startButtonText, { color: theme.table }]}>{tr.newGame.start}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function DifficultyButton({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.difficultyButton,
        { borderColor: theme.accent, backgroundColor: selected ? theme.accent : 'transparent' },
      ]}
    >
      <Text style={[styles.difficultyButtonText, { color: selected ? theme.table : theme.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
}) {
  const theme = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: theme.textMuted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        style={[styles.input, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.cardBorder }]}
      />
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
    gap: 4,
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
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
  },
  difficultyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  difficultyButton: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  difficultyButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  field: {
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  startButton: {
    marginTop: 32,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
