import { isHeart, isKingOfHearts, isMan, isQueen } from './cards';
import { Card, HandState, PlayerId, RuleSet, Suit, Trick, TRICKS_PER_HAND } from './types';

// Elde başlarken uygulanan kısıtlar (Kupa Almaz / Rıfkı: elinde başka renk
// varken kupa ile başlanamaz) hariç, oynayan oyuncunun elindeki tüm kartlar
// serbesttir.
function leadOptions(hand: HandState, cards: Card[]): Card[] {
  if (hand.contract === 'NO_HEARTS' || hand.contract === 'RIFKI') {
    const nonHearts = cards.filter((c) => !isHeart(c));
    if (nonHearts.length > 0) return nonHearts;
  }
  return cards;
}

export function legalPlaysInHand(hand: HandState, player: PlayerId, ruleSet: RuleSet): Card[] {
  const cards = hand.hands[player];
  const trick = hand.currentTrick;

  if (trick.plays.length === 0) {
    return leadOptions(hand, cards);
  }

  const ledSuit = trick.plays[0].card.suit;
  const followSuit = cards.filter((c) => c.suit === ledSuit);
  if (followSuit.length > 0) return followSuit;

  // Renk yok: koz elinde ve ayar açıksa koz zorunlu.
  if (hand.contract === 'TRUMP' && hand.trumpSuit && ruleSet.mustTrumpWhenVoid) {
    const trumps = cards.filter((c) => c.suit === hand.trumpSuit);
    if (trumps.length > 0) return trumps;
  }

  return cards;
}

function cardStrength(card: Card, ledSuit: Suit, trumpSuit: Suit | null): number {
  if (trumpSuit && card.suit === trumpSuit) return 100 + card.rank;
  if (card.suit === ledSuit) return card.rank;
  return -1;
}

export function determineTrickWinner(hand: HandState, trick: Trick): PlayerId {
  const ledSuit = trick.plays[0].card.suit;
  const trumpSuit = hand.contract === 'TRUMP' ? hand.trumpSuit : null;

  let winner = trick.plays[0];
  let bestScore = cardStrength(winner.card, ledSuit, trumpSuit);
  for (const play of trick.plays.slice(1)) {
    const score = cardStrength(play.card, ledSuit, trumpSuit);
    if (score > bestScore) {
      bestScore = score;
      winner = play;
    }
  }
  return winner.player;
}

// El (round), tüm kontratlarda 13 el (trick) sonunda biter. Rıfkı, Kız Almaz
// ve Erkek Almaz kontratlarında, ceza konusu tükendiğinde ve ayar açıksa,
// kalan trickler oynanmadan el biter.
export function isHandFinished(
  hand: HandState,
  completedTricks: Trick[],
  ruleSet: RuleSet,
): boolean {
  if (completedTricks.length >= TRICKS_PER_HAND) return true;
  if (!ruleSet.earlyEndOnPenaltyExhausted) return false;

  switch (hand.contract) {
    case 'RIFKI':
      return completedTricks.some((t) => t.plays.some((p) => isKingOfHearts(p.card)));
    case 'NO_QUEENS': {
      const queens = completedTricks.reduce(
        (sum, t) => sum + t.plays.filter((p) => isQueen(p.card)).length,
        0,
      );
      return queens >= 4;
    }
    case 'NO_MEN': {
      const men = completedTricks.reduce(
        (sum, t) => sum + t.plays.filter((p) => isMan(p.card)).length,
        0,
      );
      return men >= 8;
    }
    default:
      return false;
  }
}
