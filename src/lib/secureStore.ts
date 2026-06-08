import * as SecureStore from 'expo-secure-store';
import type { AuthTokens, User } from '@/features/auth/types';

// Безопасное хранилище (Keychain на iOS / Keystore на Android).
// Храним токены и лёгкий кэш пользователя, чтобы холодный старт
// показывал имя/роль ещё до запроса профиля.

const TOKENS_KEY = 'auth.tokens';
const USER_KEY = 'auth.user';
const CREDS_KEY = 'auth.credentials';

// --- Токены ---
export async function saveTokens(tokens: AuthTokens): Promise<void> {
  await SecureStore.setItemAsync(TOKENS_KEY, JSON.stringify(tokens));
}

export async function loadTokens(): Promise<AuthTokens | null> {
  const raw = await SecureStore.getItemAsync(TOKENS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthTokens;
  } catch {
    return null;
  }
}

// --- Кэш пользователя ---
export async function saveUser(user: User): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function loadUser(): Promise<User | null> {
  const raw = await SecureStore.getItemAsync(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
}

// --- Очистка (логаут) ---
export async function clearAuthStorage(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKENS_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

// --- Сохранённые учётные данные («запомнить пароль» / автовход) ---
// Хранятся в Keychain/Keystore (зашифровано). autoLogin — авто-submit при старте.
export type SavedCredentials = {
  login: string;
  password: string;
  autoLogin: boolean;
};

export async function saveCredentials(creds: SavedCredentials): Promise<void> {
  await SecureStore.setItemAsync(CREDS_KEY, JSON.stringify(creds));
}

export async function loadCredentials(): Promise<SavedCredentials | null> {
  const raw = await SecureStore.getItemAsync(CREDS_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SavedCredentials;
  } catch {
    return null;
  }
}

export async function clearCredentials(): Promise<void> {
  await SecureStore.deleteItemAsync(CREDS_KEY);
}

// При логауте гасим автовход, но логин/пароль оставляем для подстановки.
export async function disableAutoLogin(): Promise<void> {
  const creds = await loadCredentials();
  if (creds) await saveCredentials({ ...creds, autoLogin: false });
}
