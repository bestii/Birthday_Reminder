import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { RootNavigator } from './src/navigation/RootNavigator';
import { ensureNotificationChannel } from './src/notifications/channel';
import { ThemeProvider } from './src/theme/ThemeContext';

export default function App() {
  useEffect(() => {
    ensureNotificationChannel();
  }, []);

  return (
    <ThemeProvider>
      <RootNavigator />
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
