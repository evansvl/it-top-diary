import { create } from 'zustand';
import {
  clearAuthStorage,
  disableAutoLogin,
  loadTokens,
  loadUser,
  saveTokens,
  saveUser,
} from '@/lib/secureStore';
import { setAccessTokenProvider } from '@/api/client';
import { fetchMe } from './authApi';
import type { AuthTokens, User } from './types';

type AuthStatus = 'idle' | 'hydrating' | 'authenticated' | 'unauthenticated';

type AuthState = {
  status: AuthStatus;
  user: User | null;
  tokens: AuthTokens | null;

  hydrate: () => Promise<void>;
  setSession: (user: User, tokens: AuthTokens) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'idle',
  user: null,
  tokens: null,

  // Холодный старт: токены + кэш юзера из SecureStore, затем (опц.) профиль.
  hydrate: async () => {
    set({ status: 'hydrating' });
    const tokens = await loadTokens();
    const cachedUser = await loadUser();

    if (!tokens || !cachedUser) {
      set({ status: 'unauthenticated' });
      return;
    }

    // refresh-токен протух — заставляем войти заново
    if (tokens.refreshExpiresAt * 1000 < Date.now()) {
      await clearAuthStorage();
      set({ status: 'unauthenticated', user: null, tokens: null });
      return;
    }

    set({ tokens, user: cachedUser, status: 'authenticated' });

    // Тихо обновляем профиль (если эндпоинт подтверждён). Ошибку игнорируем.
    try {
      const fresh = await fetchMe(cachedUser);
      await saveUser(fresh);
      set({ user: fresh });
    } catch {
      /* остаёмся на кэше */
    }
  },

  setSession: async (user, tokens) => {
    await saveTokens(tokens);
    await saveUser(user);
    set({ user, tokens, status: 'authenticated' });

    // Дотягиваем полное имя/группу после входа
    try {
      const fresh = await fetchMe(user);
      await saveUser(fresh);
      set({ user: fresh });
    } catch {
      /* оставляем то, что есть */
    }
  },

  logout: async () => {
    await clearAuthStorage();
    // гасим автовход, чтобы не залогиниться сразу обратно (логин/пароль остаются)
    await disableAutoLogin();
    set({ status: 'unauthenticated', user: null, tokens: null });
  },
}));

// HTTP-клиент берёт актуальный access-токен отсюда.
setAccessTokenProvider(() => useAuthStore.getState().tokens?.accessToken ?? null);
