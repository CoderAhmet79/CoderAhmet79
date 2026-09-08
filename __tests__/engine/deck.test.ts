import { cardId } from '../../src/engine/cards';
import { createDeck, dealCards } from '../../src/engine/deck';
import { createRng } from '../../src/engine/rng';

describe('deck', () => {
  it('creates 52 unique cards', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
    expect(new Set(deck.map(cardId)).size).toBe(52);
  });

  it('deals 4 hands of 13 unique cards each, covering the full deck', () => {
    const hands = dealCards(createRng(42));
    expect(hands).toHaveLength(4);
    hands.forEach((hand) => expect(hand).toHaveLength(13));
    const allIds = hands.flat().map(cardId);
    expect(new Set(allIds).size).toBe(52);
  });

  it('is reproducible for the same seed', () => {
    const handsA = dealCards(createRng(123));
    const handsB = dealCards(createRng(123));
    expect(handsA.map((h) => h.map(cardId))).toEqual(handsB.map((h) => h.map(cardId)));
  });

  it('produces different deals for different seeds', () => {
    const handsA = dealCards(createRng(1));
    const handsB = dealCards(createRng(2));
    expect(handsA.map((h) => h.map(cardId))).not.toEqual(handsB.map((h) => h.map(cardId)));
  });
});
