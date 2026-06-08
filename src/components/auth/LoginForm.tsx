import { useEffect, useRef, useState } from 'react';
import { Switch, Text, TextInput, View } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Animated, { FadeIn } from 'react-native-reanimated';
import { TextField } from '@/components/ui/TextField';
import { Button } from '@/components/ui/Button';
import { useLogin } from '@/features/auth/useLogin';
import {
  clearCredentials,
  loadCredentials,
  saveCredentials,
} from '@/lib/secureStore';
import { colors } from '@/theme/colors';

const schema = z.object({
  login: z.string().min(1, 'Введите логин'),
  password: z.string().min(1, 'Введите пароль'),
});

type FormValues = z.infer<typeof schema>;

// Строка-переключатель (запомнить пароль / автовход).
function SwitchRow({
  label,
  value,
  onValueChange,
  disabled,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <View className="mb-3 flex-row items-center justify-between">
      <Text
        className={`text-sm ${disabled ? 'text-slate-600' : 'text-slate-300'}`}
      >
        {label}
      </Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ false: colors.dark.border, true: colors.primary }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

export function LoginForm() {
  const passwordRef = useRef<TextInput>(null);
  const autoTried = useRef(false);
  const { submit, isLoading, errorMessage } = useLogin();

  const [remember, setRemember] = useState(false);
  const [autoLogin, setAutoLogin] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { login: '', password: '' },
  });

  // Подстановка сохранённых данных + автоматический вход при старте.
  useEffect(() => {
    let active = true;
    loadCredentials().then((creds) => {
      if (!active || !creds) return;
      reset({ login: creds.login, password: creds.password });
      setRemember(true);
      setAutoLogin(creds.autoLogin);
      if (creds.autoLogin && !autoTried.current) {
        autoTried.current = true;
        submit({ login: creds.login, password: creds.password });
      }
    });
    return () => {
      active = false;
    };
  }, [reset, submit]);

  const onSubmit = async (values: FormValues) => {
    if (remember) {
      await saveCredentials({
        login: values.login,
        password: values.password,
        autoLogin,
      });
    } else {
      await clearCredentials();
    }
    submit(values);
  };

  const onToggleRemember = (v: boolean) => {
    setRemember(v);
    if (!v) setAutoLogin(false); // без сохранения пароля автовход невозможен
  };

  return (
    <View className="w-full">
      <Controller
        control={control}
        name="login"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            label="Логин"
            placeholder="Введите логин"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            onSubmitEditing={() => passwordRef.current?.focus()}
            error={errors.login?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextField
            ref={passwordRef}
            label="Пароль"
            placeholder="Введите пароль"
            secureTextEntry
            returnKeyType="go"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            onSubmitEditing={handleSubmit(onSubmit)}
            error={errors.password?.message}
          />
        )}
      />

      <SwitchRow
        label="Запомнить пароль"
        value={remember}
        onValueChange={onToggleRemember}
      />
      <SwitchRow
        label="Автоматический вход"
        value={autoLogin}
        onValueChange={setAutoLogin}
        disabled={!remember}
      />

      {errorMessage ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          className="mb-4 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3"
        >
          <Text className="text-sm text-danger">{errorMessage}</Text>
        </Animated.View>
      ) : null}

      <Button title="Войти" loading={isLoading} onPress={handleSubmit(onSubmit)} />
    </View>
  );
}
