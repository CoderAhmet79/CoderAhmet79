import { useStatsStore } from '../../src/store/statsStore';
import { createGame } from '../../src/engine/game';
import { defaultRuleSet, GameState, HandScoreRow } from '../../src/engine/types';

function scoreRow(overrides: Partial<HandScoreRow>): HandScoreRow {
  return {
    handNo: 1,
    contract: 'NO_TRICKS',
    declarer: 0,
    trumpSuit: null,
    scores: [0, 0, 0, 0],
    cumulative: [0, 0, 0, 0],
    ...overrides,
  };
}

function gameWithTotals(totals: [number, number, number, number], scoreTable: HandScoreRow[] = []): GameState {
  const state = createGame(defaultRuleSet, 1);
  return { ...state, totals, scoreTable };
}

describe('statsStore.recordGame', () => {
  beforeEach(() => {
    useStatsStore.setState({
      stats: {
        gamesPlayed: 0,
        wins: 0,
        bestScore: null,
        contractStats: useStatsStore.getState().stats.contractStats,
      },
    });
  });

  it('counts a solo human win', () => {
    const state = gameWithTotals([500, -100, -200, -200]);
    useStatsStore.getState().recordGame(state);
    const stats = useStatsStore.getState().stats;
    expect(stats.gamesPlayed).toBe(1);
    expect(stats.wins).toBe(1);
    expect(stats.bestScore).toBe(500);
  });

  it('does not count a tied top score as a win', () => {
    const state = gameWithTotals([500, 500, -500, -500]);
    useStatsStore.getState().recordGame(state);
    expect(useStatsStore.getState().stats.wins).toBe(0);
  });

  it('does not count a loss as a win but still tracks best score', () => {
    const state = gameWithTotals([-100, 600, -200, -300]);
    useStatsStore.getState().recordGame(state);
    const stats = useStatsStore.getState().stats;
    expect(stats.wins).toBe(0);
    expect(stats.bestScore).toBe(-100);
  });

  it('aggregates per-contract stats only for hands the human declared', () => {
    const state = gameWithTotals(
      [100, 0, 0, 0],
      [
        scoreRow({ handNo: 1, contract: 'RIFKI', declarer: 0, scores: [0, -320, 0, 0] }),
        scoreRow({ handNo: 2, contract: 'RIFKI', declarer: 1, scores: [0, 0, -320, 0] }),
        scoreRow({ handNo: 3, contract: 'TRUMP', declarer: 0, trumpSuit: 'S', scores: [150, 0, 0, 0] }),
      ],
    );
    useStatsStore.getState().recordGame(state);
    const contractStats = useStatsStore.getState().stats.contractStats;
    expect(contractStats.RIFKI).toEqual({ count: 1, totalScore: 0 });
    expect(contractStats.TRUMP).toEqual({ count: 1, totalScore: 150 });
  });

  it('accumulates across multiple recorded games', () => {
    useStatsStore.getState().recordGame(gameWithTotals([100, 0, 0, 0]));
    useStatsStore.getState().recordGame(gameWithTotals([50, 900, 0, 0]));
    const stats = useStatsStore.getState().stats;
    expect(stats.gamesPlayed).toBe(2);
    expect(stats.wins).toBe(1);
    expect(stats.bestScore).toBe(100);
  });
});
