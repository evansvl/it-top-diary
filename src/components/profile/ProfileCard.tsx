import { Image, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useAuthStore } from '@/features/auth/authStore';
import type { UserRole } from '@/features/auth/types';

const ROLE_LABEL: Record<UserRole, string> = {
  student: 'Студент',
  teacher: 'Преподаватель',
  admin: 'Администратор',
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  const first = parts[0]?.[0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return (first + second).toUpperCase() || '?';
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <View className="flex-1 items-center">
      <Text className="text-xl font-bold text-title">{value ?? '—'}</Text>
      <Text className="mt-1 text-xs text-muted">{label}</Text>
    </View>
  );
}

// Карточка профиля: аватар/инициалы, имя, поток, роль+группа, город, статистика.
export function ProfileCard() {
  const user = useAuthStore((s) => s.user);
  const name = user?.fullName ?? '—';

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      className="rounded-card bg-surface p-6"
    >
      <View className="items-center">
        {user?.avatarUrl ? (
          <Image
            source={{ uri: user.avatarUrl }}
            className="h-24 w-24 rounded-full"
          />
        ) : (
          <View className="h-24 w-24 items-center justify-center rounded-full bg-primary">
            <Text className="text-3xl font-extrabold text-white">
              {initials(name)}
            </Text>
          </View>
        )}

        <Text className="mt-4 text-center text-2xl font-bold text-title">
          {name}
        </Text>

        {user?.stream ? (
          <Text className="mt-1 text-center text-sm text-muted">
            {user.stream}
          </Text>
        ) : null}

        <View className="mt-3 flex-row flex-wrap justify-center gap-2">
          {user?.role ? (
            <View className="rounded-full bg-elevated px-3 py-1">
              <Text className="text-xs font-medium text-subtle">
                {ROLE_LABEL[user.role]}
              </Text>
            </View>
          ) : null}
          {user?.group ? (
            <View className="rounded-full bg-primary/20 px-3 py-1">
              <Text className="text-xs font-medium text-primary-light">
                {user.group}
              </Text>
            </View>
          ) : null}
        </View>

        {user?.cityName ? (
          <Text className="mt-2 text-sm text-muted">{user.cityName}</Text>
        ) : null}
      </View>

      {user?.level != null || user?.achievements != null || user?.points != null ? (
        <View className="mt-6 flex-row pt-2">
          <Stat label="Уровень" value={user?.level} />
          <Stat label="Достижения" value={user?.achievements} />
          <Stat label="Баллы" value={user?.points} />
        </View>
      ) : null}
    </Animated.View>
  );
}
