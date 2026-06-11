// ============================================================
//  КОНФИГ API — Top Academy (msapi.top-academy.ru)
// ============================================================

export const API_BASE_URL = 'https://msapi.top-academy.ru/api/v2';

// Публичный ключ веб-журнала — одинаков для всех пользователей,
// не является секретом конкретного аккаунта.
export const APPLICATION_KEY =
  '6a56a5df2667e65aab73ce76d1dd737f7d1faef9c52e8b8c55ac75f565d8e8a6';

export const endpoints = {
  auth: {
    login: '/auth/login',
    // TODO: подтвердить curl'ом — путь и тело refresh
    refresh: '/auth/refresh-token',
  },
  userInfo: '/settings/user-info',
  count: {
    homework: '/count/homework',
  },
  homework: {
    list: '/homework/operations/list',
    // Сдача ДЗ: multipart (id, file?, answerText, spentTimeHour, spentTimeMin)
    create: '/homework/operations/create',
  },
  progress: {
    // Полный журнал занятий: посещаемость + оценки по всем предметам.
    studentVisits: '/progress/operations/student-visits',
  },
  schedule: {
    // Расписание на месяц: ?date_filter=YYYY-MM-DD (любой день месяца).
    getMonth: '/schedule/operations/get-month',
  },
} as const;

// Логин уже работает по реальному API. true = заглушка (для разработки без сети).
export const USE_MOCK_AUTH = false;

// Профиль (user-info) подтверждён curl'ом — тянем ФИО/фото/группу с сервера.
export const USE_USER_INFO = true;
