import { Pressable, Switch, Text, View } from 'react-native';
import { colors } from '@/theme/colors';

// Строка настроек: значение справа, действие (с шевроном) или переключатель.
type Props = {
  label: string;
  value?: string;
  hint?: string;
  onPress?: () => void;
  danger?: boolean;
  border?: boolean;
  /** Передан onSwitch — строка становится переключателем */
  switchValue?: boolean;
  onSwitch?: (value: boolean) => void;
  switchDisabled?: boolean;
};

export function SettingsRow({
  label,
  value,
  hint,
  onPress,
  danger,
  border,
  switchValue,
  onSwitch,
  switchDisabled,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      className={`flex-row items-center justify-between px-4 py-3.5 active:opacity-70 ${
        border ? 'border-b border-hairline' : ''
      }`}
    >
      <View className="mr-3 flex-1">
        <Text className={`text-sm ${danger ? 'text-danger' : 'text-body'}`}>
          {label}
        </Text>
        {hint ? (
          <Text className="mt-0.5 text-xs text-faint">{hint}</Text>
        ) : null}
      </View>
      {onSwitch ? (
        <Switch
          value={switchValue}
          onValueChange={onSwitch}
          disabled={switchDisabled}
          trackColor={{ false: colors.dark.border, true: colors.primary }}
          thumbColor="#FFFFFF"
        />
      ) : value ? (
        <Text className="text-sm text-muted">{value}</Text>
      ) : onPress ? (
        <Text className="text-lg text-faint">›</Text>
      ) : null}
    </Pressable>
  );
}
