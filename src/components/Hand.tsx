import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { cardId, containsCard, sortHand } from '../engine/cards';
import { Card } from '../engine/types';
import { cardWidthForScreen, PlayingCard } from './Card';

type Props = {
  cards: Card[];
  legal: Card[];
  onPlay: (card: Card) => void;
};

export function Hand({ cards, legal, onPlay }: Props) {
  const sorted = sortHand(cards);
  const width = cardWidthForScreen();
  const overlap = width * 0.55;

  return (
    <View style={styles.row}>
      {sorted.map((c, i) => {
        const isLegal = containsCard(legal, c);
        return (
          <TouchableOpacity
            key={cardId(c)}
            disabled={!isLegal}
            onPress={() => onPlay(c)}
            style={[styles.cardSlot, { marginLeft: i === 0 ? 0 : -overlap, zIndex: i }]}
          >
            <PlayingCard card={c} width={width} dimmed={!isLegal} />
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  cardSlot: {
    // marginLeft applied inline per-card for the fan overlap
  },
});
