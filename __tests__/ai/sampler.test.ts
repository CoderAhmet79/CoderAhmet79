import { PublicState } from '../../src/engine/publicView';
import { sampleWorld } from '../../src/ai/sampler';
import { cardId } from '../../src/engine/cards';
import { createDeck } from '../../src/engine/deck';
import { createRng } from '../../src/engine/rng';
import { Card, PlayerId, Trick } from '../../src/engine/types';
import { card } from '../../test-utils/engineFixtures';

function fillerCards(count: number, exclude: Card[]): Card[] {
  const excludeIds = new Set(exclude.map(cardId));
  return createDeck()
    .filter((c) => !excludeIds.has(cardId(c)))
    .slice(0, count);
}

function fakeCompletedTricks(cards: Card[]): Trick[] {
  const tricks: Trick[] = [];
  for (let i = 0; i < cards.length; i += 4) {
    const chunk = cards.slice(i, i + 4);
    tricks.push({
      leader: 0,
      winner: 0,
      plays: chunk.map((c, idx) => ({ player: idx as PlayerId, card: c })),
    });
  }
  return tricks;
}

function buildView(overrides: {
  self?: PlayerId;
  myHand: Card[];
  handSizes: [number, number, number, number];
  completedTricks?: Trick[];
  voidSuits?: Record<PlayerId, ('S' | 'H' | 'D' | 'C')[]>;
}): PublicState {
  const self = overrides.self ?? 0;
  return {
    self,
    ruleSet: { mustTrumpWhenVoid: true, earlyEndOnPenaltyExhausted: true },
    players: [
      { id: 0, name: '', isHuman: true },
      { id: 1, name: '', isHuman: false },
      { id: 2, name: '', isHuman: false },
      { id: 3, name: '', isHuman: false },
    ],
    contractsRemaining: {} as PublicState['contractsRemaining'],
    playerQuota: {
      0: { penalty: 0, trump: 0 },
      1: { penalty: 0, trump: 0 },
      2: { penalty: 0, trump: 0 },
      3: { penalty: 0, trump: 0 },
    },
    scoreTable: [],
    totals: [0, 0, 0, 0],
    phase: 'PLAYING',
    hand: {
      handNo: 1,
      dealer: 3,
      declarer: 0,
      contract: 'NO_TRICKS',
      trumpSuit: null,
      myHand: overrides.myHand,
      handSizes: overrides.handSizes,
      currentTrick: { leader: 0, plays: [] },
      completedTricks: overrides.completedTricks ?? [],
      turn: 0,
      finished: false,
      voidSuits: overrides.voidSuits ?? { 0: [], 1: [], 2: [], 3: [] },
    },
  };
}

describe('sampleWorld', () => {
  it('gives each opponent exactly their known remaining card count, with no overlaps', () => {
    // Pool = 52 - myHand(5) - played(32) = 15, matching the opponents' need (5+5+5).
    const myHand = [card('C', 2), card('C', 3), card('C', 4), card('C', 5), card('C', 6)];
    const played = fillerCards(32, myHand);
    const view = buildView({
      myHand,
      handSizes: [5, 5, 5, 5],
      completedTricks: fakeCompletedTricks(played),
    });

    const world = sampleWorld(view, createRng(42));
    expect(world[1]).toHaveLength(5);
    expect(world[2]).toHaveLength(5);
    expect(world[3]).toHaveLength(5);

    const allWorldCards = [...world[1]!, ...world[2]!, ...world[3]!];
    expect(new Set(allWorldCards.map(cardId)).size).toBe(15);

    const forbidden = new Set([...myHand, ...played].map(cardId));
    for (const c of allWorldCards) {
      expect(forbidden.has(cardId(c))).toBe(false);
    }
  });

  it('never assigns a card of a suit a player is known void in', () => {
    // Pool = 52 - myHand(5) - played(32) = 15, matching the opponents' need (5+5+5).
    const myHand = [card('C', 2), card('C', 3), card('C', 4), card('C', 5), card('C', 6)];
    const played = fillerCards(32, myHand);
    const view = buildView({
      myHand,
      handSizes: [5, 5, 5, 5],
      completedTricks: fakeCompletedTricks(played),
      voidSuits: { 0: [], 1: ['H'], 2: ['H', 'D'], 3: [] },
    });

    for (let seed = 0; seed < 20; seed++) {
      const world = sampleWorld(view, createRng(seed * 1000 + 1));
      for (const c of world[1]!) expect(c.suit).not.toBe('H');
      for (const c of world[2]!) {
        expect(c.suit).not.toBe('H');
        expect(c.suit).not.toBe('D');
      }
      expect(world[1]).toHaveLength(5);
      expect(world[2]).toHaveLength(5);
      expect(world[3]).toHaveLength(5);
    }
  });

  it('produces a full, non-overlapping partition of the unseen deck across many seeds', () => {
    const myHand = [card('S', 14), card('S', 13), card('H', 2)];
    // Pool = 52 - myHand - played must equal the opponents' total need (8+7+9=24).
    const played = fillerCards(52 - myHand.length - 24, myHand);
    const view = buildView({
      self: 2,
      myHand,
      handSizes: [8, 7, 3, 9],
      completedTricks: fakeCompletedTricks(played),
      voidSuits: { 0: [], 1: ['C'], 2: [], 3: ['S', 'D'] },
    });

    for (let seed = 0; seed < 15; seed++) {
      const world = sampleWorld(view, createRng(seed * 7 + 3));
      expect(world[0]).toHaveLength(8);
      expect(world[1]).toHaveLength(7);
      expect(world[3]).toHaveLength(9);
      for (const c of world[1]!) expect(c.suit).not.toBe('C');
      for (const c of world[3]!) {
        expect(c.suit).not.toBe('S');
        expect(c.suit).not.toBe('D');
      }
      const all = [...world[0]!, ...world[1]!, ...world[3]!];
      expect(new Set(all.map(cardId)).size).toBe(all.length);
    }
  });
});
