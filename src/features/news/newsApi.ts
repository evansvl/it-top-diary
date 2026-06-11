import { apiRequest } from '@/api/client';
import { endpoints } from '@/api/endpoints';
import type { NewsDetail, NewsItem } from './types';

type RawNewsItem = {
  id_bbs: number;
  theme: string;
  time: string;
  viewed: boolean;
};

type RawNewsDetail = {
  id_bbs: number;
  theme: string;
  time: string;
  text_bbs: string;
  is_viewed: boolean;
};

// Список новостей (новые сверху — порядок API сохраняем).
export async function fetchLatestNews(): Promise<NewsItem[]> {
  const raw = await apiRequest<RawNewsItem[]>(endpoints.news.latest);
  return raw.map((r) => ({
    id: r.id_bbs,
    theme: r.theme,
    time: r.time,
    viewed: r.viewed,
  }));
}

export async function fetchNewsDetail(id: number): Promise<NewsDetail> {
  const raw = await apiRequest<RawNewsDetail>(
    `${endpoints.news.detail}?news_id=${id}`,
  );
  return {
    id: raw.id_bbs,
    theme: raw.theme,
    time: raw.time,
    html: raw.text_bbs,
  };
}
