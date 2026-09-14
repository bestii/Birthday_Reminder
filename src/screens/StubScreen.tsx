import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import { useTheme } from '../theme/ThemeContext';

interface StubScreenProps {
  title: string;
}

export function StubScreen({ title }: StubScreenProps) {
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="titleLarge" style={{ color: colors.text }}>
        {title}
      </Text>
      <Text variant="bodyMedium" style={{ color: colors.textSecondary, marginTop: 8 }}>
        Coming soon.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
});