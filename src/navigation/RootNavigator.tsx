import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Text } from 'react-native';

import { AddBirthdayScreen } from '../screens/AddBirthdayScreen';
import { AddEventScreen } from '../screens/AddEventScreen';
import { BackupScreen } from '../screens/BackupScreen';
import { CalendarScreen } from '../screens/CalendarScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { ManageGroupsScreen } from '../screens/ManageGroupsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import type { Repository } from '../db/repository';
import { useTheme } from '../theme/ThemeContext';
import type { HomeStackParamList, RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();

function HomeTabIcon({ color }: { color: string }) {
  return <Text style={{ color }}>☰</Text>;
}

function CalendarTabIcon({ color }: { color: string }) {
  return <Text style={{ color }}>📅</Text>;
}

interface HomeStackNavigatorProps {
  repository: Repository;
}

function HomeStackNavigator({ repository }: HomeStackNavigatorProps) {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerShown: true,
      }}
    >
      <HomeStack.Screen name="HomeMain" options={{ title: 'Home', headerShown: false }}>
        {({ navigation }) => (
          <HomeScreen
            repository={repository}
            onNavigate={(target) => navigation.navigate(target)}
          />
        )}
      </HomeStack.Screen>
      <HomeStack.Screen name="AddBirthday" component={AddBirthdayScreen} options={{ title: 'Add Birthday' }} />
      <HomeStack.Screen name="AddEvent" component={AddEventScreen} options={{ title: 'Add Event Category' }} />
      <HomeStack.Screen
        name="ManageGroups"
        options={{ title: 'Manage Groups', headerShown: false }}
      >
        {() => <ManageGroupsScreen repository={repository} />}
      </HomeStack.Screen>
      <HomeStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <HomeStack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notifications' }} />
      <HomeStack.Screen name="Backup" component={BackupScreen} options={{ title: 'Backup' }} />
    </HomeStack.Navigator>
  );
}

interface RootNavigatorProps {
  repository: Repository;
}

export function RootNavigator({ repository }: RootNavigatorProps) {
  const { mode, colors } = useTheme();
  const base = mode === 'dark' ? DarkTheme : DefaultTheme;

  const navTheme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
    },
  };

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={{
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.textSecondary,
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Home"
          options={{ tabBarIcon: HomeTabIcon, title: 'Home' }}
        >
          {() => <HomeStackNavigator repository={repository} />}
        </Tab.Screen>
        <Tab.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{ tabBarIcon: CalendarTabIcon, title: 'Calendar' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}