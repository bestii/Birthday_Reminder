import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { IconButton, Text } from 'react-native-paper';

import type { Repository } from '../db/repository';
import type { Group } from '../db/types';
import type { HomeDestination } from '../navigation/types';
import { useTheme } from '../theme/ThemeContext';

export type HomeNavigationTarget = HomeDestination;

interface HomeScreenProps {
  repository: Repository;
  onNavigate: (target: HomeNavigationTarget) => void;
}

const MENU_ENTRIES: { label: string; target: HomeDestination }[] = [
  { label: 'Settings', target: 'Settings' },
  { label: 'Notifications', target: 'Notifications' },
  { label: 'Backup', target: 'Backup' },
];

const FAB_ENTRIES: { label: string; target: HomeDestination }[] = [
  { label: 'Add New', target: 'AddBirthday' },
  { label: 'Add Event Category', target: 'AddEvent' },
  { label: 'Manage Groups', target: 'ManageGroups' },
];

export function HomeScreen({ repository, onNavigate }: HomeScreenProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [menuOpen, setMenuOpen] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [people, setPeople] = useState(() => repository.listPeople());
  const [groups, setGroups] = useState<Group[]>(() => repository.listGroups());

  useFocusEffect(
    useCallback(() => {
      setPeople(repository.listPeople());
      setGroups(repository.listGroups());
    }, [repository]),
  );

  const toggleFab = () => setFabOpen((o) => !o);
  const pickFromFab = (target: HomeDestination) => {
    setFabOpen(false);
    onNavigate(target);
  };
  const closeMenu = () => setMenuOpen(false);
  const pickFromMenu = (target: HomeDestination) => {
    setMenuOpen(false);
    onNavigate(target);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 4 }]}>
        <IconButton
          icon="menu"
          accessibilityLabel="Open menu"
          onPress={() => setMenuOpen(true)}
        />
        <View style={styles.headerRight}>
          <IconButton icon="magnify" accessibilityLabel="Search" onPress={() => {}} />
          <IconButton icon="filter-variant" accessibilityLabel="Filter" onPress={() => {}} />
        </View>
      </View>
      {groups.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillsRow}
          testID="group-pills"
        >
          {groups.map((g) => (
            <Text
              key={g.id}
              style={[
                styles.pill,
                { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
              ]}
            >
              {g.name}
            </Text>
          ))}
        </ScrollView>
      ) : null}
      {people.length === 0 ? (
        <View style={styles.emptyState}>
          <Text variant="titleMedium" style={{ color: colors.text }}>
            No birthdays yet
          </Text>
          <Text variant="bodyMedium" style={{ color: colors.textSecondary, marginTop: 8 }}>
            Tap to add your first birthday.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add a birthday"
            onPress={() => onNavigate('AddBirthday')}
            style={[styles.emptyAction, { backgroundColor: colors.accent }]}
          >
            <Text style={styles.emptyActionLabel}>Add a birthday</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.list}>
          {people.map((p) => (
            <Text key={p.id} style={{ color: colors.text }}>
              {p.name}
            </Text>
          ))}
        </ScrollView>
      )}
      {fabOpen ? (
        <View style={[styles.fabGroup, { bottom: insets.bottom + 88 }]}>
          {FAB_ENTRIES.map((entry) => (
            <Pressable
              key={entry.target}
              accessibilityRole="button"
              accessibilityLabel={entry.label}
              onPress={() => pickFromFab(entry.target)}
              style={[styles.fabSecondary, { backgroundColor: colors.accent }]}
            >
              <Text style={styles.fabSecondaryLabel}>{entry.label}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Toggle add menu"
        onPress={toggleFab}
        style={[styles.fabMain, { backgroundColor: colors.accent, bottom: insets.bottom + 16 }]}
      >
        <Text style={styles.fabMainLabel}>{fabOpen ? '×' : '+'}</Text>
      </Pressable>
      {menuOpen ? (
        <Pressable
          accessibilityLabel="Close menu"
          style={styles.menuBackdrop}
          onPress={closeMenu}
        >
          <Pressable
            style={[
              styles.menuSheet,
              { backgroundColor: colors.surface, borderColor: colors.border, marginTop: insets.top + 56 },
            ]}
            onPress={() => {}}
          >
            {MENU_ENTRIES.map((entry) => (
              <Pressable
                key={entry.target}
                accessibilityRole="button"
                onPress={() => pickFromMenu(entry.target)}
                style={({ pressed }) => [
                  styles.menuItem,
                  pressed && { backgroundColor: colors.border },
                ]}
              >
                <Text style={{ color: colors.text }}>{entry.label}</Text>
              </Pressable>
            ))}
          </Pressable>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  headerRight: {
    flexDirection: 'row',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyAction: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
  },
  emptyActionLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    padding: 16,
  },
  pillsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 6,
    gap: 6,
  },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    overflow: 'hidden',
    alignSelf: 'flex-start',
  },
  fabGroup: {
    position: 'absolute',
    right: 16,
    bottom: 88,
    alignItems: 'flex-end',
    gap: 12,
  },
  fabSecondary: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 28,
    minWidth: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabSecondaryLabel: {
    color: '#fff',
    fontWeight: '600',
  },
  fabMain: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  fabMainLabel: {
    color: '#fff',
    fontSize: 28,
    fontWeight: '600',
    lineHeight: 30,
  },
  menuBackdrop: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
  },
  menuSheet: {
    marginLeft: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 4,
    minWidth: 200,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  menuItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
});