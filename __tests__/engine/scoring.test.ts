import { scoreHand } from '../../src/engine/scoring';
import { Trick } from '../../src/engine/types';
import { baseHand, card, trick } from '../../test-utils/engineFixtures';

describe('scoreHand', () => {
  it('NO_TRICKS: -50 per trick taken', () => {
    const hand = baseHand({
      contract: 'NO_TRICKS',
      completedTricks: [
        trick(
          [
            { player: 0, card: card('S', 10) },
            { player: 1, card: card('S', 5) },
            { player: 2, card: card('S', 2) },
            { player: 3, card: card('S', 3) },
          ],
          0,
        ),
        trick(
          [
            { player: 1, card: card('H', 10) },
            { player: 2, card: card('H', 5) },
            { player: 3, card: card('H', 2) },
            { player: 0, card: card('H', 3) },
          ],
          1,
        ),
      ],
    });
    expect(scoreHand(hand)).toEqual([-50, -50, 0, 0]);
  });

  it('NO_HEARTS: -30 per heart in a taken trick', () => {
    const hand = baseHand({
      contract: 'NO_HEARTS',
      completedTricks: [
        trick(
          [
            { player: 0, card: card('S', 10) },
            { player: 1, card: card('H', 5) },
            { player: 2, card: card('H', 2) },
            { player: 3, card: card('S', 3) },
          ],
          0,
        ),
      ],
    });
    expect(scoreHand(hand)).toEqual([-60, 0, 0, 0]);
  });

  it('NO_MEN: -60 per king/jack in a taken trick', () => {
    const hand = baseHand({
      contract: 'NO_MEN',
      completedTricks: [
        trick(
          [
            { player: 0, card: card('S', 13) },
            { player: 1, card: card('H', 11) },
            { player: 2, card: card('C', 4) },
            { player: 3, card: card('D', 3) },
          ],
          0,
        ),
      ],
    });
    expect(scoreHand(hand)).toEqual([-120, 0, 0, 0]);
  });

  it('NO_QUEENS: -100 per queen in a taken trick', () => {
    const hand = baseHand({
      contract: 'NO_QUEENS',
      completedTricks: [
        trick(
          [
            { player: 0, card: card('S', 12) },
            { player: 1, card: card('H', 12) },
            { player: 2, card: card('C', 4) },
            { player: 3, card: card('D', 3) },
          ],
          2,
        ),
      ],
    });
    expect(scoreHand(hand)).toEqual([0, 0, -200, 0]);
  });

  it('RIFKI: flat -320 to whoever wins the K♥ trick', () => {
    const hand = baseHand({
      contract: 'RIFKI',
      completedTricks: [
        trick(
          [
            { player: 0, card: card('H', 13) },
            { player: 1, card: card('H', 4) },
            { player: 2, card: card('H', 9) },
            { player: 3, card: card('H', 2) },
          ],
          2,
        ),
      ],
    });
    expect(scoreHand(hand)).toEqual([0, 0, -320, 0]);
  });

  it('LAST_TWO: -180 per hand (12th and 13th tricks), stacking if the same player takes both', () => {
    const tricks: Trick[] = [];
    for (let i = 0; i < 11; i++) {
      tricks.push(
        trick(
          [
            { player: 0, card: card('S', 2) },
            { player: 1, card: card('S', 3) },
            { player: 2, card: card('S', 4) },
            { player: 3, card: card('S', 5) },
          ],
          0,
        ),
      );
    }
    tricks.push(
      trick(
        [
          { player: 0, card: card('D', 2) },
          { player: 1, card: card('D', 3) },
          { player: 2, card: card('D', 4) },
          { player: 3, card: card('D', 5) },
        ],
        3,
      ),
    );
    tricks.push(
      trick(
        [
          { player: 0, card: card('C', 2) },
          { player: 1, card: card('C', 3) },
          { player: 2, card: card('C', 4) },
          { player: 3, card: card('C', 5) },
        ],
        3,
      ),
    );
    const hand = baseHand({ contract: 'LAST_TWO', completedTricks: tricks });
    expect(scoreHand(hand)).toEqual([0, 0, 0, -360]);
  });

  it('TRUMP: +50 per trick taken', () => {
    const hand = baseHand({
      contract: 'TRUMP',
      trumpSuit: 'C',
      completedTricks: [
        trick(
          [
            { player: 0, card: card('S', 10) },
            { player: 1, card: card('S', 5) },
            { player: 2, card: card('S', 2) },
            { player: 3, card: card('S', 3) },
          ],
          0,
        ),
      ],
    });
    expect(scoreHand(hand)).toEqual([50, 0, 0, 0]);
  });

  it('returns all zeros when the contract is not yet set', () => {
    const hand = baseHand({ contract: null });
    expect(scoreHand(hand)).toEqual([0, 0, 0, 0]);
  });
});
