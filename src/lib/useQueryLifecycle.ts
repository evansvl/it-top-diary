import { useEffect } from 'react';
import { AppState } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { focusManager, onlineManager } from '@tanstack/react-query';

// React Query в React Native не получает браузерные online/focus события.
// Связываем его с ОС, чтобы офлайн-запросы не крутили повторы, а устаревшие
// данные автоматически обновлялись после возвращения сети/приложения.
export function useQueryLifecycle(): void {
  useEffect(
    () =>
      NetInfo.addEventListener((state) => {
        onlineManager.setOnline(
          state.isConnected !== false && state.isInternetReachable !== false,
        );
      }),
    [],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      focusManager.setFocused(state === 'active');
    });
    return () => subscription.remove();
  }, []);
}
