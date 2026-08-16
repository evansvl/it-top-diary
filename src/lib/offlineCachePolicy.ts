export const OFFLINE_CACHE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
export const OFFLINE_CACHE_BUSTER = 'offline-cache-v1';

export type CacheableQuery = {
  state: { status: string };
  meta?: Record<string, unknown>;
};

// Сохраняем только законченные успешные ответы. Ошибка обновления не должна
// перезаписать последнюю рабочую копию, а meta.persist=false оставляет способ
// исключить будущий чувствительный/одноразовый запрос.
export function shouldPersistQuery(query: CacheableQuery): boolean {
  return query.state.status === 'success' && query.meta?.persist !== false;
}
