/** @type {import('tailwindcss').Config} */
// Дизайн-токены приложения: синий primary #1E6FD9, тёмная тема по умолчанию.
// darkMode: 'class' — переключаем тему вручную через колорским.
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Брендовый синий и его оттенки
        primary: {
          DEFAULT: '#1E6FD9',
          light: '#4D8FE6',
          dark: '#1557AB',
        },
        // Фоны / поверхности для тёмной темы
        ink: {
          900: '#0B1220', // основной фон
          800: '#111A2B', // карточки
          700: '#1B273D', // поднятые элементы
          600: '#27344D', // бордеры
        },
        // Семантические токены темы (см. global.css). Переключаются между
        // светлой и тёмной палитрой — используем их вместо ink/slate.
        canvas: 'rgb(var(--canvas) / <alpha-value>)', // основной фон
        surface: 'rgb(var(--surface) / <alpha-value>)', // карточки
        elevated: 'rgb(var(--elevated) / <alpha-value>)', // поднятые элементы
        hairline: 'rgb(var(--hairline) / <alpha-value>)', // бордеры
        title: 'rgb(var(--title) / <alpha-value>)', // заголовки
        body: 'rgb(var(--body) / <alpha-value>)', // основной текст
        subtle: 'rgb(var(--subtle) / <alpha-value>)', // второстепенный текст
        muted: 'rgb(var(--muted) / <alpha-value>)', // приглушённый текст
        faint: 'rgb(var(--faint) / <alpha-value>)', // самый бледный текст
        // Семантические цвета оценок/статусов
        success: '#22C55E',
        warning: '#F59E0B',
        danger: '#EF4444',
      },
      borderRadius: {
        card: '20px',
      },
    },
  },
  plugins: [],
};
