import { RANKS, SUITS } from './cards';
import { Rng } from './rng';
import { Card } from './types';

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank });
    }
  }
  return deck;
}

export function shuffle<T>(items: T[], rng: Rng): T[] {
  const result = items.slice();
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// 4 el, her biri 13 kart. Fisher–Yates ile tam karıştırılmış desteden
// sırayla dağıtılır.
export function dealCards(rng: Rng): Card[][] {
  const shuffled = shuffle(createDeck(), rng);
  const hands: Card[][] = [[], [], [], []];
  shuffled.forEach((card, index) => {
    hands[index % 4].push(card);
  });
  return hands;
}
