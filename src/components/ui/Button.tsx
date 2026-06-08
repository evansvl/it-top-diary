import { ActivityIndicator, Pressable, Text, type PressableProps } from 'react-native';

type Props = Omit<PressableProps, 'children'> & {
  title: string;
  loading?: boolean;
  variant?: 'primary' | 'ghost';
};

// Основная кнопка приложения. Поддерживает состояние загрузки
// (спиннер только ВНУТРИ кнопки — глобально используем скелетоны).
export function Button({ title, loading, variant = 'primary', disabled, ...rest }: Props) {
  const isDisabled = disabled || loading;
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      disabled={isDisabled}
      className={[
        'h-14 w-full items-center justify-center rounded-2xl',
        // нажатое состояние через NativeWind-вариант active:
        isPrimary
          ? 'bg-primary active:bg-primary-dark'
          : 'bg-transparent active:opacity-60',
        isDisabled ? 'opacity-50' : '',
      ].join(' ')}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#FFFFFF' : '#1E6FD9'} />
      ) : (
        <Text
          className={[
            'text-base font-semibold',
            isPrimary ? 'text-white' : 'text-primary',
          ].join(' ')}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}
