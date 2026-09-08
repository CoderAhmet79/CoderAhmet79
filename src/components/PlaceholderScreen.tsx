import { router } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useTheme } from '../theme/useTheme';

export function PlaceholderScreen({ title }: { title: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: theme.table }]}>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      <TouchableOpacity style={styles.back} onPress={() => router.back()}>
        <Text style={[styles.backText, { color: theme.text }]}>←</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
  },
  back: {
    position: 'absolute',
    top: 56,
    left: 16,
    padding: 8,
  },
  backText: {
    fontSize: 24,
  },
});
