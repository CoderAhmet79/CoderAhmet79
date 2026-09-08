import { isSameCard } from './cards';
import { findForcedWinner } from './claim';
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

// Biten bir el için skoru hesaplar, toplamları günceller ve skor tablosuna
// bir satır ekler. `hand.finished` zaten true olmalı.
function finalizeHand(state: GameState, hand: HandState): GameState {
  const handScores = scoreHand(hand);
  const finishedHand = { ...hand, handScores };
  const totals: [number, number, number, number] = [
    state.totals[0] + handScores[0],
    state.totals[1] + handScores[1],
    state.totals[2] + handScores[2],
    state.totals[3] + handScores[3],
  ];
  const scoreRow: HandScoreRow = {
    handNo: finishedHand.handNo,
    contract: finishedHand.contract!,
    declarer: finishedHand.declarer,
    trumpSuit: finishedHand.trumpSuit,
    scores: handScores,
    cumulative: totals,
  };

  return {
    ...state,
    hand: finishedHand,
    totals,
    scoreTable: [...state.scoreTable, scoreRow],
    phase: 'HAND_OVER',
  };
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

  return hand.finished ? finalizeHand(state, hand) : { ...state, hand };
}

// Koz elinde, sırası gelen oyuncu (bir trick'in başında) rakipler ne
// oynarsa oynasın kalan tüm trickleri kazanmayı garanti edebiliyorsa true
// döner — bkz. claim.ts. Yalnızca `player`in sırası geldiğinde anlamlıdır.
export function canClaimRemainingTricks(state: GameState, player: PlayerId): boolean {
  if (!state.hand || state.phase !== 'PLAYING') return false;
  if (state.hand.turn !== player) return false;
  return findForcedWinner(state.hand, state.ruleSet) === player;
}

// Garantiyi doğrular ve kalan tüm trickleri `player`e yazarak eli hemen
// bitirir — kartlar tek tek oynanmaz, kartlar `player`in gerçek elinden
// alınır (uydurma veri yok), yalnızca karşı taraf oynatılmaz.
export function claimRemainingTricks(state: GameState, player: PlayerId): GameState {
  if (!canClaimRemainingTricks(state, player)) {
    throw new Error(`Oyuncu ${player} kalan elleri talep edemez`);
  }
  const hand = state.hand!;
  const claimedTricks: Trick[] = hand.hands[player].map((card) => ({
    leader: player,
    winner: player,
    plays: [{ player, card }],
  }));

  const finishedHand: HandState = {
    ...hand,
    hands: [[], [], [], []],
    currentTrick: { leader: player, plays: [] },
    completedTricks: [...hand.completedTricks, ...claimedTricks],
    turn: player,
    finished: true,
  };

  return finalizeHand(state, finishedHand);
}
