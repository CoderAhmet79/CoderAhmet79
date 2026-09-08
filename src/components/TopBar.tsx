import { StyleSheet, Text, View } from 'react-native';

import { suitSymbol } from '../engine/cards';
import { HandState, Player, TOTAL_HANDS } from '../engine/types';
import { tr } from '../i18n/tr';
import { useTheme } from '../theme/useTheme';

type Props = {
  hand: HandState;
  players: Player[];
};

export function TopBar({ hand, players }: Props) {
  const theme = useTheme();
  return (
    <View style={[styles.bar, { backgroundColor: theme.surface }]}>
      <Text style={[styles.handLabel, { color: theme.text }]}>{tr.table.handLabel(hand.handNo, TOTAL_HANDS)}</Text>
      <View style={styles.contractGroup}>
        {hand.contract ? (
          <Text style={[styles.contract, { color: theme.accent }]}>
            {tr.contracts[hand.contract]}
            {hand.trumpSuit ? ` ${suitSymbol(hand.trumpSuit)}` : ''}
          </Text>
        ) : null}
        <Text style={[styles.declarer, { color: theme.textMuted }]}>{players[hand.declarer].name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 52,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  handLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  contractGroup: {
    alignItems: 'flex-end',
  },
  contract: {
    fontSize: 14,
    fontWeight: '700',
  },
  declarer: {
    fontSize: 11,
  },
});
