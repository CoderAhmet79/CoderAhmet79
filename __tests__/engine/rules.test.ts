import { determineTrickWinner, isHandFinished, legalPlaysInHand } from '../../src/engine/rules';
import { defaultRuleSet, Trick } from '../../src/engine/types';
import { baseHand, card, trick } from '../../test-utils/engineFixtures';

describe('legalPlaysInHand — renk takibi', () => {
  it('must follow the led suit when possible', () => {
    const hand = baseHand({
      contract: 'NO_TRICKS',
      currentTrick: { leader: 0, plays: [{ player: 0, card: card('S', 10) }] },
      hands: [[], [card('S', 5), card('H', 9)], [], []],
    });
    expect(legalPlaysInHand(hand, 1, defaultRuleSet)).toEqual([card('S', 5)]);
  });

  it('allows any card when void of the led suit in a non-trump hand', () => {
    const hand = baseHand({
      contract: 'NO_TRICKS',
      currentTrick: { leader: 0, plays: [{ player: 0, card: card('S', 10) }] },
      hands: [[], [card('H', 9), card('D', 4)], [], []],
    });
    expect(legalPlaysInHand(hand, 1, defaultRuleSet)).toEqual([card('H', 9), card('D', 4)]);
  });
});

describe('legalPlaysInHand — kupa ile başlama yasağı', () => {
  it('forbids leading hearts in NO_HEARTS while another suit is held', () => {
    const hand = baseHand({
      contract: 'NO_HEARTS',
      hands: [[card('H', 10), card('S', 4)], [], [], []],
    });
    expect(legalPlaysInHand(hand, 0, defaultRuleSet)).toEqual([card('S', 4)]);
  });

  it('allows leading hearts in NO_HEARTS once only hearts remain', () => {
    const hand = baseHand({
      contract: 'NO_HEARTS',
      hands: [[card('H', 10), card('H', 4)], [], [], []],
    });
    expect(legalPlaysInHand(hand, 0, defaultRuleSet)).toEqual([card('H', 10), card('H', 4)]);
  });

  it('applies the same restriction in RIFKI', () => {
    const hand = baseHand({
      contract: 'RIFKI',
      hands: [[card('H', 13), card('C', 2)], [], [], []],
    });
    expect(legalPlaysInHand(hand, 0, defaultRuleSet)).toEqual([card('C', 2)]);
  });

  it('does not restrict leading hearts in other contracts', () => {
    const hand = baseHand({
      contract: 'NO_TRICKS',
      hands: [[card('H', 10), card('S', 4)], [], [], []],
    });
    expect(legalPlaysInHand(hand, 0, defaultRuleSet)).toEqual([card('H', 10), card('S', 4)]);
  });
});

describe('legalPlaysInHand — koz zorunluluğu', () => {
  it('requires trumping when void of the led suit and mustTrumpWhenVoid is on', () => {
    const hand = baseHand({
      contract: 'TRUMP',
      trumpSuit: 'C',
      currentTrick: { leader: 0, plays: [{ player: 0, card: card('S', 10) }] },
      hands: [[], [card('H', 9), card('C', 4)], [], []],
    });
    expect(legalPlaysInHand(hand, 1, defaultRuleSet)).toEqual([card('C', 4)]);
  });

  it('does not require trumping when the setting is off', () => {
    const hand = baseHand({
      contract: 'TRUMP',
      trumpSuit: 'C',
      currentTrick: { leader: 0, plays: [{ player: 0, card: card('S', 10) }] },
      hands: [[], [card('H', 9), card('C', 4)], [], []],
    });
    const ruleSet = { ...defaultRuleSet, mustTrumpWhenVoid: false };
    expect(legalPlaysInHand(hand, 1, ruleSet)).toEqual([card('H', 9), card('C', 4)]);
  });

  it('allows any card when void of both the led suit and trump', () => {
    const hand = baseHand({
      contract: 'TRUMP',
      trumpSuit: 'C',
      currentTrick: { leader: 0, plays: [{ player: 0, card: card('S', 10) }] },
      hands: [[], [card('H', 9), card('D', 4)], [], []],
    });
    expect(legalPlaysInHand(hand, 1, defaultRuleSet)).toEqual([card('H', 9), card('D', 4)]);
  });

  it('is free to lead trump', () => {
    const hand = baseHand({
      contract: 'TRUMP',
      trumpSuit: 'C',
      hands: [[card('C', 9), card('S', 4)], [], [], []],
    });
    expect(legalPlaysInHand(hand, 0, defaultRuleSet)).toEqual([card('C', 9), card('S', 4)]);
  });
});

describe('determineTrickWinner', () => {
  it('picks the highest card of the led suit in a non-trump hand', () => {
    const t: Trick = trick([
      { player: 0, card: card('S', 10) },
      { player: 1, card: card('S', 14) },
      { player: 2, card: card('H', 13) },
      { player: 3, card: card('S', 2) },
    ]);
    const hand = baseHand({ contract: 'NO_TRICKS' });
    expect(determineTrickWinner(hand, t)).toBe(1);
  });

  it('picks the highest trump over any led-suit card', () => {
    const t: Trick = trick([
      { player: 0, card: card('S', 14) },
      { player: 1, card: card('C', 2) },
      { player: 2, card: card('S', 10) },
      { player: 3, card: card('H', 5) },
    ]);
    const hand = baseHand({ contract: 'TRUMP', trumpSuit: 'C' });
    expect(determineTrickWinner(hand, t)).toBe(1);
  });

  it('picks the highest led-suit card when no trump is played', () => {
    const t: Trick = trick([
      { player: 0, card: card('S', 9) },
      { player: 1, card: card('D', 14) },
      { player: 2, card: card('S', 13) },
      { player: 3, card: card('H', 5) },
    ]);
    const hand = baseHand({ contract: 'TRUMP', trumpSuit: 'C' });
    expect(determineTrickWinner(hand, t)).toBe(2);
  });
});

describe('isHandFinished', () => {
  it('ends a RIFKI hand as soon as the K♥ trick completes', () => {
    const hand = baseHand({ contract: 'RIFKI' });
    const t = trick(
      [
        { player: 0, card: card('H', 13) },
        { player: 1, card: card('H', 4) },
        { player: 2, card: card('H', 9) },
        { player: 3, card: card('H', 2) },
      ],
      2,
    );
    expect(isHandFinished(hand, [t], defaultRuleSet)).toBe(true);
  });

  it('does not end early when the setting is off', () => {
    const hand = baseHand({ contract: 'RIFKI' });
    const t = trick(
      [
        { player: 0, card: card('H', 13) },
        { player: 1, card: card('H', 4) },
        { player: 2, card: card('H', 9) },
        { player: 3, card: card('H', 2) },
      ],
      2,
    );
    const ruleSet = { ...defaultRuleSet, earlyEndOnPenaltyExhausted: false };
    expect(isHandFinished(hand, [t], ruleSet)).toBe(false);
  });

  it('ends a NO_QUEENS hand once all 4 queens have been played', () => {
    const hand = baseHand({ contract: 'NO_QUEENS' });
    const tricks: Trick[] = [
      trick(
        [
          { player: 0, card: card('S', 12) },
          { player: 1, card: card('S', 4) },
          { player: 2, card: card('H', 12) },
          { player: 3, card: card('S', 2) },
        ],
        0,
      ),
      trick(
        [
          { player: 0, card: card('D', 12) },
          { player: 1, card: card('D', 4) },
          { player: 2, card: card('C', 12) },
          { player: 3, card: card('D', 2) },
        ],
        1,
      ),
    ];
    expect(isHandFinished(hand, tricks, defaultRuleSet)).toBe(true);
  });

  it('ends a NO_MEN hand once all 8 kings/jacks have been played', () => {
    const hand = baseHand({ contract: 'NO_MEN' });
    const tricks: Trick[] = [
      trick(
        [
          { player: 0, card: card('S', 13) },
          { player: 1, card: card('H', 13) },
          { player: 2, card: card('D', 13) },
          { player: 3, card: card('C', 13) },
        ],
        0,
      ),
      trick(
        [
          { player: 0, card: card('S', 11) },
          { player: 1, card: card('H', 11) },
          { player: 2, card: card('D', 11) },
          { player: 3, card: card('C', 11) },
        ],
        1,
      ),
    ];
    expect(isHandFinished(hand, tricks, defaultRuleSet)).toBe(true);
  });

  it('does not end a normal hand before 13 tricks', () => {
    const hand = baseHand({ contract: 'NO_TRICKS' });
    expect(isHandFinished(hand, [], defaultRuleSet)).toBe(false);
  });

  it('ends any hand once all 13 tricks are complete', () => {
    const hand = baseHand({ contract: 'LAST_TWO' });
    const tricks: Trick[] = Array.from({ length: 13 }, () =>
      trick(
        [
          { player: 0, card: card('S', 2) },
          { player: 1, card: card('S', 3) },
          { player: 2, card: card('S', 4) },
          { player: 3, card: card('S', 5) },
        ],
        3,
      ),
    );
    expect(isHandFinished(hand, tricks, defaultRuleSet)).toBe(true);
  });
});
