# Электронный дневник — мобильное приложение (Expo)

Готов **auth-флоу**: экран входа, безопасное хранение токенов, гидрация
сессии при запуске. Авторизация работает на заглушке (mock), поэтому
приложение запускается и логинится **без бэкенда** — UI можно смотреть сразу.

---

## 1. Что поставить (один раз, глобально)

```bash
# Node.js LTS (>= 20) — с nodejs.org, если ещё нет
node -v

# EAS CLI — для сборки APK
npm install -g eas-cli

# Android Studio — нужен только для эмулятора / локальной сборки
# (для облачной сборки APK через EAS он НЕ обязателен)
```

## 2. Создать проект и вложить мой код

Я отдаю исходники (`app/`, `src/`, конфиги), а служебную обвязку
генерирует Expo. Порядок:

```bash
# 1. Создаём чистый проект с роутером и TypeScript
npx create-expo-app@latest college-diary
cd college-diary

# 2. Удаляем дефолтный пример экранов
rm -rf app

# 3. Копируем СЮДА всё из моего архива:
#    app/  src/  global.css  babel.config.js  metro.config.js
#    tailwind.config.js  nativewind-env.d.ts  tsconfig.json
#    app.json  eas.json
#    (package.json — это справочник зависимостей, см. ниже)
```

## 3. Установить зависимости

```bash
# базовый набор Expo
npx expo install expo-router expo-secure-store expo-status-bar \
  expo-constants expo-linking react-native-safe-area-context \
  react-native-screens react-native-reanimated react-native-gesture-handler

# UI / состояние / запросы / формы
npm install nativewind@^4 zustand @tanstack/react-query \
  react-hook-form zod @hookform/resolvers
npm install -D tailwindcss@^3.4
```

## 4. Запуск в разработке

```bash
npx expo start
# нажми "a" — Android, "i" — iOS (нужен Expo Dev Client для reanimated)
```

> Reanimated и gesture-handler требуют **dev build**, а не Expo Go.
> Самый простой путь — сразу собрать dev-APK (см. ниже, профиль `development`).

## 5. Сборка APK

```bash
eas login                       # вход в аккаунт Expo (бесплатный)
eas build:configure            # один раз

# APK для теста/раздачи (профиль уже настроен в eas.json):
eas build -p android --profile preview
```

По окончании EAS даст ссылку на `.apk` — качаешь на телефон и ставишь.
Конфиг `eas.json` уже выставляет `buildType: "apk"` (иначе EAS по
умолчанию собирает `.aab` для Google Play).

Локальная сборка без облака (нужен Android SDK):
```bash
eas build -p android --profile preview --local
```

---

## Где подключается реальный API

Когда пришлёшь эндпоинты, меняется **один файл**:
`src/features/auth/authApi.ts` — и флаг `USE_MOCK_AUTH` в
`src/api/endpoints.ts` переключается в `false`. UI и стор не трогаем.

Что мне нужно — см. `API_REQUEST.md`.

## Демо-вход (на моках)
Любой непустой логин/пароль проходит. Пароль `fail` — покажет ошибку.
