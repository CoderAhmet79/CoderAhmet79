import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Celebration } from '../src/components/Celebration';
import { tr } from '../src/i18n/tr';
import { useGameStore } from '../src/store/gameStore';
import { useTheme } from '../src/theme/useTheme';

export default function GameOverScreen() {
  const theme = useTheme();
  const state = useGameStore((s) => s.state);
  const resetGame = useGameStore((s) => s.resetGame);
  const [showCelebration, setShowCelebration] = useState(true);

  if (!state) {
    return (
      <View style={[styles.container, { backgroundColor: theme.table }]}>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.accent }]} onPress={() => router.replace('/')}>
          <Text style={[styles.buttonText, { color: theme.table }]}>{tr.gameOver.mainMenu}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const ranking = state.players
    .map((p) => ({ player: p, total: state.totals[p.id] }))
    .sort((a, b) => b.total - a.total);
  const winner = ranking[0];
  const isSoloWinner = winner.total > ranking[1].total;
  const humanWon = isSoloWinner && winner.player.isHuman;

  return (
    <View style={[styles.container, { backgroundColor: theme.table }]}>
      <Text style={[styles.title, { color: theme.text }]}>{tr.gameOver.title}</Text>

      <View style={[styles.rankCard, { backgroundColor: theme.surface }]}>
        {ranking.map((row, i) => (
          <View key={row.player.id} style={styles.rankRow}>
            <Text style={[styles.rankPosition, { color: theme.accent }]}>{i + 1}.</Text>
            <Text style={[styles.rankName, { color: theme.text }]}>{row.player.name}</Text>
            <Text style={[styles.rankScore, { color: theme.text }]}>{row.total}</Text>
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: theme.accent }]}
        onPress={() => {
          resetGame();
          router.replace('/new-game');
        }}
      >
        <Text style={[styles.buttonText, { color: theme.table }]}>{tr.gameOver.playAgain}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.buttonOutline, { borderColor: theme.accent }]}
        onPress={() => {
          resetGame();
          router.replace('/');
        }}
      >
        <Text style={[styles.buttonOutlineText, { color: theme.text }]}>{tr.gameOver.mainMenu}</Text>
      </TouchableOpacity>

      {humanWon && showCelebration ? (
        <Celebration
          playerName={winner.player.name}
          score={winner.total}
          onFinished={() => setShowCelebration(false)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  rankCard: {
    width: '100%',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    gap: 10,
  },
  rankRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  rankPosition: {
    fontSize: 16,
    fontWeight: '700',
    width: 24,
  },
  rankName: {
    fontSize: 16,
    flex: 1,
  },
  rankScore: {
    fontSize: 16,
    fontWeight: '700',
  },
  button: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  buttonOutline: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
  },
  buttonOutlineText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
