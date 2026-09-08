import {
  Card,
  Contract,
  GameState,
  HandScoreRow,
  HandState,
  Player,
  PlayerId,
  RuleSet,
  Suit,
  Trick,
} from './types';

export type PublicHandView = {
  handNo: number;
  dealer: PlayerId;
  declarer: PlayerId;
  contract: Contract | null;
  trumpSuit: Suit | null;
  myHand: Card[];
  handSizes: [number, number, number, number];
  currentTrick: Trick;
  completedTricks: Trick[];
  turn: PlayerId;
  finished: boolean;
  // Renge uymadığı gözlenen oyuncu -> o rengin listesi.
  voidSuits: Record<PlayerId, Suit[]>;
};

export type PublicState = {
  self: PlayerId;
  ruleSet: RuleSet;
  players: Player[];
  contractsRemaining: Record<Contract, number>;
  playerQuota: GameState['playerQuota'];
  scoreTable: HandScoreRow[];
  totals: [number, number, number, number];
  phase: GameState['phase'];
  hand: PublicHandView | null;
};

function computeVoidSuits(hand: HandState): Record<PlayerId, Suit[]> {
  const result: Record<PlayerId, Suit[]> = { 0: [], 1: [], 2: [], 3: [] };
  const allTricks = [...hand.completedTricks, hand.currentTrick];
  for (const trick of allTricks) {
    if (trick.plays.length === 0) continue;
    const ledSuit = trick.plays[0].card.suit;
    for (const play of trick.plays) {
      if (play.card.suit !== ledSuit && !result[play.player].includes(ledSuit)) {
        result[play.player].push(ledSuit);
      }
    }
  }
  return result;
}

// AI ve UI, oyuncunun görebileceği her şeyi bu görünümden alır; tam
// GameState'e (diğer oyuncuların elleri dahil) erişemez.
export function publicView(state: GameState, player: PlayerId): PublicState {
  const base = {
    self: player,
    ruleSet: state.ruleSet,
    players: state.players,
    contractsRemaining: state.contractsRemaining,
    playerQuota: state.playerQuota,
    scoreTable: state.scoreTable,
    totals: state.totals,
    phase: state.phase,
  };

  if (!state.hand) {
    return { ...base, hand: null };
  }

  const hand = state.hand;
  const handSizes = hand.hands.map((h) => h.length) as [number, number, number, number];

  return {
    ...base,
    hand: {
      handNo: hand.handNo,
      dealer: hand.dealer,
      declarer: hand.declarer,
      contract: hand.contract,
      trumpSuit: hand.trumpSuit,
      myHand: hand.hands[player],
      handSizes,
      currentTrick: hand.currentTrick,
      completedTricks: hand.completedTricks,
      turn: hand.turn,
      finished: hand.finished,
      voidSuits: computeVoidSuits(hand),
    },
  };
}
