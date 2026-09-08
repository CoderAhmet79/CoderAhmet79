import { containsCard } from '../../src/engine/cards';
import {
  availableContracts,
  canClaimRemainingTricks,
  chooseContract,
  chooseTrump,
  claimRemainingTricks,
  createGame,
  dealHand,
  legalPlays,
  nextHand,
  playCard,
} from '../../src/engine/game';
import { createRng, Rng } from '../../src/engine/rng';
import { defaultRuleSet, GameState, Suit } from '../../src/engine/types';
import { card } from '../../test-utils/engineFixtures';

describe('createGame + dealHand', () => {
  it('deals 13 cards to each of the 4 players and enters CHOOSE_CONTRACT', () => {
    let state = createGame(defaultRuleSet, 7);
    state = dealHand(state);
    expect(state.phase).toBe('CHOOSE_CONTRACT');
    expect(state.hand).not.toBeNull();
    state.hand!.hands.forEach((h) => expect(h).toHaveLength(13));
  });

  it('sets the declarer to the player after the dealer, who leads the first trick', () => {
    let state = createGame(defaultRuleSet, 7);
    state = dealHand(state);
    const hand = state.hand!;
    expect(hand.declarer).toBe(((hand.dealer + 1) % 4));
    expect(hand.currentTrick.leader).toBe(hand.declarer);
    expect(hand.turn).toBe(hand.declarer);
  });

  it('rotates the dealer on each subsequent deal', () => {
    let state = createGame(defaultRuleSet, 7);
    state = dealHand(state);
    const firstDealer = state.hand!.dealer;
    const state2 = dealHand(state);
    expect(state2.hand!.dealer).toBe(((firstDealer + 1) % 4));
    expect(state2.hand!.handNo).toBe(2);
  });
});

describe('contract quotas', () => {
  it('limits a player to 3 penalty contracts total', () => {
    let state = createGame(defaultRuleSet, 1);
    state = { ...state, playerQuota: { ...state.playerQuota, 0: { penalty: 0, trump: 2 } } };
    expect(availableContracts(state, 0)).toEqual(['TRUMP']);
  });

  it('limits a player to 2 trump contracts total', () => {
    let state = createGame(defaultRuleSet, 1);
    state = { ...state, playerQuota: { ...state.playerQuota, 0: { penalty: 3, trump: 0 } } };
    const available = availableContracts(state, 0);
    expect(available).not.toContain('TRUMP');
    expect(available).toHaveLength(6);
  });

  it('removes a penalty contract globally once chosen twice by anyone', () => {
    let state = createGame(defaultRuleSet, 1);
    state = { ...state, contractsRemaining: { ...state.contractsRemaining, RIFKI: 0 } };
    expect(availableContracts(state, 0)).not.toContain('RIFKI');
  });

  it('chooseContract decrements quota and global remaining', () => {
    let state = createGame(defaultRuleSet, 1);
    state = dealHand(state);
    const declarer = state.hand!.declarer;
    state = chooseContract(state, 'NO_TRICKS');
    expect(state.contractsRemaining.NO_TRICKS).toBe(1);
    expect(state.playerQuota[declarer].penalty).toBe(2);
    expect(state.phase).toBe('PLAYING');
  });

  it('TRUMP contract moves to CHOOSE_TRUMP and decrements trump quota', () => {
    let state = createGame(defaultRuleSet, 1);
    state = dealHand(state);
    const declarer = state.hand!.declarer;
    state = chooseContract(state, 'TRUMP');
    expect(state.phase).toBe('CHOOSE_TRUMP');
    expect(state.playerQuota[declarer].trump).toBe(1);
    state = chooseTrump(state, 'S');
    expect(state.phase).toBe('PLAYING');
    expect(state.hand!.trumpSuit).toBe('S');
  });

  it('throws when choosing a globally exhausted contract', () => {
    let state = createGame(defaultRuleSet, 1);
    state = dealHand(state);
    state = { ...state, contractsRemaining: { ...state.contractsRemaining, NO_TRICKS: 0 } };
    expect(() => chooseContract(state, 'NO_TRICKS')).toThrow();
  });

  it('throws when the declarer has exhausted their own penalty quota', () => {
    let state = createGame(defaultRuleSet, 1);
    state = dealHand(state);
    const declarer = state.hand!.declarer;
    state = {
      ...state,
      playerQuota: { ...state.playerQuota, [declarer]: { penalty: 0, trump: 2 } },
    };
    expect(() => chooseContract(state, 'NO_TRICKS')).toThrow();
  });
});

describe('playCard', () => {
  it('rejects a card outside legalPlays', () => {
    let state = createGame(defaultRuleSet, 1);
    state = dealHand(state);
    state = chooseContract(state, 'NO_TRICKS');
    const declarer = state.hand!.declarer;
    const illegalCard = state.hand!.hands[(declarer + 1) % 4][0];
    expect(() => playCard(state, declarer, illegalCard)).toThrow();
  });

  it('rejects playing out of turn', () => {
    let state = createGame(defaultRuleSet, 1);
    state = dealHand(state);
    state = chooseContract(state, 'NO_TRICKS');
    const declarer = state.hand!.declarer;
    const notDeclarer = ((declarer + 1) % 4) as 0 | 1 | 2 | 3;
    const card = state.hand!.hands[notDeclarer][0];
    expect(() => playCard(state, notDeclarer, card)).toThrow();
  });
});

function playLegalCard(state: GameState, rng: Rng): GameState {
  const player = state.hand!.turn;
  const legal = legalPlays(state, player);
  const chosen = legal[Math.floor(rng.next() * legal.length)];
  return playCard(state, player, chosen);
}

function playOutHand(state: GameState, rng: Rng): GameState {
  while (state.phase === 'PLAYING') {
    state = playLegalCard(state, rng);
  }
  return state;
}

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];

function playFullRandomGame(seed: number): GameState {
  const rng = createRng(seed);
  let state = createGame(defaultRuleSet, seed);
  state = nextHand(state);

  while (state.phase !== 'GAME_OVER') {
    const declarer = state.hand!.declarer;
    const options = availableContracts(state, declarer);
    const contract = options[Math.floor(rng.next() * options.length)];
    state = chooseContract(state, contract);
    if (state.phase === 'CHOOSE_TRUMP') {
      state = chooseTrump(state, SUITS[Math.floor(rng.next() * 4)]);
    }
    state = playOutHand(state, rng);
    state = nextHand(state);
  }

  return state;
}

describe('full random game playthrough', () => {
  it.each([1, 2, 3, 4, 5, 42, 123, 999, 7777, 2026])(
    'plays all 20 hands with random legal moves and sums totals to zero (seed %i)',
    (seed) => {
      const state = playFullRandomGame(seed);
      expect(state.scoreTable).toHaveLength(20);
      expect(state.phase).toBe('GAME_OVER');
      const total = state.totals.reduce((a, b) => a + b, 0);
      expect(total).toBe(0);
      for (const player of [0, 1, 2, 3] as const) {
        expect(state.playerQuota[player].penalty).toBe(0);
        expect(state.playerQuota[player].trump).toBe(0);
      }
    },
  );

  it('never lets a played card remain in the player hand it came from', () => {
    const state = playFullRandomGame(555);
    state.hand!.hands.forEach((h) => expect(h).toHaveLength(0));
  });

  it('never plays a card outside containsCard-verified legal options mid-game (spot check)', () => {
    const rng = createRng(31415);
    let state = createGame(defaultRuleSet, 31415);
    state = nextHand(state);
    state = chooseContract(state, availableContracts(state, state.hand!.declarer)[0]);
    if (state.phase === 'CHOOSE_TRUMP') state = chooseTrump(state, 'S');
    for (let i = 0; i < 5; i++) {
      const player = state.hand!.turn;
      const legal = legalPlays(state, player);
      const chosen = legal[0];
      expect(containsCard(state.hand!.hands[player], chosen)).toBe(true);
      state = playCard(state, player, chosen);
    }
  });
});

describe('canClaimRemainingTricks / claimRemainingTricks', () => {
  function buildForcedWinState(candidate: 0 | 1 | 2 | 3 = 0): GameState {
    const base = createGame(defaultRuleSet, 1);
    const hands: [ReturnType<typeof card>[], ReturnType<typeof card>[], ReturnType<typeof card>[], ReturnType<typeof card>[]] = [
      [],
      [],
      [],
      [],
    ];
    hands[candidate] = [card('S', 14), card('S', 13)];
    const others = ([0, 1, 2, 3] as const).filter((p) => p !== candidate);
    hands[others[0]] = [card('H', 2), card('H', 3)];
    hands[others[1]] = [card('H', 4), card('H', 5)];
    hands[others[2]] = [card('H', 6), card('H', 7)];

    return {
      ...base,
      phase: 'PLAYING',
      hand: {
        handNo: 1,
        dealer: 3,
        declarer: candidate,
        contract: 'TRUMP',
        trumpSuit: 'S',
        hands,
        currentTrick: { leader: candidate, plays: [] },
        completedTricks: [],
        turn: candidate,
        finished: false,
        handScores: [0, 0, 0, 0],
      },
    };
  }

  it('is true only for the player who can force the win', () => {
    const state = buildForcedWinState(0);
    expect(canClaimRemainingTricks(state, 0)).toBe(true);
    expect(canClaimRemainingTricks(state, 1)).toBe(false);
    expect(canClaimRemainingTricks(state, 2)).toBe(false);
  });

  it('scores +50 per remaining trick for the claimant, clears all hands, and ends the hand', () => {
    const state = buildForcedWinState(0);
    const next = claimRemainingTricks(state, 0);
    expect(next.phase).toBe('HAND_OVER');
    expect(next.hand!.finished).toBe(true);
    expect(next.hand!.hands.every((h) => h.length === 0)).toBe(true);
    expect(next.hand!.completedTricks).toHaveLength(2);
    expect(next.hand!.handScores).toEqual([100, 0, 0, 0]);
    expect(next.totals).toEqual([100, 0, 0, 0]);
    expect(next.scoreTable).toHaveLength(1);
    expect(next.scoreTable[0].scores).toEqual([100, 0, 0, 0]);
  });

  it('throws for a player who cannot force the win', () => {
    const state = buildForcedWinState(0);
    expect(() => claimRemainingTricks(state, 1)).toThrow();
  });

  it('is false mid-trick, even for the eventual forced winner', () => {
    const state = buildForcedWinState(0);
    const midTrick: GameState = {
      ...state,
      hand: {
        ...state.hand!,
        currentTrick: { leader: 0, plays: [{ player: 0, card: card('S', 14) }] },
      },
    };
    expect(canClaimRemainingTricks(midTrick, 0)).toBe(false);
  });
});
