import { cardId } from '../engine/cards';
import { PublicState } from '../engine/publicView';
import { Rng } from '../engine/rng';
import { Card, Contract, RuleSet, Suit } from '../engine/types';
import { bestTrumpSuit } from './evaluate';
import { buildSimulatedHand, playOut, playOutFullHand, sampleWorld } from './sampler';

const YIELD_EVERY = 20;
const SUITS: Suit[] = ['S', 'H', 'D', 'C'];

// Üretimde spec'in tam değerleri (400ms/300 örneklem, 40 kontrat/koz
// örneklemi) kullanılır; testler CI'da makul sürede kalsın diye daha küçük
// (ama yine gerçek) bütçelerle çağırabilir.
export const DEFAULT_HARD_CONFIG = {
  cardTimeBudgetMs: 400,
  cardSampleTarget: 300,
  contractSamples: 40,
  trumpSamples: 40,
};

export type HardConfig = typeof DEFAULT_HARD_CONFIG;

// UI thread'i bloklamamak için: her YIELD_EVERY simülasyonda bir olay
// döngüsüne kontrolü geri verir.
function yieldToUI(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

// PIMC (perfect information Monte Carlo): legal.length==1 ise doğrudan onu
// oyna; değilse zaman bütçesi (400ms) veya örneklem hedefi (300) dolana
// kadar rastgele "dünyalar" örnekle, her adayı o dünyada MEDIUM ile sonuna
// kadar oynat, ortalama puanı en yüksek adayı seç.
export async function chooseHardCard(
  view: PublicState,
  legal: Card[],
  rng: Rng,
  ruleSet: RuleSet,
  config: HardConfig = DEFAULT_HARD_CONFIG,
): Promise<Card> {
  if (legal.length === 1) return legal[0];

  const self = view.self;
  const totals = new Map<string, number>();
  const counts = new Map<string, number>();
  for (const c of legal) {
    totals.set(cardId(c), 0);
    counts.set(cardId(c), 0);
  }

  const start = Date.now();
  let samples = 0;
  while (samples < config.cardSampleTarget && Date.now() - start < config.cardTimeBudgetMs) {
    const world = sampleWorld(view, rng);
    const simulatedHand = buildSimulatedHand(view, world);
    for (const c of legal) {
      const score = playOut(simulatedHand, ruleSet, self, c, self);
      const key = cardId(c);
      totals.set(key, totals.get(key)! + score);
      counts.set(key, counts.get(key)! + 1);
    }
    samples++;
    if (samples % YIELD_EVERY === 0) await yieldToUI();
  }

  let best = legal[0];
  let bestMean = -Infinity;
  for (const c of legal) {
    const key = cardId(c);
    const n = counts.get(key)!;
    const mean = n > 0 ? totals.get(key)! / n : -Infinity;
    if (mean > bestMean) {
      bestMean = mean;
      best = c;
    }
  }
  return best;
}

// Her aday kontrat için CONTRACT_SAMPLES örneklem dünyada eli baştan sona
// MEDIUM ile oynatır (TRUMP için sezgisel en iyi renk temsilci olarak
// kullanılır — asıl renk seçimi chooseHardTrump'ta ayrıca değerlendirilir),
// ortalama puanı en yüksek kontratı seçer.
export async function chooseHardContract(
  view: PublicState,
  options: Contract[],
  rng: Rng,
  ruleSet: RuleSet,
  config: HardConfig = DEFAULT_HARD_CONFIG,
): Promise<Contract> {
  if (options.length === 1) return options[0];
  const self = view.self;
  let best = options[0];
  let bestMean = -Infinity;
  let iterations = 0;

  for (const contract of options) {
    let total = 0;
    const trumpSuit = contract === 'TRUMP' ? bestTrumpSuit(view.hand!.myHand).suit : undefined;
    for (let i = 0; i < config.contractSamples; i++) {
      const world = sampleWorld(view, rng);
      const hand = buildSimulatedHand(view, world, contract, trumpSuit);
      total += playOutFullHand(hand, ruleSet, self);
      iterations++;
      if (iterations % YIELD_EVERY === 0) await yieldToUI();
    }
    const mean = total / config.contractSamples;
    if (mean > bestMean) {
      bestMean = mean;
      best = contract;
    }
  }

  return best;
}

// Koz rengi seçimi: aynı yöntemle 4 renk denenir.
export async function chooseHardTrump(
  view: PublicState,
  rng: Rng,
  ruleSet: RuleSet,
  config: HardConfig = DEFAULT_HARD_CONFIG,
): Promise<Suit> {
  const self = view.self;
  let best: Suit = SUITS[0];
  let bestMean = -Infinity;
  let iterations = 0;

  for (const suit of SUITS) {
    let total = 0;
    for (let i = 0; i < config.trumpSamples; i++) {
      const world = sampleWorld(view, rng);
      const hand = buildSimulatedHand(view, world, 'TRUMP', suit);
      total += playOutFullHand(hand, ruleSet, self);
      iterations++;
      if (iterations % YIELD_EVERY === 0) await yieldToUI();
    }
    const mean = total / config.trumpSamples;
    if (mean > bestMean) {
      bestMean = mean;
      best = suit;
    }
  }

  return best;
}
