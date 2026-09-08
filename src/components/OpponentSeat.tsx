import { StyleSheet, Text, View } from 'react-native';

import { Player } from '../engine/types';
import { useTheme } from '../theme/useTheme';
import { PlayingCard } from './Card';

type Props = {
  player: Player;
  score: number;
  cardCount: number;
  isTurn: boolean;
};

export function OpponentSeat({ player, score, cardCount, isTurn }: Props) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.seat,
        { backgroundColor: theme.surface, borderColor: isTurn ? theme.accent : 'transparent' },
      ]}
    >
      <View style={styles.miniCard}>
        <PlayingCard faceDown width={26} />
      </View>
      <View style={styles.info}>
        <Text style={[styles.name, { color: theme.text }]} numberOfLines={1}>
          {player.name}
        </Text>
        <Text style={[styles.meta, { color: theme.textMuted }]}>
          {score} · {cardCount} kart
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  seat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 2,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  miniCard: {},
  info: {
    minWidth: 0,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
  },
  meta: {
    fontSize: 11,
  },
});
