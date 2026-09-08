import { Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { HandScoreRow, Player } from '../engine/types';
import { tr } from '../i18n/tr';
import { useTheme } from '../theme/useTheme';

type Props = {
  visible: boolean;
  onClose: () => void;
  scoreTable: HandScoreRow[];
  players: Player[];
};

export function ScoreTable({ visible, onClose, scoreTable, players }: Props) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>{tr.scoreTable.title}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.close, { color: theme.text }]}>✕</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal>
            <View>
              <View style={styles.row}>
                <Text style={[styles.headCell, styles.handCell, { color: theme.textMuted }]}>El</Text>
                <Text style={[styles.headCell, styles.contractCell, { color: theme.textMuted }]}>Kontrat</Text>
                {players.map((p) => (
                  <Text key={p.id} style={[styles.headCell, styles.scoreCell, { color: theme.textMuted }]} numberOfLines={1}>
                    {p.name}
                  </Text>
                ))}
              </View>
              <ScrollView style={styles.body}>
                {scoreTable.map((row) => (
                  <View key={row.handNo} style={styles.row}>
                    <Text style={[styles.cell, styles.handCell, { color: theme.text }]}>{row.handNo}</Text>
                    <Text style={[styles.cell, styles.contractCell, { color: theme.text }]} numberOfLines={1}>
                      {tr.contracts[row.contract]}
                    </Text>
                    {row.scores.map((score, i) => (
                      <Text key={i} style={[styles.cell, styles.scoreCell, { color: theme.text }]}>
                        {score}
                      </Text>
                    ))}
                  </View>
                ))}
              </ScrollView>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 32,
    maxHeight: '75%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  close: {
    fontSize: 18,
  },
  body: {
    maxHeight: 380,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 6,
  },
  headCell: {
    fontSize: 12,
    fontWeight: '700',
  },
  cell: {
    fontSize: 13,
  },
  handCell: {
    width: 32,
  },
  contractCell: {
    width: 96,
  },
  scoreCell: {
    width: 72,
    textAlign: 'right',
  },
});
