import { RefreshControl } from 'react-native';
import { colors } from '@/theme/colors';
import { useTheme } from '@/theme/useColorScheme';

// Тематический pull-to-refresh для всех списков/скроллов приложения.
export function ThemedRefreshControl({
  refreshing,
  onRefresh,
}: {
  refreshing: boolean;
  onRefresh: () => void;
}) {
  const { palette } = useTheme();
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary}
      colors={[colors.primary]}
      progressBackgroundColor={palette.card}
    />
  );
}
