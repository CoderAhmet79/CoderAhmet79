import { Card, Rank, Suit } from './types';

export const SUITS: Suit[] = ['S', 'H', 'D', 'C'];
export const RANKS: Rank[] = [14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2];

export function cardId(card: Card): string {
  return `${card.suit}${card.rank}`;
}

export function isSameCard(a: Card, b: Card): boolean {
  return a.suit === b.suit && a.rank === b.rank;
}

export function containsCard(cards: Card[], card: Card): boolean {
  return cards.some((c) => isSameCard(c, card));
}

export function rankLabel(rank: Rank): string {
  switch (rank) {
    case 14:
      return 'A';
    case 13:
      return 'K';
    case 12:
      return 'Q';
    case 11:
      return 'J';
    default:
      return String(rank);
  }
}

export function suitSymbol(suit: Suit): string {
  switch (suit) {
    case 'S':
      return '♠';
    case 'H':
      return '♥';
    case 'D':
      return '♦';
    case 'C':
      return '♣';
  }
}

export function isHeart(card: Card): boolean {
  return card.suit === 'H';
}

export function isMan(card: Card): boolean {
  return card.rank === 13 || card.rank === 11; // K or J
}

export function isQueen(card: Card): boolean {
  return card.rank === 12;
}

export function isKingOfHearts(card: Card): boolean {
  return card.suit === 'H' && card.rank === 13;
}

export function sortHand(cards: Card[]): Card[] {
  const suitOrder: Record<Suit, number> = { S: 0, H: 1, D: 2, C: 3 };
  return [...cards].sort((a, b) => {
    if (a.suit !== b.suit) return suitOrder[a.suit] - suitOrder[b.suit];
    return b.rank - a.rank;
  });
}
