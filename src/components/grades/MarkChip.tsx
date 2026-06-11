import { Pressable, Text } from 'react-native';
import { markBg, markColor, markLabel } from '@/features/grades/types';

// Плашка оценки (общая для экранов оценок и расписания).
// С onPress — кликабельна (детали оценки), без — обычный бейдж.
export function MarkChip({
  value,
  onPress,
}: {
  value: number;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`mb-2 mr-2 h-8 min-w-[32px] items-center justify-center rounded-lg px-2 active:opacity-70 ${markBg(
        value,
      )}`}
    >
      <Text className={`text-sm font-bold ${markColor(value)}`}>
        {markLabel(value)}
      </Text>
    </Pressable>
  );
}
