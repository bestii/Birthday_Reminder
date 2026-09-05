import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';
import type { ReactNode } from 'react';

import { useTheme } from './ThemeContext';

export function AppPaperProvider({ children }: { children: ReactNode }) {
  const { mode, colors } = useTheme();

  const base = mode === 'dark' ? MD3DarkTheme : MD3LightTheme;

  const theme = {
    ...base,
    colors: {
      ...base.colors,
      primary: colors.accent,
      background: colors.background,
      surface: colors.surface,
      onSurface: colors.text,
      onSurfaceVariant: colors.textSecondary,
      outline: colors.border,
    },
  };

  return <PaperProvider theme={theme}>{children}</PaperProvider>;
}
