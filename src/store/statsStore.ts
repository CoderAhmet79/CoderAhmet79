import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';

import { ALL_CONTRACTS, Contract, GameState, PlayerId } from '../engine/types';

const STORAGE_KEY = 'rifki:stats';
const HUMAN: PlayerId = 0;

export type ContractStat = { count: number; totalScore: number };

export type Stats = {
  gamesPlayed: number;
  wins: number;
  bestScore: number | null;
  contractStats: Record<Contract, ContractStat>;
};

function emptyContractStats(): Record<Contract, ContractStat> {
  const stats = {} as Record<Contract, ContractStat>;
  for (const c of ALL_CONTRACTS) stats[c] = { count: 0, totalScore: 0 };
  return stats;
}

export const emptyStats: Stats = {
  gamesPlayed: 0,
  wins: 0,
  bestScore: null,
  contractStats: emptyContractStats(),
};

type StatsStore = {
  stats: Stats;
  loaded: boolean;
  load: () => Promise<void>;
  recordGame: (state: GameState) => void;
};

export const useStatsStore = create<StatsStore>((set, get) => ({
  stats: emptyStats,
  loaded: false,

  load: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<Stats>;
        set({
          stats: {
            ...emptyStats,
            ...parsed,
            contractStats: { ...emptyContractStats(), ...parsed.contractStats },
          },
          loaded: true,
        });
      } else {
        set({ loaded: true });
      }
    } catch {
      set({ loaded: true });
    }
  },

  recordGame: (state) => {
    const totals = state.totals;
    const best = Math.max(...totals);
    const soloWinner = totals.filter((t) => t === best).length === 1;
    const won = soloWinner && totals[HUMAN] === best;

    const prev = get().stats;
    const contractStats = { ...prev.contractStats };
    for (const row of state.scoreTable) {
      if (row.declarer !== HUMAN) continue;
      const existing = contractStats[row.contract];
      contractStats[row.contract] = {
        count: existing.count + 1,
        totalScore: existing.totalScore + row.scores[HUMAN],
      };
    }

    const next: Stats = {
      gamesPlayed: prev.gamesPlayed + 1,
      wins: prev.wins + (won ? 1 : 0),
      bestScore: prev.bestScore === null ? totals[HUMAN] : Math.max(prev.bestScore, totals[HUMAN]),
      contractStats,
    };
    set({ stats: next });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  },
}));
