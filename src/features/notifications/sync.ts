import { useAuthStore } from '@/features/auth/authStore';
import { useSettingsStore } from '@/features/settings/settingsStore';
import { loadTokens, loadUser } from '@/lib/secureStore';
import { formatDate } from '@/lib/date';
import { fetchGrades } from '@/features/grades/gradesApi';
import { fetchHomeworkList } from '@/features/homework/homeworkApi';
import type { HomeworkItem } from '@/features/homework/types';
import { fetchLatestNews } from '@/features/news/newsApi';
import { fetchReviews } from '@/features/reviews/reviewsApi';
import { fetchExams } from '@/features/exams/examsApi';
import { fetchPayments } from '@/features/payments/paymentsApi';
import type { PaymentsData } from '@/features/payments/types';
import { cancelAllScheduled, hasPermission, notifyAt, notifyNow } from './notify';
import { loadSnapshot, saveSnapshot, type NotifSnapshot } from './snapshot';

// ============================================================
//  Синхронизация уведомлений: тянем данные, сравниваем со снимком
//  «что уже видели», шлём только новое; дедлайны/оплату планируем
//  заранее. Запускается при открытии приложения и фоновой задачей.
// ============================================================

const DAY = 24 * 60 * 60 * 1000;
const HOUR = 60 * 60 * 1000;

let syncing = false;

// Дата из API («YYYY-MM-DD» или «YYYY-MM-DD HH:mm:ss») в локальный Date.
function parseApiDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const norm = s.length <= 10 ? `${s}T23:59:59` : s.replace(' ', 'T');
  const d = new Date(norm);
  return Number.isNaN(d.getTime()) ? null : d;
}

function truncate(text: string, max = 80): string {
  const t = text.replace(/\s+/g, ' ').trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

// Гарантируем, что в сторе есть токены/группа (важно для фоновой задачи,
// где zustand ещё не гидрирован). null — пользователь не залогинен.
async function ensureSession(): Promise<{ groupId: number | undefined } | null> {
  if (!useAuthStore.getState().tokens) {
    const tokens = await loadTokens();
    if (!tokens) return null;
    useAuthStore.setState({ tokens });
  }
  let groupId = useAuthStore.getState().user?.groupId;
  if (groupId == null) {
    const u = await loadUser();
    if (u) {
      groupId = u.groupId;
      if (!useAuthStore.getState().user) useAuthStore.setState({ user: u });
    }
  }
  return { groupId };
}

// Перепланируем отложенные уведомления (дедлайны ДЗ).
async function scheduleDeadlines(items: HomeworkItem[]): Promise<void> {
  const now = Date.now();
  const upcoming = items
    .map((h) => ({ h, due: parseApiDate(h.overdueAt) }))
    .filter((x): x is { h: HomeworkItem; due: Date } => x.due != null && x.due.getTime() > now)
    .sort((a, b) => a.due.getTime() - b.due.getTime())
    .slice(0, 10);

  for (const { h, due } of upcoming) {
    let when = due.getTime() - DAY; // за сутки
    if (when <= now) when = due.getTime() - 2 * HOUR; // иначе за пару часов
    if (when <= now) continue; // слишком близко — пропускаем
    await notifyAt(
      new Date(when),
      '⏰ Скоро дедлайн',
      `${h.subject}: ${truncate(h.theme, 60)} — сдать до ${formatDate(h.overdueAt.slice(0, 10))}`,
      { kind: 'deadline', id: h.id },
    );
  }
}

// Напоминания об оплате.
async function schedulePayments(data: PaymentsData): Promise<void> {
  const now = Date.now();
  const dates: { date: Date; label: string }[] = [];
  const next = parseApiDate(data.next?.date);
  if (next) dates.push({ date: next, label: data.next?.purpose ?? 'Оплата обучения' });
  for (const s of data.schedule) {
    const d = parseApiDate(s.date);
    if (d) dates.push({ date: d, label: s.description || 'Оплата обучения' });
  }

  const seen = new Set<string>();
  for (const { date, label } of dates) {
    if (date.getTime() <= now) continue;
    const dayKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    if (seen.has(dayKey)) continue;
    seen.add(dayKey);
    if (seen.size > 6) break;
    let when = date.getTime() - 3 * DAY; // за 3 дня
    if (when <= now) when = now + 60 * 1000; // совсем близко — почти сразу
    await notifyAt(new Date(when), '💳 Напоминание об оплате', `${truncate(label, 60)} — до ${formatDate(date.toISOString().slice(0, 10))}`, {
      kind: 'payment',
    });
  }
}

// Основная синхронизация. Возвращает, удалось ли что-то сделать (для фона).
export async function runNotificationsSync(): Promise<boolean> {
  if (syncing) return false;
  const prefs = useSettingsStore.getState().notifications;
  if (!prefs.enabled) return false;
  if (!(await hasPermission())) return false;

  const session = await ensureSession();
  if (!session) return false;
  const { groupId } = session;

  syncing = true;
  try {
    // Чистим прежние отложенные (дедлайны/оплату) — ниже планируем заново.
    // Под локом syncing, чтобы параллельный вызов не стёр их без переплана.
    try {
      await cancelAllScheduled();
    } catch {
      /* ignore */
    }

    const snap = await loadSnapshot();
    const next: NotifSnapshot = { ...snap };
    const first = !snap.initialized; // первый прогон — только базовый снимок

    // --- Оценки ---
    if (prefs.grades) {
      try {
        const data = await fetchGrades();
        const counts: Record<string, number> = {};
        const nameById = new Map<string, string>();
        for (const s of data.subjects) {
          counts[String(s.subjectId)] = s.marks.length;
          nameById.set(String(s.subjectId), s.subject);
        }
        if (!first) {
          let added = 0;
          const subjects: string[] = [];
          for (const [id, c] of Object.entries(counts)) {
            const prev = snap.gradeCountBySubject[id] ?? 0;
            if (c > prev) {
              added += c - prev;
              const nm = nameById.get(id);
              if (nm) subjects.push(nm);
            }
          }
          if (added > 0) {
            const word = added === 1 ? 'новая оценка' : 'новых оценок';
            await notifyNow(`📊 ${added} ${word}`, truncate(subjects.slice(0, 3).join(', ')), {
              kind: 'grades',
            });
          }
        }
        next.gradeCountBySubject = counts;
      } catch {
        /* пропускаем категорию */
      }
    }

    // --- Домашние задания (новые + проверенные) + дедлайны ---
    if (groupId != null) {
      if (prefs.homeworkNew || prefs.deadlines) {
        try {
          const todo = await fetchHomeworkList({ page: 1, status: 3, groupId });
          if (!first && prefs.homeworkNew) {
            const newOnes = todo.filter((h) => !snap.hwTodoIds.includes(h.id));
            for (const h of newOnes.slice(0, 5)) {
              await notifyNow('📚 Новое домашнее задание', `${h.subject}: ${truncate(h.theme, 60)}`, {
                kind: 'homeworkNew',
                id: h.id,
              });
            }
          }
          next.hwTodoIds = todo.map((h) => h.id);
          if (prefs.deadlines) await scheduleDeadlines(todo);
        } catch {
          /* пропускаем */
        }
      }

      if (prefs.homeworkChecked) {
        try {
          const checked = await fetchHomeworkList({ page: 1, status: 1, groupId });
          const keyed = checked.filter((h) => h.mark != null);
          if (!first) {
            const newChecked = keyed.filter(
              (h) => !snap.hwCheckedKeys.includes(`${h.id}:${h.mark}`),
            );
            for (const h of newChecked.slice(0, 5)) {
              await notifyNow('✅ Работа проверена', `${h.subject}: оценка ${h.mark}`, {
                kind: 'homeworkChecked',
                id: h.id,
              });
            }
          }
          next.hwCheckedKeys = keyed.map((h) => `${h.id}:${h.mark}`);
        } catch {
          /* пропускаем */
        }
      }
    }

    // --- Новости ---
    if (prefs.news) {
      try {
        const news = await fetchLatestNews();
        if (!first) {
          const newOnes = news.filter((n) => !snap.newsIds.includes(n.id));
          for (const n of newOnes.slice(0, 5)) {
            await notifyNow('📰 Новость', truncate(n.theme, 90), { kind: 'news', id: n.id });
          }
        }
        next.newsIds = news.map((n) => n.id);
      } catch {
        /* пропускаем */
      }
    }

    // --- Отзывы преподавателей ---
    if (prefs.reviews) {
      try {
        const reviews = await fetchReviews();
        const key = (r: { date: string; teacher: string }) => `${r.date}|${r.teacher}`;
        if (!first) {
          const newOnes = reviews.filter((r) => !snap.reviewKeys.includes(key(r)));
          for (const r of newOnes.slice(0, 5)) {
            await notifyNow('💬 Новый отзыв преподавателя', `${r.teacher}: ${truncate(r.message, 70)}`, {
              kind: 'reviews',
            });
          }
        }
        next.reviewKeys = reviews.map(key);
      } catch {
        /* пропускаем */
      }
    }

    // --- Экзамены ---
    if (prefs.exams) {
      try {
        const exams = await fetchExams();
        const key = (e: { id: number; mark: number | null }) => `${e.id}:${e.mark ?? ''}`;
        if (!first) {
          const newOnes = exams.filter((e) => !snap.examKeys.includes(key(e)));
          for (const e of newOnes.slice(0, 5)) {
            const tail = e.mark != null ? `оценка ${e.mark}` : 'назначен';
            await notifyNow('🎓 Экзамен', `${e.subject}: ${tail}`, { kind: 'exams', id: e.id });
          }
        }
        next.examKeys = exams.map(key);
      } catch {
        /* пропускаем */
      }
    }

    // --- Оплата (только планирование напоминаний) ---
    // Сбрасываем старые отложенные и планируем заново вместе с дедлайнами.
    // (cancelAllScheduled вызываем один раз — до перепланирования ниже.)

    if (prefs.payments) {
      try {
        const payments = await fetchPayments();
        await schedulePayments(payments);
      } catch {
        /* пропускаем */
      }
    }

    next.initialized = true;
    await saveSnapshot(next);
    return true;
  } finally {
    syncing = false;
  }
}
