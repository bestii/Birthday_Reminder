import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { Text } from 'react-native';

import { CalendarScreen } from '../screens/CalendarScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { useTheme } from '../theme/ThemeContext';
import type { RootTabParamList } from './types';

const Tab = createBottomTabNavigator<RootTabParamList>();

function HomeTabIcon({ color }: { color: string }) {
  return <Text style={{ color }}>☰</Text>;
}

function CalendarTabIcon({ color }: { color: string }) {
  return <Text style={{ color }}>📅</Text>;
}

export function RootNavigator() {
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
          component={HomeScreen}
          options={{ tabBarIcon: HomeTabIcon, title: 'Home' }}
        />
        <Tab.Screen
          name="Calendar"
          component={CalendarScreen}
          options={{ tabBarIcon: CalendarTabIcon, title: 'Calendar' }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
