import { RefreshControl, type RefreshControlProps } from 'react-native';
import { colors } from '@/theme/colors';
import { useTheme } from '@/theme/useColorScheme';

// Тематический pull-to-refresh для всех списков/скроллов приложения.
//
// ВАЖНО: на Android ScrollView/FlatList/SectionList КЛОНИРУЕТ элемент,
// переданный в `refreshControl`, и вкладывает содержимое списка ему в children.
// Поэтому это должен быть НАСТОЯЩИЙ RefreshControl, пробрасывающий children и
// прочие пропсы — иначе контент экрана исчезает (виден пустой экран).
export function ThemedRefreshControl({
  refreshing,
  onRefresh,
  children,
  ...rest
}: RefreshControlProps) {
  const { palette } = useTheme();
  return (
    <RefreshControl
      {...rest}
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor={colors.primary}
      colors={[colors.primary]}
      progressBackgroundColor={palette.card}
    >
      {children}
    </RefreshControl>
  );
}
