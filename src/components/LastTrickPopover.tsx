import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { Player, Trick } from '../engine/types';
import { useTheme } from '../theme/useTheme';
import { PlayingCard } from './Card';

type Props = {
  visible: boolean;
  onClose: () => void;
  trick: Trick | null;
  players: Player[];
};

// "Son el" kutusu: bir önceki tamamlanmış trick'in 4 kartını gösterir.
// Ceza ellerinde (Rıfkı, Kız Almaz vb.) kimin ne aldığını hatırlamak
// kritik olduğu için masada her an açılabilir.
export function LastTrickPopover({ visible, onClose, trick, players }: Props) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <View style={[styles.card, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.text }]}>Son El</Text>
          {trick ? (
            <View style={styles.row}>
              {trick.plays.map((play) => (
                <View key={play.player} style={styles.slot}>
                  <PlayingCard card={play.card} width={44} />
                  <Text style={[styles.name, { color: theme.textMuted }]} numberOfLines={1}>
                    {players[play.player].name}
                    {trick.winner === play.player ? ' ✓' : ''}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <Text style={[styles.empty, { color: theme.textMuted }]}>Henüz oynanmış el yok.</Text>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  card: {
    borderRadius: 16,
    padding: 20,
    minWidth: 260,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  slot: {
    alignItems: 'center',
    gap: 4,
    maxWidth: 56,
  },
  name: {
    fontSize: 11,
  },
  empty: {
    fontSize: 14,
    textAlign: 'center',
  },
});
