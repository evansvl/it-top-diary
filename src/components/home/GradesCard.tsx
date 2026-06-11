import { ActivityIndicator, Text, View } from 'react-native';
import { useGrades } from '@/features/grades/useGrades';

// Сводка по оценкам: средний балл + посещаемость. Открывает экран /grades.
export function GradesCard() {
  const { data, isLoading, isError } = useGrades();
  const avg = data?.overallAverage;
  const att = data?.attendanceRate;

  return (
    <View className="mt-4 rounded-card bg-surface p-5">
      <View className="flex-row items-center justify-between">
        <Text className="text-base font-semibold text-title">Оценки</Text>
        <Text className="ml-2 text-lg text-faint">›</Text>
      </View>

      {isLoading ? (
        <ActivityIndicator className="my-5" color="#1E6FD9" />
      ) : isError || !data ? (
        <Text className="mt-3 text-sm text-danger">Не удалось загрузить</Text>
      ) : (
        <View className="mt-4 flex-row">
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-primary-light">
              {avg != null ? avg.toFixed(2) : '—'}
            </Text>
            <Text className="mt-1 text-xs text-muted">Средний балл</Text>
          </View>
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-success">
              {att != null ? `${Math.round(att * 100)}%` : '—'}
            </Text>
            <Text className="mt-1 text-xs text-muted">Посещаемость</Text>
          </View>
        </View>
      )}
    </View>
  );
}
