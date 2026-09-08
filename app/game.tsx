import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContractSheet, TrumpSheet } from '../src/components/ContractSheet';
import { Hand } from '../src/components/Hand';
import { OpponentSeat } from '../src/components/OpponentSeat';
import { ScoreTable } from '../src/components/ScoreTable';
import { TableCenter } from '../src/components/TableCenter';
import { TopBar } from '../src/components/TopBar';
import { availableContracts, legalPlays } from '../src/engine/game';
import { scoreHand } from '../src/engine/scoring';
import { PlayerId } from '../src/engine/types';
import { tr } from '../src/i18n/tr';
import { HUMAN_PLAYER, useGameStore } from '../src/store/gameStore';
import { useTheme } from '../src/theme/useTheme';

export default function GameScreen() {
  const theme = useTheme();
  const state = useGameStore((s) => s.state);
  const chooseContract = useGameStore((s) => s.chooseContract);
  const chooseTrump = useGameStore((s) => s.chooseTrump);
  const playCard = useGameStore((s) => s.playCard);
  const continueAfterHandOver = useGameStore((s) => s.continueAfterHandOver);
  const [scoreTableVisible, setScoreTableVisible] = useState(false);

  useEffect(() => {
    if (state?.phase === 'GAME_OVER') {
      router.replace('/game-over');
    }
  }, [state?.phase]);

  if (!state || !state.hand) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.table }]}>
        <Text style={[styles.emptyText, { color: theme.text }]}>Sürmekte olan bir oyun yok.</Text>
        <TouchableOpacity style={[styles.emptyButton, { backgroundColor: theme.accent }]} onPress={() => router.replace('/new-game')}>
          <Text style={[styles.emptyButtonText, { color: theme.table }]}>{tr.menu.newGame}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const hand = state.hand;
  const myHand = hand.hands[HUMAN_PLAYER];
  const legal = state.phase === 'PLAYING' && hand.turn === HUMAN_PLAYER ? legalPlays(state, HUMAN_PLAYER) : [];
  const liveScores = hand.contract ? scoreHand(hand) : [0, 0, 0, 0];

  const seatOrder: PlayerId[] = [1, 2, 3];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.table }]} edges={['left', 'right']}>
      <TopBar hand={hand} players={state.players} />

      <View style={styles.opponentRow}>
        {seatOrder.map((id) => (
          <OpponentSeat
            key={id}
            player={state.players[id]}
            score={liveScores[id]}
            cardCount={hand.hands[id].length}
            isTurn={hand.turn === id && (state.phase === 'PLAYING' || state.phase === 'CHOOSE_CONTRACT')}
          />
        ))}
      </View>

      <TableCenter hand={hand} myId={HUMAN_PLAYER} />

      <View style={styles.bottomArea}>
        <TouchableOpacity style={[styles.scoreButton, { backgroundColor: theme.surface }]} onPress={() => setScoreTableVisible(true)}>
          <Text style={[styles.scoreButtonText, { color: theme.text }]}>{tr.scoreTable.title}</Text>
        </TouchableOpacity>
        <Hand
          cards={myHand}
          legal={legal}
          onPlay={(card) => {
            if (state.phase === 'PLAYING' && hand.turn === HUMAN_PLAYER) {
              playCard(card);
            }
          }}
        />
      </View>

      <ContractSheet
        visible={state.phase === 'CHOOSE_CONTRACT' && hand.declarer === HUMAN_PLAYER}
        options={availableContracts(state, HUMAN_PLAYER)}
        remaining={state.contractsRemaining}
        onChoose={chooseContract}
      />
      <TrumpSheet
        visible={state.phase === 'CHOOSE_TRUMP' && hand.declarer === HUMAN_PLAYER}
        onChoose={chooseTrump}
      />

      {state.phase === 'HAND_OVER' ? (
        <View style={styles.handOverOverlay}>
          <View style={[styles.handOverCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.handOverTitle, { color: theme.text }]}>{tr.handOver.title}</Text>
            {hand.handScores.map((score, i) => (
              <Text key={i} style={[styles.handOverRow, { color: theme.text }]}>
                {state.players[i].name}: {score >= 0 ? `+${score}` : score}
              </Text>
            ))}
            <TouchableOpacity style={[styles.continueButton, { backgroundColor: theme.accent }]} onPress={continueAfterHandOver}>
              <Text style={[styles.continueButtonText, { color: theme.table }]}>{tr.handOver.continue}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}

      <ScoreTable
        visible={scoreTableVisible}
        onClose={() => setScoreTableVisible(false)}
        scoreTable={state.scoreTable}
        players={state.players}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  emptyText: {
    fontSize: 16,
  },
  emptyButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  opponentRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 12,
  },
  bottomArea: {
    marginTop: 'auto',
  },
  scoreButton: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 8,
  },
  scoreButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  handOverOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  handOverCard: {
    borderRadius: 16,
    padding: 24,
    minWidth: 260,
    gap: 8,
  },
  handOverTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  handOverRow: {
    fontSize: 15,
  },
  continueButton: {
    marginTop: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});
