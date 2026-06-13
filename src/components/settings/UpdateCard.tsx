import { Linking, Platform, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { CURRENT_VERSION, useUpdatesStore } from '@/features/updates/updatesStore';

const isAndroid = Platform.OS === 'android';

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(0)} МБ`;
}

// Карточка обновления: проверка, найденная версия, прогресс загрузки, установка.
export function UpdateCard() {
  const { status, info, progress, error, check, downloadAndInstall } =
    useUpdatesStore();

  const percent = Math.round(progress * 100);

  return (
    <View className="rounded-card bg-surface px-4 py-4">
      {status === 'upToDate' ? (
        <Text className="mb-3 text-sm text-muted">
          У вас последняя версия ({CURRENT_VERSION})
        </Text>
      ) : null}

      {error ? (
        <Text className="mb-3 text-sm text-danger">{error}</Text>
      ) : null}

      {info ? (
        <View className="mb-4">
          <Text className="text-base font-semibold text-title">
            Доступна версия {info.version}
            {info.sizeBytes ? (
              <Text className="font-normal text-muted">
                {'  '}· {formatMb(info.sizeBytes)}
              </Text>
            ) : null}
          </Text>
          {info.notes ? (
            <Text className="mt-2 text-sm leading-5 text-muted">
              {info.notes}
            </Text>
          ) : null}
        </View>
      ) : null}

      {status === 'downloading' ? (
        <View className="mb-2">
          <View className="h-2 overflow-hidden rounded-full bg-elevated">
            <View
              className="h-2 rounded-full bg-primary"
              style={{ width: `${percent}%` }}
            />
          </View>
          <Text className="mt-2 text-center text-xs text-faint">
            Загрузка… {percent}%
          </Text>
        </View>
      ) : status === 'available' ? (
        isAndroid ? (
          <Button
            title="Скачать и установить"
            onPress={() => void downloadAndInstall()}
          />
        ) : (
          <Button
            title="Открыть на GitHub"
            onPress={() => info && void Linking.openURL(info.pageUrl)}
          />
        )
      ) : status === 'readyToInstall' ? (
        <Button title="Установить" onPress={() => void downloadAndInstall()} />
      ) : (
        <Button
          title="Проверить обновления"
          variant="ghost"
          loading={status === 'checking'}
          onPress={() => void check()}
        />
      )}
    </View>
  );
}
