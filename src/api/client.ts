import { API_BASE_URL } from './endpoints';

// ============================================================
//  HTTP-клиент на fetch. Подставляет Bearer-токен, язык ru,
//  единообразно парсит ошибки. При 401 один раз пытается тихо
//  обновить сессию (повторный вход по сохранённым данным —
//  отдельный refresh-эндпоинт не подтверждён) и повторяет запрос.
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

// Обновление сессии при 401 (реализовано в authStore, регистрируется там же).
// Возвращает true, если удалось получить свежий токен.
let sessionRefresher: (() => Promise<boolean>) | null = null;
export function setSessionRefresher(fn: () => Promise<boolean>): void {
  sessionRefresher = fn;
}

// Один общий промис обновления — параллельные 401 не плодят повторных входов.
let refreshInFlight: Promise<boolean> | null = null;
function refreshSession(): Promise<boolean> {
  if (!sessionRefresher) return Promise.resolve(false);
  if (!refreshInFlight) {
    refreshInFlight = sessionRefresher().finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  // Доп. заголовки (например, Authorization: Bearer null для логина)
  headers?: Record<string, string>;
  signal?: AbortSignal;
  // Внутреннее: запрос уже повторён после обновления сессии (не зацикливаемся).
  retry?: boolean;
};

export async function apiRequest<T>(
  path: string,
  { method = 'GET', body, auth = true, headers: extra, signal, retry = false }: RequestOptions = {},
): Promise<T> {
  // FormData (загрузка файлов) — Content-Type не ставим: fetch сам
  // подставит multipart/form-data с boundary.
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;

  const headers: Record<string, string> = {
    ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
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
      body:
        body === undefined
          ? undefined
          : isFormData
            ? (body as FormData)
            : JSON.stringify(body),
      signal,
    });
  } catch {
    throw new ApiError(0, 'Нет соединения с сервером');
  }

  // Access-токен протух → один раз тихо обновляем сессию и повторяем запрос.
  if (response.status === 401 && auth && !retry) {
    const refreshed = await refreshSession();
    if (refreshed) {
      return apiRequest<T>(path, {
        method,
        body,
        auth,
        headers: extra,
        signal,
        retry: true,
      });
    }
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
