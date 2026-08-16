// Некоторые списочные эндпоинты Top Academy возвращают null, когда данных нет,
// хотя при наличии данных ответом служит массив. Нормализуем именно пустой ответ,
// а неожиданный объект не маскируем под отсутствие данных.
export function listOrEmpty<T>(payload: unknown): T[] {
  if (payload === null) return [];
  if (Array.isArray(payload)) return payload as T[];
  const actualType = Object.prototype.toString.call(payload).slice(8, -1);
  throw new Error(
    `Некорректный ответ сервера: ожидался массив или null, получено ${actualType}`,
  );
}
