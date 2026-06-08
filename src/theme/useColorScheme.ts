import { useColorScheme as useNativewindColorScheme } from 'nativewind';
import { colors, type ThemeMode } from './colors';

// Хук темы: даёт текущий режим, активную палитру и переключатели.
// Тёмная тема — по умолчанию (см. app/_layout.tsx).
export function useTheme() {
  const { colorScheme, setColorScheme, toggleColorScheme } =
    useNativewindColorScheme();

  const mode: ThemeMode = colorScheme === 'light' ? 'light' : 'dark';
  const palette = mode === 'light' ? colors.light : colors.dark;

  return {
    mode,
    palette,
    isDark: mode === 'dark',
    setMode: (m: ThemeMode) => setColorScheme(m),
    toggle: toggleColorScheme,
  };
}
