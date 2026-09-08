import { PublicState } from '../engine/publicView';
import { Rng } from '../engine/rng';
import { Card, Contract, defaultRuleSet, RuleSet, Suit } from '../engine/types';
import { chooseHardCard, chooseHardContract, chooseHardTrump, DEFAULT_HARD_CONFIG, HardConfig } from './hard';
import { chooseMediumCard, chooseMediumContract, chooseMediumTrump } from './medium';

export type { HardConfig } from './hard';

// HARD, zaman bütçeli PIMC (bkz. hard.ts) simülasyonu koştuğu için async'tir;
// MEDIUM anında karar verir ama aynı arayüzü sağlar (bir Promise sarmadan).
export interface Agent {
  chooseContract(view: PublicState, options: Contract[]): Contract | Promise<Contract>;
  chooseTrump(view: PublicState): Suit | Promise<Suit>;
  chooseCard(view: PublicState, legal: Card[]): Card | Promise<Card>;
}

export type AgentLevel = 'MEDIUM' | 'HARD';

export function createAgent(
  level: AgentLevel,
  rng: Rng,
  ruleSet: RuleSet = defaultRuleSet,
  hardConfig: HardConfig = DEFAULT_HARD_CONFIG,
): Agent {
  if (level === 'HARD') {
    return {
      chooseContract: (view, options) => chooseHardContract(view, options, rng, ruleSet, hardConfig),
      chooseTrump: (view) => chooseHardTrump(view, rng, ruleSet, hardConfig),
      chooseCard: (view, legal) => chooseHardCard(view, legal, rng, ruleSet, hardConfig),
    };
  }
  return {
    chooseContract: (view, options) => chooseMediumContract(view, options, rng),
    chooseTrump: (view) => chooseMediumTrump(view),
    chooseCard: (view, legal) => chooseMediumCard(view, legal),
  };
}
