import { useMutation } from '@tanstack/react-query';
import { login } from './authApi';
import { useAuthStore } from './authStore';
import type { ApiError } from '@/api/client';
import type { LoginInput, LoginResult } from './types';

// Хук логина: оборачивает мутацию, после успеха кладёт сессию в стор.
// Возвращает удобный интерфейс для формы (loading/error/submit).
export function useLogin() {
  const setSession = useAuthStore((s) => s.setSession);

  const mutation = useMutation<LoginResult, ApiError, LoginInput>({
    mutationFn: login,
    onSuccess: async ({ user, tokens }) => {
      await setSession(user, tokens);
    },
  });

  return {
    submit: mutation.mutate,
    isLoading: mutation.isPending,
    // Текст ошибки для показа в форме
    errorMessage: mutation.error?.message ?? null,
    reset: mutation.reset,
  };
}
