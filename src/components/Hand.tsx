import { useEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

import { cardId, containsCard, sortHand } from '../engine/cards';
import { Card } from '../engine/types';
import { useSettingsStore } from '../store/settingsStore';
import { cardWidthForScreen, PlayingCard } from './Card';

type Props = {
  cards: Card[];
  legal: Card[];
  onPlay: (card: Card) => void;
};

// Varsayılan: tek dokunuş oynar. "Onaylı oynama" açıksa ilk dokunuş kartı
// hafif kaldırır (seçili gösterir), aynı karta ikinci dokunuş oynar; başka
// bir karta dokunmak seçimi ona taşır.
export function Hand({ cards, legal, onPlay }: Props) {
  const confirmPlay = useSettingsStore((s) => s.settings.confirmPlay);
  const [liftedId, setLiftedId] = useState<string | null>(null);
  const sorted = sortHand(cards);
  const width = cardWidthForScreen();
  const overlap = width * 0.55;

  useEffect(() => {
    setLiftedId(null);
  }, [cards.length]);

  function handlePress(card: Card) {
    if (!confirmPlay) {
      onPlay(card);
      return;
    }
    const id = cardId(card);
    if (liftedId === id) {
      setLiftedId(null);
      onPlay(card);
    } else {
      setLiftedId(id);
    }
  }

  return (
    <View style={styles.row}>
      {sorted.map((c, i) => {
        const isLegal = containsCard(legal, c);
        const isLifted = confirmPlay && liftedId === cardId(c);
        return (
          <TouchableOpacity
            key={cardId(c)}
            disabled={!isLegal}
            onPress={() => handlePress(c)}
            style={[
              styles.cardSlot,
              {
                marginLeft: i === 0 ? 0 : -overlap,
                zIndex: i,
                transform: [{ translateY: isLifted ? -16 : 0 }],
              },
            ]}
          >
            <PlayingCard card={c} width={width} dimmed={!isLegal} selected={isLifted} />
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
