// Цвета в виде JS-констант — для мест, где нельзя использовать className
// (например, StatusBar, нативные пропсы, тени, плейсхолдеры инпутов).
export const colors = {
  primary: '#1E6FD9',
  primaryLight: '#4D8FE6',
  primaryDark: '#1557AB',

  // Тёмная тема (по умолчанию)
  dark: {
    bg: '#0B1220',
    card: '#111A2B',
    raised: '#1B273D',
    border: '#27344D',
    text: '#E6ECF5',
    textMuted: '#8A97AD',
  },

  // Светлая тема
  light: {
    bg: '#F4F7FB',
    card: '#FFFFFF',
    raised: '#FFFFFF',
    border: '#E2E8F0',
    text: '#0B1220',
    textMuted: '#64748B',
  },

  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
} as const;

export type ThemeMode = 'light' | 'dark';
