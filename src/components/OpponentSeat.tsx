import { StyleSheet, Text, View } from 'react-native';

import { Player } from '../engine/types';
import { useTheme } from '../theme/useTheme';
import { PlayingCard } from './Card';

export type SeatPosition = 'top' | 'left' | 'right';

// Masayı gerçekçi göstermek için her rakip, insan oyuncuya göre 90 derecelik
// bir açıyla oturur: karşıdaki (top) ters, sol/sağdakiler yana dönük.
const ROTATION: Record<SeatPosition, number> = {
  top: 180,
  left: 90,
  right: -90,
};

const FAN_CARD_WIDTH = 20;
const FAN_OVERLAP = FAN_CARD_WIDTH * 0.6;
const FAN_LENGTH = 20 + 12 * (FAN_CARD_WIDTH - FAN_OVERLAP); // 13 kartlık azami yelpaze uzunluğu

type Props = {
  player: Player;
  score: number;
  cardCount: number;
  isTurn: boolean;
  position: SeatPosition;
};

export function OpponentSeat({ player, score, cardCount, isTurn, position }: Props) {
  const theme = useTheme();
  const isVertical = position !== 'top';

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          { backgroundColor: theme.surface, borderColor: isTurn ? theme.accent : 'transparent' },
        ]}
      >
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {player.name}
        </Text>
        <Text style={[styles.meta, { color: theme.textMuted }]}>{score}</Text>
      </View>
      <View style={[styles.fanWrap, isVertical ? styles.fanWrapVertical : styles.fanWrapHorizontal]}>
        <View style={[styles.fanRow, { transform: [{ rotate: `${ROTATION[position]}deg` }] }]}>
          {Array.from({ length: cardCount }).map((_, i) => (
            <View key={i} style={i === 0 ? undefined : { marginLeft: -FAN_OVERLAP }}>
              <PlayingCard faceDown width={FAN_CARD_WIDTH} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 4,
  },
  badge: {
    borderRadius: 10,
    borderWidth: 2,
    paddingVertical: 4,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  name: {
    fontSize: 12,
    fontWeight: '700',
    maxWidth: 84,
  },
  meta: {
    fontSize: 10,
  },
  fanWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fanWrapHorizontal: {
    height: 34,
  },
  fanWrapVertical: {
    width: 34,
    height: FAN_LENGTH,
  },
  fanRow: {
    flexDirection: 'row',
  },
});
