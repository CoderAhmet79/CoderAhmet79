import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { suitSymbol } from '../engine/cards';
import { Contract, Suit } from '../engine/types';
import { tr } from '../i18n/tr';
import { useTheme } from '../theme/useTheme';

const SUITS: Suit[] = ['S', 'H', 'D', 'C'];

type ContractStepProps = {
  visible: boolean;
  options: Contract[];
  remaining: Record<Contract, number>;
  onChoose: (contract: Contract) => void;
};

export function ContractSheet({ visible, options, remaining, onChoose }: ContractStepProps) {
  const theme = useTheme();
  const allContracts: Contract[] = [
    'NO_TRICKS',
    'NO_HEARTS',
    'NO_MEN',
    'NO_QUEENS',
    'RIFKI',
    'LAST_TWO',
    'TRUMP',
  ];

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.text }]}>Kontrat Seç</Text>
          {allContracts.map((contract) => {
            const available = options.includes(contract);
            return (
              <TouchableOpacity
                key={contract}
                disabled={!available}
                onPress={() => onChoose(contract)}
                style={[styles.row, { opacity: available ? 1 : 0.4 }]}
              >
                <Text style={[styles.rowLabel, { color: theme.text }]}>{tr.contracts[contract]}</Text>
                <Text style={[styles.rowRemaining, { color: theme.textMuted }]}>
                  kalan: {remaining[contract]}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </Modal>
  );
}

type TrumpStepProps = {
  visible: boolean;
  onChoose: (suit: Suit) => void;
};

export function TrumpSheet({ visible, onChoose }: TrumpStepProps) {
  const theme = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={[styles.sheet, { backgroundColor: theme.surface }]}>
          <Text style={[styles.title, { color: theme.text }]}>Koz Rengi Seç</Text>
          <View style={styles.suitRow}>
            {SUITS.map((suit) => (
              <TouchableOpacity
                key={suit}
                onPress={() => onChoose(suit)}
                style={[styles.suitButton, { borderColor: theme.accent }]}
              >
                <Text style={[styles.suitSymbol, { color: theme.text }]}>{suitSymbol(suit)}</Text>
              </TouchableOpacity>
            ))}
          </View>
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
    padding: 20,
    paddingBottom: 36,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(128,128,128,0.3)',
  },
  rowLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  rowRemaining: {
    fontSize: 13,
  },
  suitRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
  },
  suitButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  suitSymbol: {
    fontSize: 28,
  },
});
