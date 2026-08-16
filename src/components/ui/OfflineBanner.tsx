import { useSyncExternalStore } from 'react';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { onlineManager } from '@tanstack/react-query';

export function OfflineBanner() {
  const online = useSyncExternalStore(
    (onChange) => onlineManager.subscribe(onChange),
    () => onlineManager.isOnline(),
    () => true,
  );

  if (online) return null;

  return (
    <SafeAreaView
      pointerEvents="none"
      edges={['top']}
      className="absolute left-0 right-0 top-0 z-50"
    >
      <View className="mx-4 mt-1 rounded-full bg-warning px-4 py-2 shadow-lg">
        <Text className="text-center text-xs font-semibold text-black">
          Офлайн — показаны сохранённые данные
        </Text>
      </View>
    </SafeAreaView>
  );
}
