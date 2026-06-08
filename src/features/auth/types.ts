// Доменные типы авторизации. Строгая типизация — никаких any.

export type UserRole = 'student' | 'teacher' | 'admin';

export type User = {
  id: string;
  fullName: string;
  role: UserRole;
  // Из /settings/user-info
  avatarUrl?: string;
  group?: string;
  groupId?: number; // current_group_id — нужен для запросов ДЗ/оценок
  cityName?: string;
  stream?: string; // поток/курс, напр. «Колледж Осень 2024»
  level?: number; // уровень обучения
  achievements?: number; // число достижений
  points?: number; // сумма игровых баллов
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  // Абсолютные unix-таймстампы (секунды) из ответа API
  accessExpiresAt: number;
  refreshExpiresAt: number;
};

// Что вводит пользователь в форме (login = username в API)
export type LoginInput = {
  login: string;
  password: string;
};

// Нормализованный результат логина
export type LoginResult = {
  user: User;
  tokens: AuthTokens;
};
