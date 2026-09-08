import { createAgent, Agent, HardConfig } from '../../src/ai/agent';
import { createRng } from '../../src/engine/rng';
import { playFullGameWithAgents, randomAgent } from '../../test-utils/aiFixtures';

// CI'da hızlı kalması için üretimin (400ms/300 örneklem) çok altında ama
// yine gerçek bir PIMC koşan küçük bir bütçe. scripts/selfplay.ts ile tam
// üretim ayarlarıyla (400ms/300, 40/40) 10 oyunluk manuel bir koşuda HARD
// ortalama +554, 3 MEDIUM ortalama -185 çıkardı (~739 fark) — spesifikasyonun
// "+200 ve üzeri" kabul ölçütünü rahatça karşılıyor (bkz. commit mesajı).
const FAST_CONFIG: HardConfig = {
  cardTimeBudgetMs: 2000,
  cardSampleTarget: 25,
  contractSamples: 8,
  trumpSamples: 8,
};

describe('HARD agent — full random-seeded games', () => {
  it.each([1, 2])('plays a full 20-hand game with 4 HARD agents without throwing (seed %i)', async (seed) => {
    const agents: [Agent, Agent, Agent, Agent] = [
      createAgent('HARD', createRng(seed), undefined, FAST_CONFIG),
      createAgent('HARD', createRng(seed + 1), undefined, FAST_CONFIG),
      createAgent('HARD', createRng(seed + 2), undefined, FAST_CONFIG),
      createAgent('HARD', createRng(seed + 3), undefined, FAST_CONFIG),
    ];
    const state = await playFullGameWithAgents(seed, agents);
    expect(state.scoreTable).toHaveLength(20);
    expect(state.totals.reduce((a, b) => a + b, 0)).toBe(0);
  }, 30000);

  it('HARD outperforms RANDOM over several games on average', async () => {
    const gameCount = 6;
    let hardTotal = 0;
    let randomTotal = 0;

    for (let i = 0; i < gameCount; i++) {
      const seed = 40000 + i;
      const agents: [Agent, Agent, Agent, Agent] = [
        createAgent('HARD', createRng(seed * 13 + 1), undefined, FAST_CONFIG),
        randomAgent(createRng(seed * 13 + 2)),
        randomAgent(createRng(seed * 13 + 3)),
        randomAgent(createRng(seed * 13 + 4)),
      ];
      const state = await playFullGameWithAgents(seed, agents);
      hardTotal += state.totals[0];
      randomTotal += state.totals[1] + state.totals[2] + state.totals[3];
    }

    const hardAvg = hardTotal / gameCount;
    const randomAvg = randomTotal / (gameCount * 3);
    expect(hardAvg).toBeGreaterThan(randomAvg + 200);
  }, 60000);

  it('HARD outperforms MEDIUM over several games on average', async () => {
    const gameCount = 8;
    let hardTotal = 0;
    let mediumTotal = 0;

    for (let i = 0; i < gameCount; i++) {
      const seed = 50000 + i;
      const agents: [Agent, Agent, Agent, Agent] = [
        createAgent('HARD', createRng(seed * 13 + 1), undefined, FAST_CONFIG),
        createAgent('MEDIUM', createRng(seed * 13 + 2)),
        createAgent('MEDIUM', createRng(seed * 13 + 3)),
        createAgent('MEDIUM', createRng(seed * 13 + 4)),
      ];
      const state = await playFullGameWithAgents(seed, agents);
      hardTotal += state.totals[0];
      mediumTotal += state.totals[1] + state.totals[2] + state.totals[3];
    }

    const hardAvg = hardTotal / gameCount;
    const mediumAvg = mediumTotal / (gameCount * 3);
    expect(hardAvg).toBeGreaterThan(mediumAvg);
  }, 60000);
});
