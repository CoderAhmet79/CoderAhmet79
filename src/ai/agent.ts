import { PublicState } from '../engine/publicView';
import { Rng } from '../engine/rng';
import { Card, Contract, Suit } from '../engine/types';
import { chooseMediumCard, chooseMediumContract, chooseMediumTrump } from './medium';

export interface Agent {
  chooseContract(view: PublicState, options: Contract[]): Contract;
  chooseTrump(view: PublicState): Suit;
  chooseCard(view: PublicState, legal: Card[]): Card;
}

export type AgentLevel = 'MEDIUM' | 'HARD';

// HARD, adım 8'de Monte Carlo (PIMC) tabanlı hard.ts ile değiştirilir; o
// güne kadar MEDIUM ile aynı sezgisel mantığı kullanır ki uygulama her
// adımda çalışır durumda kalsın.
export function createAgent(level: AgentLevel, rng: Rng): Agent {
  void level;
  return {
    chooseContract: (view, options) => chooseMediumContract(view, options, rng),
    chooseTrump: (view) => chooseMediumTrump(view),
    chooseCard: (view, legal) => chooseMediumCard(view, legal),
  };
}
