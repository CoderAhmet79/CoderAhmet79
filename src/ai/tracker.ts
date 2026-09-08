import { containsCard } from '../engine/cards';
import { createDeck } from '../engine/deck';
import { PublicState } from '../engine/publicView';
import { Card, PlayerId, Suit } from '../engine/types';

// PublicState'ten türetilir; oynanmış tüm kartları, her oyuncunun kesin
// "renksiz" olduğu renkleri ve kalan (henüz görülmemiş) kartlar kümesini
// tutar. AI yalnızca bu bilgiyle çalışır — tam GameState'e erişimi yoktur.
export class CardTracker {
  readonly playedCards: Card[];
  readonly remainingUnseen: Card[];
  readonly voidSuits: Record<PlayerId, Suit[]>;
  readonly handSizes: [number, number, number, number];

  constructor(view: PublicState) {
    const hand = view.hand;
    if (!hand) {
      this.playedCards = [];
      this.remainingUnseen = [];
      this.voidSuits = { 0: [], 1: [], 2: [], 3: [] };
      this.handSizes = [0, 0, 0, 0];
      return;
    }

    const played: Card[] = [];
    for (const trick of hand.completedTricks) {
      for (const play of trick.plays) played.push(play.card);
    }
    for (const play of hand.currentTrick.plays) played.push(play.card);

    this.playedCards = played;
    this.voidSuits = hand.voidSuits;
    this.handSizes = hand.handSizes;
    this.remainingUnseen = createDeck().filter(
      (c) => !containsCard(hand.myHand, c) && !containsCard(played, c),
    );
  }

  isVoid(player: PlayerId, suit: Suit): boolean {
    return this.voidSuits[player].includes(suit);
  }
}
