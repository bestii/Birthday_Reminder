import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, IconButton, Text } from 'react-native-paper';

import type {
  GroupWithPeopleCount,
  Repository,
} from '../db/repository';
import { useTheme } from '../theme/ThemeContext';

interface ManageGroupsScreenProps {
  repository: Pick<
    Repository,
    'listGroupsWithPeopleCount' | 'createGroup' | 'deleteGroup' | 'findGroupByName'
  >;
}

function peopleLabel(count: number): string {
  return `${count} ${count === 1 ? 'person' : 'people'}`;
}

interface OverlayProps {
  title: string;
  onDismiss: () => void;
  children: React.ReactNode;
}

function DialogOverlay({
  title,
  onDismiss,
  children,
  topInset,
  bottomInset,
}: OverlayProps & { topInset: number; bottomInset: number }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityLabel="Dismiss dialog"
      onPress={onDismiss}
      style={[styles.backdrop, { paddingTop: topInset, paddingBottom: bottomInset }]}
    >
      <Pressable
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
        onPress={() => {}}
      >
        <Text variant="titleLarge" style={[styles.cardTitle, { color: colors.text }]}>
          {title}
        </Text>
        {children}
      </Pressable>
    </Pressable>
  );
}

export function ManageGroupsScreen({ repository }: ManageGroupsScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [groups, setGroups] = useState<GroupWithPeopleCount[]>(() =>
    repository.listGroupsWithPeopleCount(),
  );

  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [addError, setAddError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<GroupWithPeopleCount | null>(
    null,
  );

  const refresh = () => {
    setGroups(repository.listGroupsWithPeopleCount());
  };

  const openAdd = () => {
    setNewName('');
    setAddError(null);
    setAddOpen(true);
  };

  const submitAdd = () => {
    const trimmed = newName.trim();
    if (trimmed.length === 0) {
      setAddError('Group name is required.');
      return;
    }
    if (repository.findGroupByName(trimmed)) {
      setAddError('A group with this name already exists.');
      return;
    }
    repository.createGroup({ name: trimmed });
    setAddOpen(false);
    refresh();
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    repository.deleteGroup(deleteTarget.id);
    setDeleteTarget(null);
    refresh();
  };

  const renderItem = ({ item }: { item: GroupWithPeopleCount }) => (
    <View
      style={[
        styles.row,
        { backgroundColor: colors.surface, borderColor: colors.border },
      ]}
    >
      <View style={styles.rowText}>
        <Text variant="titleMedium" style={{ color: colors.text }}>
          {item.name}
        </Text>
        <Text variant="bodySmall" style={{ color: colors.textSecondary }}>
          {peopleLabel(item.peopleCount)}
        </Text>
      </View>
      <IconButton
        icon="trash-can-outline"
        accessibilityLabel={`Delete group ${item.name}`}
        onPress={() => setDeleteTarget(item)}
      />
    </View>
  );

  if (groups.length === 0) {
    return (
      <View
        style={[
          styles.emptyContainer,
          {
            backgroundColor: colors.background,
            paddingTop: insets.top + 24,
            paddingBottom: insets.bottom + 24,
          },
        ]}
      >
        <Text variant="bodyLarge" style={[styles.emptyText, { color: colors.text }]}>
          No groups yet. Tap + to create your first group.
        </Text>
        <IconButton
          icon="plus"
          mode="contained"
          accessibilityLabel="Add group"
          onPress={openAdd}
        />
        {addOpen ? (
          <DialogOverlay
            title="New Group"
            onDismiss={() => setAddOpen(false)}
            topInset={insets.top}
            bottomInset={insets.bottom}
          >
            <TextInput
              placeholder="Group name"
              value={newName}
              onChangeText={(text) => {
                setNewName(text);
                if (addError) setAddError(null);
              }}
              style={[styles.input, { borderColor: colors.border, color: colors.text }]}
              placeholderTextColor={colors.textSecondary}
            />
            {addError ? (
              <Text variant="bodySmall" style={[styles.error, { color: colors.accent }]}>
                {addError}
              </Text>
            ) : null}
            <View style={styles.actions}>
              <Button onPress={() => setAddOpen(false)}>Cancel</Button>
              <Button onPress={submitAdd}>Add</Button>
            </View>
          </DialogOverlay>
        ) : null}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.headerRow, { paddingTop: insets.top + 8 }]}>
        <Text variant="titleLarge" style={{ color: colors.text }}>
          Manage Groups
        </Text>
        <IconButton
          icon="plus"
          mode="contained"
          accessibilityLabel="Add group"
          onPress={openAdd}
        />
      </View>
      <FlatList
        data={groups}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + 16 },
        ]}
      />
      {addOpen ? (
        <DialogOverlay
          title="New Group"
          onDismiss={() => setAddOpen(false)}
          topInset={insets.top}
          bottomInset={insets.bottom}
        >
          <TextInput
            placeholder="Group name"
            value={newName}
            onChangeText={(text) => {
              setNewName(text);
              if (addError) setAddError(null);
            }}
            style={[styles.input, { borderColor: colors.border, color: colors.text }]}
            placeholderTextColor={colors.textSecondary}
          />
          {addError ? (
            <Text variant="bodySmall" style={[styles.error, { color: colors.accent }]}>
              {addError}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Button onPress={() => setAddOpen(false)}>Cancel</Button>
            <Button onPress={submitAdd}>Add</Button>
          </View>
        </DialogOverlay>
      ) : null}
      {deleteTarget ? (
        <DialogOverlay
          title={`Delete "${deleteTarget.name}"?`}
          onDismiss={() => setDeleteTarget(null)}
          topInset={insets.top}
          bottomInset={insets.bottom}
        >
          <Text variant="bodyMedium" style={{ color: colors.text, marginBottom: 16 }}>
            This group will be removed. People assigned to it will no longer be
            in this group.
          </Text>
          <View style={styles.actions}>
            <Button onPress={() => setDeleteTarget(null)}>Cancel</Button>
            <Button onPress={confirmDelete}>Delete</Button>
          </View>
        </DialogOverlay>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 16,
    paddingRight: 4,
    borderWidth: 1,
    borderRadius: 12,
    minHeight: 64,
  },
  rowText: {
    flex: 1,
    paddingVertical: 12,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  emptyText: {
    textAlign: 'center',
  },
  input: {
    marginBottom: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  error: {
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderRadius: 12,
    padding: 20,
  },
  cardTitle: {
    marginBottom: 12,
  },
});