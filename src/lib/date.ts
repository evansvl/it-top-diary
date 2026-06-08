// Утилиты дат. Формат API — ISO «YYYY-MM-DD».

const MONTHS_NOM = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];
const MONTHS_GEN = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
];
const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

// Дата из API (YYYY-MM-DD) → человекочитаемая (DD.MM.YYYY).
export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}.${m}.${y}` : iso;
}

export function todayIso(): string {
  return toIso(new Date());
}

// Первый день месяца, к которому относится дата (или сегодня).
export function monthAnchorIso(d: Date = new Date()): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`;
}

// Сдвиг месяца на delta (±1) от якорной даты.
export function shiftMonth(anchorIso: string, delta: number): string {
  const [y, m] = anchorIso.split('-').map(Number);
  return monthAnchorIso(new Date((y ?? 1970), (m ?? 1) - 1 + delta, 1));
}

// «Июнь 2026».
export function monthTitle(anchorIso: string): string {
  const [y, m] = anchorIso.split('-').map(Number);
  return `${MONTHS_NOM[(m ?? 1) - 1] ?? ''} ${y ?? ''}`;
}

// «Пн, 8 июня».
export function dayTitle(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date((y ?? 1970), (m ?? 1) - 1, d ?? 1);
  return `${WEEKDAYS[date.getDay()] ?? ''}, ${d ?? ''} ${MONTHS_GEN[(m ?? 1) - 1] ?? ''}`;
}

export function isTodayIso(iso: string): boolean {
  return iso === todayIso();
}

// Сдвиг даты на delta дней.
export function shiftDay(iso: string, delta: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return toIso(new Date((y ?? 1970), (m ?? 1) - 1, (d ?? 1) + delta));
}

// Первый день месяца, к которому относится ISO-дата.
export function monthAnchorFromIso(iso: string): string {
  const [y, m] = iso.split('-');
  return `${y}-${m}-01`;
}
