import { createAgent, Agent } from '../../src/ai/agent';
import { bestTrumpSuit, evaluateHand } from '../../src/ai/evaluate';
import { createRng } from '../../src/engine/rng';
import { Card } from '../../src/engine/types';
import { playFullGameWithAgents, randomAgent } from '../../test-utils/aiFixtures';
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

describe('MEDIUM agent — full random-seeded games', () => {
  it.each([1, 2, 3, 4, 5])(
    'plays a full 20-hand game with 4 MEDIUM agents without throwing (seed %i)',
    async (seed) => {
      const agents: [Agent, Agent, Agent, Agent] = [
        createAgent('MEDIUM', createRng(seed)),
        createAgent('MEDIUM', createRng(seed + 1)),
        createAgent('MEDIUM', createRng(seed + 2)),
        createAgent('MEDIUM', createRng(seed + 3)),
      ];
      const state = await playFullGameWithAgents(seed, agents);
      expect(state.scoreTable).toHaveLength(20);
      expect(state.totals.reduce((a, b) => a + b, 0)).toBe(0);
    },
  );

  it('MEDIUM clearly outperforms RANDOM over many games on average', async () => {
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
      const state = await playFullGameWithAgents(seed, agents);
      mediumTotal += state.totals[0];
      randomTotal += state.totals[1] + state.totals[2] + state.totals[3];
    }

    const mediumAvg = mediumTotal / gameCount;
    const randomAvg = randomTotal / (gameCount * 3);

    expect(mediumAvg).toBeGreaterThan(randomAvg + 200);
  });
});
