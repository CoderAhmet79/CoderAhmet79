import { isHeart, isKingOfHearts, isMan, isQueen } from './cards';
import { HandState } from './types';

export function scoreHand(hand: HandState): [number, number, number, number] {
  const scores: [number, number, number, number] = [0, 0, 0, 0];
  const contract = hand.contract;
  if (!contract) return scores;

  switch (contract) {
    case 'NO_TRICKS':
      for (const trick of hand.completedTricks) {
        scores[trick.winner!] += -50;
      }
      break;
    case 'NO_HEARTS':
      for (const trick of hand.completedTricks) {
        const hearts = trick.plays.filter((p) => isHeart(p.card)).length;
        scores[trick.winner!] += -30 * hearts;
      }
      break;
    case 'NO_MEN':
      for (const trick of hand.completedTricks) {
        const men = trick.plays.filter((p) => isMan(p.card)).length;
        scores[trick.winner!] += -60 * men;
      }
      break;
    case 'NO_QUEENS':
      for (const trick of hand.completedTricks) {
        const queens = trick.plays.filter((p) => isQueen(p.card)).length;
        scores[trick.winner!] += -100 * queens;
      }
      break;
    case 'RIFKI':
      for (const trick of hand.completedTricks) {
        if (trick.plays.some((p) => isKingOfHearts(p.card))) {
          scores[trick.winner!] += -320;
        }
      }
      break;
    case 'LAST_TWO':
      hand.completedTricks.forEach((trick, index) => {
        const trickNo = index + 1;
        if (trickNo === 12 || trickNo === 13) {
          scores[trick.winner!] += -180;
        }
      });
      break;
    case 'TRUMP':
      for (const trick of hand.completedTricks) {
        scores[trick.winner!] += 50;
      }
      break;
  }

  return scores;
}
