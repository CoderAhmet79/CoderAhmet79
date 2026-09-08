import { isHeart, isKingOfHearts, isMan, isQueen } from '../engine/cards';
import { PublicState } from '../engine/publicView';
import { Rng } from '../engine/rng';
import { Card, Contract, Suit, Trick } from '../engine/types';
import { bestTrumpSuit, evaluateHand } from './evaluate';

function highestCard(cards: Card[]): Card {
  return cards.reduce((best, c) => (c.rank > best.rank ? c : best));
}

function lowestCard(cards: Card[]): Card {
  return cards.reduce((best, c) => (c.rank < best.rank ? c : best));
}

// Verilen tavan puandan (kazanan karttan) düşük en yüksek kartı bulur —
// "eli alamayacağı en yüksek kart".
function pickHighestBelow(cards: Card[], ceilingRank: number): Card | null {
  const below = cards.filter((c) => c.rank < ceilingRank);
  if (below.length === 0) return null;
  return highestCard(below);
}

function pickLowestAbove(cards: Card[], floorRank: number): Card | null {
  const above = cards.filter((c) => c.rank > floorRank);
  if (above.length === 0) return null;
  return lowestCard(above);
}

function dangerScore(card: Card, contract: Contract): number {
  switch (contract) {
    case 'NO_HEARTS':
      return isHeart(card) ? 100 + card.rank : card.rank;
    case 'NO_MEN':
      return isMan(card) ? 100 + card.rank : card.rank;
    case 'NO_QUEENS':
      return isQueen(card) ? 100 + card.rank : card.rank;
    case 'RIFKI':
      if (isKingOfHearts(card)) return 1000;
      return isHeart(card) ? 100 + card.rank : card.rank;
    default:
      return card.rank;
  }
}

function mostDangerousCard(cards: Card[], contract: Contract): Card {
  return cards.reduce((worst, c) =>
    dangerScore(c, contract) > dangerScore(worst, contract) ? c : worst,
  );
}

function leastDangerousCard(cards: Card[], contract: Contract): Card {
  return cards.reduce((best, c) =>
    dangerScore(c, contract) < dangerScore(best, contract) ? c : best,
  );
}

function chooseLastTwoCard(view: PublicState, legal: Card[]): Card {
  const hand = view.hand!;
  const trickNo = hand.completedTricks.length + 1;
  const nearEnd = trickNo >= 12;
  const trick = hand.currentTrick;

  if (trick.plays.length === 0) {
    return nearEnd ? lowestCard(legal) : highestCard(legal);
  }

  const ledSuit = trick.plays[0].card.suit;
  const followingLed = legal.every((c) => c.suit === ledSuit);
  if (followingLed) {
    if (!nearEnd) return highestCard(legal);
    const winningSoFar = trick.plays
      .filter((p) => p.card.suit === ledSuit)
      .reduce((best, p) => (p.card.rank > best.rank ? p.card : best), trick.plays[0].card);
    return pickHighestBelow(legal, winningSoFar.rank) ?? lowestCard(legal);
  }

  return nearEnd ? lowestCard(legal) : highestCard(legal);
}

function trickWinningCard(trick: Trick, trumpSuit: Suit): Card {
  const ledSuit = trick.plays[0].card.suit;
  let winner = trick.plays[0].card;
  let winnerIsTrump = winner.suit === trumpSuit;
  for (const play of trick.plays.slice(1)) {
    const isTrump = play.card.suit === trumpSuit;
    if (isTrump && !winnerIsTrump) {
      winner = play.card;
      winnerIsTrump = true;
    } else if (isTrump && winnerIsTrump && play.card.rank > winner.rank) {
      winner = play.card;
    } else if (!isTrump && !winnerIsTrump && play.card.suit === ledSuit && play.card.rank > winner.rank) {
      winner = play.card;
    }
  }
  return winner;
}

function chooseTrumpCard(view: PublicState, legal: Card[]): Card {
  const hand = view.hand!;
  const trumpSuit = hand.trumpSuit!;
  const trick = hand.currentTrick;

  if (trick.plays.length === 0) {
    const trumps = legal.filter((c) => c.suit === trumpSuit);
    const ace = trumps.find((c) => c.rank === 14);
    if (ace) return ace;
    if (trumps.length >= 3) return highestCard(trumps);
    return highestCard(legal);
  }

  const winner = trickWinningCard(trick, trumpSuit);
  const winnerIsTrump = winner.suit === trumpSuit;
  const ledSuit = trick.plays[0].card.suit;
  const sameLedSuit = legal.filter((c) => c.suit === ledSuit);

  if (sameLedSuit.length > 0) {
    if (winnerIsTrump) return lowestCard(sameLedSuit); // trump already ahead, can't out-follow it
    return pickLowestAbove(sameLedSuit, winner.rank) ?? lowestCard(sameLedSuit);
  }

  // void of the led suit
  const trumps = legal.filter((c) => c.suit === trumpSuit);
  if (trumps.length > 0) {
    if (!winnerIsTrump) return lowestCard(trumps); // ruff cheaply
    return pickLowestAbove(trumps, winner.rank) ?? lowestCard(legal);
  }

  return lowestCard(legal);
}

export function chooseMediumCard(view: PublicState, legal: Card[]): Card {
  if (legal.length === 1) return legal[0];
  const hand = view.hand!;
  const contract = hand.contract!;
  const trick = hand.currentTrick;

  if (contract === 'TRUMP') return chooseTrumpCard(view, legal);
  if (contract === 'LAST_TWO') return chooseLastTwoCard(view, legal);

  if (trick.plays.length === 0) {
    return leastDangerousCard(legal, contract);
  }

  const ledSuit = trick.plays[0].card.suit;
  const followingLed = legal.every((c) => c.suit === ledSuit);

  if (followingLed) {
    const winningSoFar = trick.plays
      .filter((p) => p.card.suit === ledSuit)
      .reduce((best, p) => (p.card.rank > best.rank ? p.card : best), trick.plays[0].card);
    const safe = pickHighestBelow(legal, winningSoFar.rank);
    if (safe) return safe;
    return leastDangerousCard(legal, contract); // forced to take the trick: minimize damage
  }

  return mostDangerousCard(legal, contract); // void: shed the most dangerous card
}

export function chooseMediumContract(view: PublicState, options: Contract[], rng: Rng): Contract {
  const myHand = view.hand!.myHand;
  const scored = options
    .map((contract) => ({ contract, score: evaluateHand(myHand, contract) }))
    .sort((a, b) => b.score - a.score);

  // %10 insan hatası: en iyi yerine ikinci en iyiyi seç.
  if (scored.length >= 2 && rng.next() < 0.1) {
    return scored[1].contract;
  }
  return scored[0].contract;
}

export function chooseMediumTrump(view: PublicState): Suit {
  return bestTrumpSuit(view.hand!.myHand).suit;
}
