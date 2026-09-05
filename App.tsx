import { StatusBar } from 'expo-status-bar';

import { RootNavigator } from './src/navigation/RootNavigator';
import { AppPaperProvider } from './src/theme/PaperProvider';
import { ThemeProvider } from './src/theme/ThemeContext';

export default function App() {
  return (
    <ThemeProvider>
      <AppPaperProvider>
        <RootNavigator />
        <StatusBar style="auto" />
      </AppPaperProvider>
    </ThemeProvider>
  );
}
