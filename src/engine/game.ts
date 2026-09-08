import { isSameCard } from './cards';
import { dealCards } from './deck';
import { createRng } from './rng';
import { determineTrickWinner, isHandFinished, legalPlaysInHand } from './rules';
import { scoreHand } from './scoring';
import {
  Card,
  Contract,
  GameState,
  HandScoreRow,
  HandState,
  PENALTY_CONTRACTS,
  Player,
  PlayerId,
  RuleSet,
  Suit,
  Trick,
  TOTAL_HANDS,
} from './types';

export function nextPlayer(player: PlayerId): PlayerId {
  return (((player + 1) % 4) as PlayerId);
}

const DEFAULT_PLAYERS: Player[] = [
  { id: 0, name: 'Sen', isHuman: true },
  { id: 1, name: 'Kemal', isHuman: false },
  { id: 2, name: 'Ayşe', isHuman: false },
  { id: 3, name: 'Selim', isHuman: false },
];

export function createGame(ruleSet: RuleSet, seed: number, players: Player[] = DEFAULT_PLAYERS): GameState {
  const contractsRemaining = {} as Record<Contract, number>;
  for (const contract of PENALTY_CONTRACTS) contractsRemaining[contract] = 2;
  contractsRemaining.TRUMP = 8;

  const playerQuota = {} as GameState['playerQuota'];
  for (const player of players) {
    playerQuota[player.id] = { penalty: 3, trump: 2 };
  }

  return {
    ruleSet,
    seed,
    players,
    contractsRemaining,
    playerQuota,
    scoreTable: [],
    totals: [0, 0, 0, 0],
    hand: null,
    phase: 'HAND_OVER',
  };
}

// Yeni bir el dağıtır: dağıtan bir önceki elin dağıtanından sonraki oyuncu
// (ilk elde oyuncu 0), dağıtanın sağındaki (yönde bir sonraki) oyuncu
// kontratı seçer ve ilk trick'i açar.
export function dealHand(state: GameState): GameState {
  const dealer: PlayerId = state.hand ? nextPlayer(state.hand.dealer) : 0;
  const handNo = state.hand ? state.hand.handNo + 1 : 1;
  const declarer = nextPlayer(dealer);

  const rng = createRng(state.seed);
  const hands = dealCards(rng);

  const hand: HandState = {
    handNo,
    dealer,
    declarer,
    contract: null,
    trumpSuit: null,
    hands,
    currentTrick: { leader: declarer, plays: [] },
    completedTricks: [],
    turn: declarer,
    finished: false,
    handScores: [0, 0, 0, 0],
  };

  return {
    ...state,
    seed: rng.getState(),
    hand,
    phase: 'CHOOSE_CONTRACT',
  };
}

export function nextHand(state: GameState): GameState {
  if (state.hand && state.hand.handNo >= TOTAL_HANDS) {
    return { ...state, phase: 'GAME_OVER' };
  }
  return dealHand(state);
}

export function availableContracts(state: GameState, player: PlayerId): Contract[] {
  const quota = state.playerQuota[player];
  const result: Contract[] = [];
  for (const contract of PENALTY_CONTRACTS) {
    if (quota.penalty > 0 && state.contractsRemaining[contract] > 0) {
      result.push(contract);
    }
  }
  if (quota.trump > 0 && state.contractsRemaining.TRUMP > 0) {
    result.push('TRUMP');
  }
  return result;
}

export function chooseContract(state: GameState, contract: Contract): GameState {
  if (!state.hand || state.phase !== 'CHOOSE_CONTRACT') {
    throw new Error('Kontrat şu anda seçilemez');
  }
  const declarer = state.hand.declarer;
  const available = availableContracts(state, declarer);
  if (!available.includes(contract)) {
    throw new Error(`Kontrat ${contract} oyuncu ${declarer} için seçilemez`);
  }

  const isTrump = contract === 'TRUMP';
  const contractsRemaining = {
    ...state.contractsRemaining,
    [contract]: state.contractsRemaining[contract] - 1,
  };
  const quota = state.playerQuota[declarer];
  const playerQuota = {
    ...state.playerQuota,
    [declarer]: {
      penalty: quota.penalty - (isTrump ? 0 : 1),
      trump: quota.trump - (isTrump ? 1 : 0),
    },
  };

  return {
    ...state,
    contractsRemaining,
    playerQuota,
    hand: { ...state.hand, contract },
    phase: isTrump ? 'CHOOSE_TRUMP' : 'PLAYING',
  };
}

export function chooseTrump(state: GameState, suit: Suit): GameState {
  if (!state.hand || state.phase !== 'CHOOSE_TRUMP') {
    throw new Error('Koz şu anda seçilemez');
  }
  return {
    ...state,
    hand: { ...state.hand, trumpSuit: suit },
    phase: 'PLAYING',
  };
}

export function legalPlays(state: GameState, player: PlayerId): Card[] {
  if (!state.hand) return [];
  return legalPlaysInHand(state.hand, player, state.ruleSet);
}

function removeCardFromHand(hand: HandState, player: PlayerId, card: Card): HandState {
  const hands = hand.hands.map((playerCards, index) =>
    index === player ? playerCards.filter((c) => !isSameCard(c, card)) : playerCards,
  );
  return { ...hand, hands };
}

export function playCard(state: GameState, player: PlayerId, card: Card): GameState {
  if (!state.hand) throw new Error('Sürmekte olan bir el yok');
  if (state.phase !== 'PLAYING') throw new Error('Şu anda kart oynanamaz');
  if (state.hand.turn !== player) throw new Error(`Sıra oyuncu ${player}'de değil`);

  const legal = legalPlays(state, player);
  if (!legal.some((c) => isSameCard(c, card))) {
    throw new Error(`Oyuncu ${player} için ${card.suit}${card.rank} kuraldışı`);
  }

  const handAfterRemoval = removeCardFromHand(state.hand, player, card);
  const trick: Trick = {
    ...handAfterRemoval.currentTrick,
    plays: [...handAfterRemoval.currentTrick.plays, { player, card }],
  };

  let hand: HandState;
  if (trick.plays.length === 4) {
    const winner = determineTrickWinner(handAfterRemoval, trick);
    const completedTrick: Trick = { ...trick, winner };
    const completedTricks = [...handAfterRemoval.completedTricks, completedTrick];
    const finished = isHandFinished(handAfterRemoval, completedTricks, state.ruleSet);
    hand = {
      ...handAfterRemoval,
      completedTricks,
      currentTrick: { leader: winner, plays: [] },
      turn: winner,
      finished,
    };
  } else {
    hand = {
      ...handAfterRemoval,
      currentTrick: trick,
      turn: nextPlayer(player),
    };
  }

  if (!hand.finished) {
    return { ...state, hand };
  }

  const handScores = scoreHand(hand);
  hand = { ...hand, handScores };
  const totals: [number, number, number, number] = [
    state.totals[0] + handScores[0],
    state.totals[1] + handScores[1],
    state.totals[2] + handScores[2],
    state.totals[3] + handScores[3],
  ];
  const scoreRow: HandScoreRow = {
    handNo: hand.handNo,
    contract: hand.contract!,
    declarer: hand.declarer,
    trumpSuit: hand.trumpSuit,
    scores: handScores,
    cumulative: totals,
  };

  return {
    ...state,
    hand,
    totals,
    scoreTable: [...state.scoreTable, scoreRow],
    phase: 'HAND_OVER',
  };
}
