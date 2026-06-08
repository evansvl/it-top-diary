import { API_BASE_URL } from './endpoints';

// ============================================================
//  HTTP-клиент на fetch. Подставляет Bearer-токен, язык ru,
//  единообразно парсит ошибки. Логику авто-refresh при 401
//  добавим, когда подтвердим refresh-эндпоинт.
// ============================================================

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

// Провайдер access-токена (берётся из стора, без циклических импортов).
let accessTokenProvider: () => string | null = () => null;
export function setAccessTokenProvider(fn: () => string | null): void {
  accessTokenProvider = fn;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  // Доп. заголовки (например, Authorization: Bearer null для логина)
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, auth = true, headers: extra, signal }: RequestOptions = {},
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json, text/plain, */*',
    'Accept-Language': 'ru_RU, ru',
    // WAF Top Academy отклоняет запросы без Origin/Referer веб-журнала (403).
    Origin: 'https://journal.top-academy.ru',
    Referer: 'https://journal.top-academy.ru/',
    ...extra,
  };

  if (auth) {
    const token = accessTokenProvider();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new ApiError(0, 'Нет соединения с сервером');
  }

  const text = await response.text();
  const data = text ? safeJsonParse(text) : null;

  if (!response.ok) {
    const message = extractErrorMessage(data) ?? `Ошибка запроса (${response.status})`;
    throw new ApiError(response.status, message, data);
  }

  return data as T;
}

// Top Academy кладёт ошибки по-разному: message / error / массив [{field, message}].
function extractErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== 'object') return null;
  // Валидация логина приходит массивом: [{ field, message }]
  if (Array.isArray(data)) {
    const withMessage = data.find(
      (e): e is { message: string } =>
        Boolean(e) && typeof (e as { message?: unknown }).message === 'string',
    );
    return withMessage ? withMessage.message : null;
  }
  const obj = data as Record<string, unknown>;
  if (typeof obj.message === 'string') return obj.message;
  if (typeof obj.error === 'string') return obj.error;
  return null;
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
