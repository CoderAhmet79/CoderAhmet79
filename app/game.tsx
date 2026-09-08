import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, BackHandler, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ContractSheet, TrumpSheet } from '../src/components/ContractSheet';
import { Hand } from '../src/components/Hand';
import { LastTrickPopover } from '../src/components/LastTrickPopover';
import { OpponentSeat } from '../src/components/OpponentSeat';
import { ScoreTable } from '../src/components/ScoreTable';
import { TableCenter } from '../src/components/TableCenter';
import { TopBar } from '../src/components/TopBar';
import { availableContracts, canClaimRemainingTricks, legalPlays } from '../src/engine/game';
import { scoreHand } from '../src/engine/scoring';
import { PlayerId } from '../src/engine/types';
import { tr } from '../src/i18n/tr';
import { HUMAN_PLAYER, useGameStore } from '../src/store/gameStore';
import { loadSavedGame } from '../src/store/persistence';
import { useTheme } from '../src/theme/useTheme';

export default function GameScreen() {
  const theme = useTheme();
  const state = useGameStore((s) => s.state);
  const loadGame = useGameStore((s) => s.loadGame);
  const chooseContract = useGameStore((s) => s.chooseContract);
  const chooseTrump = useGameStore((s) => s.chooseTrump);
  const playCard = useGameStore((s) => s.playCard);
  const claimRemainingTricks = useGameStore((s) => s.claimRemainingTricks);
  const continueAfterHandOver = useGameStore((s) => s.continueAfterHandOver);
  const [scoreTableVisible, setScoreTableVisible] = useState(false);
  const [lastTrickVisible, setLastTrickVisible] = useState(false);
  const [triedResume, setTriedResume] = useState(false);

  useEffect(() => {
    if (state?.phase === 'GAME_OVER') {
      router.replace('/game-over');
    }
  }, [state?.phase]);

  useEffect(() => {
    if (state || triedResume) return;
    loadSavedGame().then((saved) => {
      if (saved) loadGame(saved.state, saved.level);
      setTriedResume(true);
    });
  }, [state, triedResume, loadGame]);

  // Geri tuşu: sürmekte olan bir el varken doğrudan çıkışı engelle, onay iste.
  // İlerleme zaten her hamlede otomatik kaydedildiği için "Devam Et" ile geri
  // dönülebilir.
  useEffect(() => {
    if (!state?.hand || state.phase === 'GAME_OVER') return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      Alert.alert(tr.exitConfirm.title, tr.exitConfirm.message, [
        { text: tr.exitConfirm.cancel, style: 'cancel' },
        { text: tr.exitConfirm.confirm, style: 'destructive', onPress: () => router.replace('/') },
      ]);
      return true;
    });
    return () => sub.remove();
  }, [state?.hand, state?.phase]);

  if (!state || !state.hand) {
    return (
      <View style={[styles.empty, { backgroundColor: theme.table }]}>
        <Text style={[styles.emptyText, { color: theme.text }]}>
          {triedResume ? 'Sürmekte olan bir oyun yok.' : 'Yükleniyor…'}
        </Text>
        {triedResume ? (
          <TouchableOpacity style={[styles.emptyButton, { backgroundColor: theme.accent }]} onPress={() => router.replace('/new-game')}>
            <Text style={[styles.emptyButtonText, { color: theme.table }]}>{tr.menu.newGame}</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }

  const hand = state.hand;
  const phase = state.phase;
  const myHand = hand.hands[HUMAN_PLAYER];
  const legal = phase === 'PLAYING' && hand.turn === HUMAN_PLAYER ? legalPlays(state, HUMAN_PLAYER) : [];
  const liveScores = hand.contract ? scoreHand(hand) : [0, 0, 0, 0];
  const lastCompletedTrick = hand.completedTricks.length > 0 ? hand.completedTricks[hand.completedTricks.length - 1] : null;
  const claimAvailable =
    phase === 'PLAYING' &&
    hand.turn === HUMAN_PLAYER &&
    hand.currentTrick.plays.length === 0 &&
    canClaimRemainingTricks(state, HUMAN_PLAYER);

  function isSeatTurn(id: PlayerId): boolean {
    return hand.turn === id && (phase === 'PLAYING' || phase === 'CHOOSE_CONTRACT');
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.table }]} edges={['left', 'right']}>
      <TopBar hand={hand} players={state.players} />

      <View style={styles.topOpponentRow}>
        <OpponentSeat
          player={state.players[2]}
          score={liveScores[2]}
          cardCount={hand.hands[2].length}
          isTurn={isSeatTurn(2)}
          position="top"
        />
      </View>

      <View style={styles.middleRow}>
        <OpponentSeat
          player={state.players[1]}
          score={liveScores[1]}
          cardCount={hand.hands[1].length}
          isTurn={isSeatTurn(1)}
          position="left"
        />
        <TableCenter hand={hand} myId={HUMAN_PLAYER} />
        <OpponentSeat
          player={state.players[3]}
          score={liveScores[3]}
          cardCount={hand.hands[3].length}
          isTurn={isSeatTurn(3)}
          position="right"
        />
      </View>

      <View style={styles.bottomArea}>
        {claimAvailable ? (
          <View style={styles.claimBanner}>
            <Text style={[styles.claimText, { color: theme.accent }]}>{tr.table.claimAvailable}</Text>
            <TouchableOpacity style={[styles.claimButton, { backgroundColor: theme.accent }]} onPress={claimRemainingTricks}>
              <Text style={[styles.claimButtonText, { color: theme.table }]}>{tr.table.claimButton}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        <View style={styles.utilityRow}>
          <TouchableOpacity
            style={[styles.scoreButton, { backgroundColor: theme.surface, opacity: lastCompletedTrick ? 1 : 0.4 }]}
            disabled={!lastCompletedTrick}
            onPress={() => setLastTrickVisible(true)}
          >
            <Text style={[styles.scoreButtonText, { color: theme.text }]}>Son El</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.scoreButton, { backgroundColor: theme.surface }]} onPress={() => setScoreTableVisible(true)}>
            <Text style={[styles.scoreButtonText, { color: theme.text }]}>{tr.scoreTable.title}</Text>
          </TouchableOpacity>
        </View>
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
      <LastTrickPopover
        visible={lastTrickVisible}
        onClose={() => setLastTrickVisible(false)}
        trick={lastCompletedTrick}
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
  topOpponentRow: {
    alignItems: 'center',
    marginTop: 4,
  },
  middleRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  bottomArea: {},
  claimBanner: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  claimText: {
    fontSize: 12,
    fontWeight: '700',
  },
  claimButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  claimButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  utilityRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  scoreButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
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
