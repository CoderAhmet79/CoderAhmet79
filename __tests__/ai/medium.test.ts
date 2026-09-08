import { createAgent, Agent } from '../../src/ai/agent';
import { bestTrumpSuit, evaluateHand } from '../../src/ai/evaluate';
import {
  availableContracts,
  chooseContract,
  chooseTrump,
  createGame,
  legalPlays,
  nextHand,
  playCard,
} from '../../src/engine/game';
import { publicView } from '../../src/engine/publicView';
import { createRng, Rng } from '../../src/engine/rng';
import { Card, defaultRuleSet, GameState, Suit } from '../../src/engine/types';
import { card } from '../../test-utils/engineFixtures';

describe('evaluateHand — sezgisel sıralama sağlaması', () => {
  it('prefers a low, safe hand over a high, dangerous one for NO_TRICKS', () => {
    const lowHand: Card[] = [card('S', 2), card('H', 3), card('D', 4), card('C', 5)];
    const highHand: Card[] = [card('S', 14), card('H', 13), card('D', 14), card('C', 13)];
    expect(evaluateHand(lowHand, 'NO_TRICKS')).toBeGreaterThan(evaluateHand(highHand, 'NO_TRICKS'));
  });

  it('prefers a hand with no hearts for NO_HEARTS', () => {
    const noHearts: Card[] = [card('S', 2), card('D', 4), card('C', 5)];
    const withHighHearts: Card[] = [card('H', 14), card('H', 13), card('C', 5)];
    expect(evaluateHand(noHearts, 'NO_HEARTS')).toBeGreaterThan(evaluateHand(withHighHearts, 'NO_HEARTS'));
  });

  it('penalizes holding the king of hearts for RIFKI', () => {
    const withKingOfHearts: Card[] = [card('H', 13), card('S', 2)];
    const without: Card[] = [card('H', 4), card('S', 2)];
    expect(evaluateHand(without, 'RIFKI')).toBeGreaterThan(evaluateHand(withKingOfHearts, 'RIFKI'));
  });

  it('bestTrumpSuit favors a long, high suit over a short, low one', () => {
    const hand: Card[] = [
      card('S', 14),
      card('S', 13),
      card('S', 12),
      card('S', 10),
      card('S', 8),
      card('H', 2),
    ];
    expect(bestTrumpSuit(hand).suit).toBe('S');
  });
});

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];

function playFullGameWithAgents(
  seed: number,
  agents: [Agent, Agent, Agent, Agent],
): GameState {
  let state = createGame(defaultRuleSet, seed);
  state = nextHand(state);

  while (state.phase !== 'GAME_OVER') {
    const declarer = state.hand!.declarer;
    const options = availableContracts(state, declarer);
    const contract = agents[declarer].chooseContract(publicView(state, declarer), options);
    state = chooseContract(state, contract);
    if (state.phase === 'CHOOSE_TRUMP') {
      state = chooseTrump(state, agents[declarer].chooseTrump(publicView(state, declarer)));
    }
    while (state.phase === 'PLAYING') {
      const player = state.hand!.turn;
      const legal = legalPlays(state, player);
      const card = agents[player].chooseCard(publicView(state, player), legal);
      state = playCard(state, player, card);
    }
    state = nextHand(state);
  }

  return state;
}

function randomAgent(rng: Rng): Agent {
  return {
    chooseContract: (_view, options) => options[Math.floor(rng.next() * options.length)],
    chooseTrump: () => SUITS[Math.floor(rng.next() * 4)],
    chooseCard: (_view, legal) => legal[Math.floor(rng.next() * legal.length)],
  };
}

describe('MEDIUM agent — full random-seeded games', () => {
  it.each([1, 2, 3, 4, 5])('plays a full 20-hand game with 4 MEDIUM agents without throwing (seed %i)', (seed) => {
    const agents: [Agent, Agent, Agent, Agent] = [
      createAgent('MEDIUM', createRng(seed)),
      createAgent('MEDIUM', createRng(seed + 1)),
      createAgent('MEDIUM', createRng(seed + 2)),
      createAgent('MEDIUM', createRng(seed + 3)),
    ];
    const state = playFullGameWithAgents(seed, agents);
    expect(state.scoreTable).toHaveLength(20);
    expect(state.totals.reduce((a, b) => a + b, 0)).toBe(0);
  });

  it('MEDIUM clearly outperforms RANDOM over many games on average', () => {
    const gameCount = 40;
    let mediumTotal = 0;
    let randomTotal = 0;

    for (let i = 0; i < gameCount; i++) {
      const seed = 20000 + i;
      const agents: [Agent, Agent, Agent, Agent] = [
        createAgent('MEDIUM', createRng(seed * 13 + 1)),
        randomAgent(createRng(seed * 13 + 2)),
        randomAgent(createRng(seed * 13 + 3)),
        randomAgent(createRng(seed * 13 + 4)),
      ];
      const state = playFullGameWithAgents(seed, agents);
      mediumTotal += state.totals[0];
      randomTotal += state.totals[1] + state.totals[2] + state.totals[3];
    }

    const mediumAvg = mediumTotal / gameCount;
    const randomAvg = randomTotal / (gameCount * 3);

    expect(mediumAvg).toBeGreaterThan(randomAvg + 200);
  });
});
