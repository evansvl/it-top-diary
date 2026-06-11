import { useQuery } from '@tanstack/react-query';
import { normalizeSubject } from '@/features/grades/gradesApi';
import { fetchHomeworkList } from './homeworkApi';
import type { HomeworkItem } from './types';

// Страховка от бесконечного цикла (API повторяет страницы вне диапазона).
const MAX_PAGES = 40;
// Страницы тянем пачками параллельно: последовательная загрузка десятков
// страниц занимала десятки секунд — поиск задания «не грузился».
const PAGES_PER_BATCH = 5;

// Все проверенные ДЗ (status 1) одним списком: листаем страницы, пока они
// приносят новые id (см. квирк пагинации в useHomeworkList).
async function fetchAllChecked(groupId: number): Promise<HomeworkItem[]> {
  const seen = new Set<number>();
  const items: HomeworkItem[] = [];
  for (let page = 1; page <= MAX_PAGES; page += PAGES_PER_BATCH) {
    const pages = Array.from(
      { length: Math.min(PAGES_PER_BATCH, MAX_PAGES - page + 1) },
      (_, i) => page + i,
    );
    const batches = await Promise.all(
      pages.map((p) => fetchHomeworkList({ page: p, status: 1, groupId })),
    );
    let freshCount = 0;
    for (const batch of batches) {
      for (const h of batch) {
        if (seen.has(h.id)) continue;
        seen.add(h.id);
        items.push(h);
        freshCount += 1;
      }
    }
    if (freshCount === 0) break;
  }
  return items;
}

// Нужен только при открытии деталей домашней оценки — поэтому enabled.
export function useCheckedHomework(
  groupId: number | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ['homework', 'checked-all', groupId],
    enabled: enabled && groupId != null,
    staleTime: 5 * 60 * 1000,
    queryFn: () => fetchAllChecked(groupId as number),
  });
}

// Дальше даты считаем несвязанными (оценка явно не за это ДЗ).
const MATCH_WINDOW_DAYS = 60;

function daysBetween(aIso: string, bIso: string): number {
  const a = Date.parse(aIso.slice(0, 10));
  const b = Date.parse(bIso.slice(0, 10));
  if (Number.isNaN(a) || Number.isNaN(b)) return Number.POSITIVE_INFINITY;
  return Math.abs(a - b) / 86_400_000;
}

// Журнал не хранит ссылку «оценка → ДЗ», поэтому сопоставляем эвристикой:
// тот же предмет, та же оценка, ближайшее по дате (сдача или дедлайн против
// date_visit). Может не найти или промахнуться при одинаковых оценках рядом.
export function findHomeworkForMark(
  items: HomeworkItem[],
  subject: string,
  markValue: number,
  dateIso: string,
): HomeworkItem | null {
  const subj = normalizeSubject(subject);
  let best: HomeworkItem | null = null;
  let bestDist = Number.POSITIVE_INFINITY;
  for (const it of items) {
    if (it.mark !== markValue) continue;
    if (normalizeSubject(it.subject) !== subj) continue;
    const dist = Math.min(
      daysBetween(it.completeAt, dateIso),
      daysBetween(it.overdueAt, dateIso),
    );
    if (dist <= MATCH_WINDOW_DAYS && dist < bestDist) {
      best = it;
      bestDist = dist;
    }
  }
  return best;
}
