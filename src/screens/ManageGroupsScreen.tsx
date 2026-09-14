import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';

import type { Repository } from '../db/repository';
import { useTheme } from '../theme/ThemeContext';

interface ManageGroupsScreenProps {
  repository: Pick<Repository, 'listGroups' | 'createGroup' | 'deleteGroup'>;
}

export function ManageGroupsScreen({ repository }: ManageGroupsScreenProps) {
  const { colors } = useTheme();
  const groups = repository.listGroups();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text variant="titleLarge" style={{ color: colors.text }}>
        Manage Groups
      </Text>
      <Text variant="bodyMedium" style={{ color: colors.textSecondary, marginTop: 8 }}>
        {groups.length === 0
          ? 'No groups yet. Tap + to create your first group.'
          : `${groups.length} group${groups.length === 1 ? '' : 's'}.`}
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