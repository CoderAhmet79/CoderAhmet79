import { findForcedWinner } from '../../src/engine/claim';
import { defaultRuleSet } from '../../src/engine/types';
import { baseHand, card } from '../../test-utils/engineFixtures';

describe('findForcedWinner', () => {
  it('detects a forced win when the candidate holds the only remaining trumps', () => {
    const hand = baseHand({
      contract: 'TRUMP',
      trumpSuit: 'S',
      turn: 0,
      hands: [
        [card('S', 14), card('S', 13)],
        [card('H', 2), card('H', 3)],
        [card('H', 4), card('H', 5)],
        [card('H', 6), card('H', 7)],
      ],
    });
    expect(findForcedWinner(hand, defaultRuleSet)).toBe(0);
  });

  it('detects a forced win even when opponents also hold low trumps', () => {
    // Kalan tek koz kartları: S14, S13 (candidate) ve S2, S3, S4 (rakipler) —
    // candidate'ın ikisi de rakiplerin en yükseğinden üstün, yani hangi
    // sırayla oynanırsa oynansın candidate her iki trick'i de kazanır.
    const hand = baseHand({
      contract: 'TRUMP',
      trumpSuit: 'S',
      turn: 0,
      hands: [
        [card('S', 14), card('S', 13)],
        [card('S', 2), card('H', 2)],
        [card('S', 3), card('H', 3)],
        [card('S', 4), card('H', 4)],
      ],
    });
    expect(findForcedWinner(hand, defaultRuleSet)).toBe(0);
  });

  it('returns null when an opponent holds a higher trump', () => {
    const hand = baseHand({
      contract: 'TRUMP',
      trumpSuit: 'S',
      turn: 0,
      hands: [[card('S', 10)], [card('S', 14)], [card('H', 2)], [card('H', 3)]],
    });
    expect(findForcedWinner(hand, defaultRuleSet)).toBeNull();
  });

  it('returns null mid-trick (only meaningful at the start of a trick)', () => {
    const hand = baseHand({
      contract: 'TRUMP',
      trumpSuit: 'S',
      turn: 1,
      currentTrick: { leader: 0, plays: [{ player: 0, card: card('S', 14) }] },
      hands: [
        [],
        [card('H', 2), card('H', 3)],
        [card('H', 4), card('H', 5)],
        [card('H', 6), card('H', 7)],
      ],
    });
    expect(findForcedWinner(hand, defaultRuleSet)).toBeNull();
  });

  it('returns null for non-TRUMP contracts even with a dominant hand', () => {
    const hand = baseHand({
      contract: 'NO_TRICKS',
      turn: 0,
      hands: [
        [card('S', 2), card('S', 3)],
        [card('H', 2), card('H', 3)],
        [card('H', 4), card('H', 5)],
        [card('H', 6), card('H', 7)],
      ],
    });
    expect(findForcedWinner(hand, defaultRuleSet)).toBeNull();
  });

  it('returns null once the search exceeds the trick-count cap, even if a win would be forceable', () => {
    const topSpades = [14, 13, 12, 11, 10, 9, 8] as const; // 7 el > MAX_SEARCH_TRICKS(6)
    const hand = baseHand({
      contract: 'TRUMP',
      trumpSuit: 'S',
      turn: 0,
      hands: [
        topSpades.map((rank) => card('S', rank)),
        [card('H', 2), card('H', 3), card('H', 4), card('H', 5), card('H', 6), card('H', 7), card('H', 8)],
        [card('D', 2), card('D', 3), card('D', 4), card('D', 5), card('D', 6), card('D', 7), card('D', 8)],
        [card('C', 2), card('C', 3), card('C', 4), card('C', 5), card('C', 6), card('C', 7), card('C', 8)],
      ],
    });
    expect(findForcedWinner(hand, defaultRuleSet)).toBeNull();
  });
});
