import { isHeart, isKingOfHearts, isMan, isQueen, SUITS } from '../engine/cards';
import { Card, Contract, Suit } from '../engine/types';

// Bir elin belirli bir kontrat için "ne kadar iyi" olduğunu tahmin eden
// sezgisel puan fonksiyonları (bkz. RIFKI_SPEC.md 5.2). Skala kontratlar
// arasında kabaca kıyaslanabilir olacak şekilde tutulur: yüksek puan =
// bu kontratı seçmek için daha uygun el. Kesin bir para birimi değildir;
// yalnızca sıralama için kullanılır (HARD ajanın Monte Carlo simülasyonu
// gerçek beklenen skoru hesaplar).

function dangerWeight(rank: number): number {
  return (rank - 1) / 13; // 2 -> ~0.08, A(14) -> 1
}

function suitLengths(cards: Card[]): Record<Suit, number> {
  const lengths: Record<Suit, number> = { S: 0, H: 0, D: 0, C: 0 };
  for (const c of cards) lengths[c.suit]++;
  return lengths;
}

function evaluateNoTricks(cards: Card[]): number {
  let score = cards.reduce((sum, c) => sum + (1 - dangerWeight(c.rank)), 0);
  const highCards = cards.filter((c) => c.rank >= 13).length;
  score -= highCards * 1.5;
  return score;
}

function evaluateNoHearts(cards: Card[]): number {
  const hearts = cards.filter(isHeart);
  if (hearts.length === 0) return 20;
  let score = 13 - hearts.length;
  score -= hearts.reduce((sum, c) => sum + dangerWeight(c.rank), 0) * 3;
  return score;
}

function evaluateNoMen(cards: Card[]): number {
  const men = cards.filter(isMan);
  const lowCards = cards.filter((c) => c.rank <= 7).length;
  return 13 - men.length * 2 + lowCards * 0.5;
}

function evaluateNoQueens(cards: Card[]): number {
  const queens = cards.filter(isQueen);
  const lowCards = cards.filter((c) => c.rank <= 7).length;
  return 13 - queens.length * 2.5 + lowCards * 0.5;
}

function evaluateRifki(cards: Card[]): number {
  const hasKingOfHearts = cards.some(isKingOfHearts);
  const hasAceOfHearts = cards.some((c) => c.suit === 'H' && c.rank === 14);
  const heartsCount = cards.filter(isHeart).length;
  let score = 20;
  if (hasKingOfHearts) score -= 15;
  if (hasAceOfHearts) score -= 3;
  score -= heartsCount * 0.5;
  return score;
}

function evaluateLastTwo(cards: Card[]): number {
  const lowCards = cards.filter((c) => c.rank <= 7).length;
  const lengths = suitLengths(cards);
  const longSuits = Object.values(lengths).filter((len) => len >= 5).length;
  return lowCards * 1.5 - longSuits * 3;
}

export function evaluateTrumpSuit(cards: Card[], trumpSuit: Suit): number {
  const trumpCards = cards.filter((c) => c.suit === trumpSuit);
  const highTrumps = trumpCards.filter((c) => c.rank >= 13).length;
  const lengths = suitLengths(cards);
  const voidSuits = SUITS.filter((s) => s !== trumpSuit && lengths[s] === 0).length;
  return trumpCards.length * 3 + highTrumps * 4 + voidSuits * 5;
}

export function bestTrumpSuit(cards: Card[]): { suit: Suit; score: number } {
  let best: { suit: Suit; score: number } | null = null;
  for (const suit of SUITS) {
    const score = evaluateTrumpSuit(cards, suit);
    if (!best || score > best.score) best = { suit, score };
  }
  return best!;
}

export function evaluateHand(cards: Card[], contract: Contract): number {
  switch (contract) {
    case 'NO_TRICKS':
      return evaluateNoTricks(cards);
    case 'NO_HEARTS':
      return evaluateNoHearts(cards);
    case 'NO_MEN':
      return evaluateNoMen(cards);
    case 'NO_QUEENS':
      return evaluateNoQueens(cards);
    case 'RIFKI':
      return evaluateRifki(cards);
    case 'LAST_TWO':
      return evaluateLastTwo(cards);
    case 'TRUMP':
      return bestTrumpSuit(cards).score;
  }
}
