import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { usePayments } from '@/features/payments/usePayments';
import { formatRub, type PaymentsData } from '@/features/payments/types';
import { formatDate } from '@/lib/date';

function SectionTitle({ title }: { title: string }) {
  return (
    <Text className="mb-2 mt-6 px-1 text-xs uppercase text-faint">
      {title}
    </Text>
  );
}

function PaymentsContent({ data }: { data: PaymentsData }) {
  return (
    <ScrollView
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {data.next && data.next.amount != null ? (
        <View className="rounded-card bg-surface p-5">
          <Text className="text-xs uppercase text-faint">
            Следующий платёж
          </Text>
          <Text className="mt-2 text-3xl font-extrabold text-primary-light">
            {formatRub(data.next.amount)}
          </Text>
          {data.next.date ? (
            <Text className="mt-1 text-sm text-muted">
              до {formatDate(data.next.date)}
              {data.next.purpose ? ` · ${data.next.purpose}` : ''}
            </Text>
          ) : null}
          {data.next.debt != null && data.next.debt > 0 ? (
            <Text className="mt-2 text-sm font-semibold text-danger">
              Задолженность: {formatRub(data.next.debt)}
            </Text>
          ) : null}
        </View>
      ) : (
        <View className="rounded-card bg-surface p-5">
          <Text className="text-sm text-muted">
            Данных о следующем платеже нет
          </Text>
        </View>
      )}

      {data.schedule.length > 0 ? (
        <>
          <SectionTitle title="График платежей" />
          <View className="overflow-hidden rounded-card bg-surface">
            {data.schedule.map((p, i) => (
              <View
                key={p.id}
                className={`flex-row items-center justify-between px-4 py-3.5 ${
                  i < data.schedule.length - 1 ? 'border-b border-hairline' : ''
                }`}
              >
                <View className="mr-3 flex-1">
                  <Text className="text-sm text-body">{p.description}</Text>
                  <Text className="mt-0.5 text-xs text-faint">
                    до {formatDate(p.date)}
                  </Text>
                </View>
                <Text className="text-sm font-semibold text-title">
                  {formatRub(p.price)}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}

      {data.history.length > 0 ? (
        <>
          <SectionTitle title="История оплат" />
          <View className="overflow-hidden rounded-card bg-surface">
            {data.history.map((p, i) => (
              <View
                key={`${p.date}-${i}`}
                className={`flex-row items-center justify-between px-4 py-3.5 ${
                  i < data.history.length - 1 ? 'border-b border-hairline' : ''
                }`}
              >
                <View className="mr-3 flex-1">
                  <Text className="text-sm text-body">
                    {formatDate(p.date)}
                  </Text>
                  {p.description ? (
                    <Text
                      className="mt-0.5 text-xs text-faint"
                      numberOfLines={2}
                    >
                      {p.description}
                    </Text>
                  ) : null}
                </View>
                <Text className="text-sm font-semibold text-success">
                  {formatRub(p.amount)}
                </Text>
              </View>
            ))}
          </View>
        </>
      ) : null}
    </ScrollView>
  );
}

export default function PaymentsScreen() {
  const { data, isLoading, isError, refetch } = usePayments();

  return (
    <SafeAreaView className="flex-1 bg-canvas" edges={['top']}>
      <ScreenHeader title="Оплата обучения" />

      {isLoading ? (
        <ActivityIndicator className="mt-8" color="#1E6FD9" />
      ) : isError || !data ? (
        <View className="mt-8 items-center px-4">
          <Text className="text-sm text-danger">Не удалось загрузить</Text>
          <Pressable
            onPress={() => refetch()}
            className="mt-3 rounded-full bg-surface px-4 py-2 active:opacity-70"
          >
            <Text className="text-sm text-body">Повторить</Text>
          </Pressable>
        </View>
      ) : (
        <PaymentsContent data={data} />
      )}
    </SafeAreaView>
  );
}
