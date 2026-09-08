import { Card, HandState, Rank, Suit, Trick } from '../src/engine/types';

export function card(suit: Suit, rank: Rank): Card {
  return { suit, rank };
}

export function trick(
  plays: { player: 0 | 1 | 2 | 3; card: Card }[],
  winner?: 0 | 1 | 2 | 3,
): Trick {
  return { leader: plays[0].player, plays, winner };
}

export function baseHand(overrides: Partial<HandState> = {}): HandState {
  return {
    handNo: 1,
    dealer: 3,
    declarer: 0,
    contract: null,
    trumpSuit: null,
    hands: [[], [], [], []],
    currentTrick: { leader: 0, plays: [] },
    completedTricks: [],
    turn: 0,
    finished: false,
    handScores: [0, 0, 0, 0],
    ...overrides,
  };
}
