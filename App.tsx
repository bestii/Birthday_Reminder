import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { getRepository, type Repository } from './src/db';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppPaperProvider } from './src/theme/PaperProvider';
import { ThemeProvider } from './src/theme/ThemeContext';

export default function App() {
  const [repo, setRepo] = useState<Repository | null>(null);

  useEffect(() => {
    setRepo(getRepository());
  }, []);

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppPaperProvider>
          {repo ? <RootNavigator repository={repo} /> : null}
          <StatusBar style="auto" />
        </AppPaperProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}