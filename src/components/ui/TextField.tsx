import { forwardRef } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import { useTheme } from '@/theme/useColorScheme';

type Props = TextInputProps & {
  label: string;
  error?: string;
};

// Переиспользуемое поле ввода: лейбл, ошибка, тематические цвета.
// forwardRef — чтобы react-hook-form мог управлять фокусом.
export const TextField = forwardRef<TextInput, Props>(
  ({ label, error, ...rest }, ref) => {
    const { palette } = useTheme();
    const hasError = Boolean(error);

    return (
      <View className="mb-4 w-full">
        <Text className="mb-2 text-sm font-medium text-subtle">{label}</Text>
        <TextInput
          ref={ref}
          placeholderTextColor={palette.textMuted}
          className={[
            'h-14 rounded-2xl border px-4 text-base',
            'bg-surface text-body',
            hasError ? 'border-danger' : 'border-hairline',
          ].join(' ')}
          {...rest}
        />
        {hasError ? (
          <Text className="mt-1.5 text-sm text-danger">{error}</Text>
        ) : null}
      </View>
    );
  },
);

TextField.displayName = 'TextField';
