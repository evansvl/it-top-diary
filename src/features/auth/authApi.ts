import { apiRequest, ApiError } from '@/api/client';
import { APPLICATION_KEY, endpoints, USE_MOCK_AUTH, USE_USER_INFO } from '@/api/endpoints';
import { decodeJwt } from '@/lib/jwt';
import type { AuthTokens, LoginInput, LoginResult, User, UserRole } from './types';

// ============================================================
//  АДАПТЕР АВТОРИЗАЦИИ Top Academy.
//  login() — РАБОТАЕТ по реальному API.
//  fetchMe() — ждёт подтверждения /settings/user-info (curl).
// ============================================================

// Сырой ответ /auth/login
type RawLogin = {
  access_token: string;
  refresh_token: string;
  expires_in_access: number;
  expires_in_refresh: number;
  user_role: string;
  city_data?: { name?: string };
};

function mapRole(raw: string): UserRole {
  if (raw === 'teacher') return 'teacher';
  if (raw === 'admin') return 'admin';
  return 'student';
}

// --- ЛОГИН (реальный) ---
async function realLogin(input: LoginInput): Promise<LoginResult> {
  const raw = await apiRequest<RawLogin>(endpoints.auth.login, {
    method: 'POST',
    auth: false,
    headers: { Authorization: 'Bearer null' }, // как в веб-журнале
    body: {
      application_key: APPLICATION_KEY,
      id_city: null,
      username: input.login.trim(),
      password: input.password,
    },
  });

  const tokens: AuthTokens = {
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token,
    accessExpiresAt: toAbsoluteExpiry(raw.expires_in_access),
    refreshExpiresAt: toAbsoluteExpiry(raw.expires_in_refresh),
  };

  // userId достаём из payload JWT; имя пока = логин (до user-info)
  const payload = decodeJwt(raw.access_token);
  const user: User = {
    id: payload?.userId ? String(payload.userId) : input.login.trim(),
    fullName: input.login.trim(),
    role: mapRole(raw.user_role),
    cityName: raw.city_data?.name,
  };

  return { user, tokens };
}

// --- ЛОГИН (заглушка) ---
async function mockLogin(input: LoginInput): Promise<LoginResult> {
  await delay(700);
  if (!input.login.trim() || !input.password.trim()) {
    throw new ApiError(400, 'Введите логин и пароль');
  }
  if (input.password === 'fail') {
    throw new ApiError(401, 'Неверный логин или пароль');
  }
  const now = Math.floor(Date.now() / 1000);
  return {
    user: { id: 'u-1', fullName: 'Иванов Иван', role: 'student', group: 'ИС-301' },
    tokens: {
      accessToken: 'mock.access',
      refreshToken: 'mock.refresh',
      accessExpiresAt: now + 21600,
      refreshExpiresAt: now + 21600,
    },
  };
}

export async function login(input: LoginInput): Promise<LoginResult> {
  return USE_MOCK_AUTH ? mockLogin(input) : realLogin(input);
}

// --- ПРОФИЛЬ (user-info) ---
// Поля по реальному ответу GET /settings/user-info.
type RawUserInfo = {
  full_name?: string;
  photo?: string; // полный URL фото (fs.top-academy.ru), доступен без авторизации
  group_name?: string;
  current_group_id?: number;
  stream_name?: string;
  level?: number;
  achieves_count?: number;
  gaming_points?: { points?: number }[];
};

// base: то, что уже знаем после логина (id, role) — на случай частичного ответа.
export async function fetchMe(base: User): Promise<User> {
  if (USE_MOCK_AUTH) {
    await delay(300);
    return { ...base, fullName: 'Иванов Иван', group: 'ИС-301', level: 7 };
  }
  if (!USE_USER_INFO) return base;

  const raw = await apiRequest<RawUserInfo>(endpoints.userInfo);
  const points = raw.gaming_points?.reduce((sum, p) => sum + (p.points ?? 0), 0);
  return {
    ...base,
    fullName: raw.full_name ?? base.fullName,
    avatarUrl: raw.photo ?? base.avatarUrl,
    group: raw.group_name ?? base.group,
    groupId: raw.current_group_id ?? base.groupId,
    stream: raw.stream_name ?? base.stream,
    level: raw.level ?? base.level,
    achievements: raw.achieves_count ?? base.achievements,
    points: points ?? base.points,
  };
}

// --- REFRESH (черновик, ждёт curl) ---
export async function refresh(refreshToken: string): Promise<AuthTokens> {
  const raw = await apiRequest<RawLogin>(endpoints.auth.refresh, {
    method: 'POST',
    auth: false,
    body: { refresh_token: refreshToken },
  });
  return {
    accessToken: raw.access_token,
    refreshToken: raw.refresh_token,
    accessExpiresAt: toAbsoluteExpiry(raw.expires_in_access),
    refreshExpiresAt: toAbsoluteExpiry(raw.expires_in_refresh),
  };
}

// API отдаёт время жизни токена как ДЛИТЕЛЬНОСТЬ в секундах (expires_in_*),
// а стор/гидрация работают с АБСОЛЮТНЫМ unix-таймстампом. Нормализуем:
// если значение меньше «сейчас» — это длительность, прибавляем к now.
// (на случай, если API когда-то начнёт слать уже абсолютный ts — тоже ок.)
function toAbsoluteExpiry(value: number): number {
  const now = Math.floor(Date.now() / 1000);
  return value > now ? value : now + value;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
