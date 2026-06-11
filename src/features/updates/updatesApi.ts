import type { UpdateInfo } from './types';

// Проверка обновлений через GitHub Releases. Обычный fetch, НЕ apiRequest:
// клиент журнала подставляет Origin/Referer top-academy, GitHub они не нужны.

const LATEST_RELEASE_URL =
  'https://api.github.com/repos/evansvl/it-top-diary/releases/latest';

type RawAsset = {
  name: string;
  size: number;
  browser_download_url: string;
};

type RawRelease = {
  tag_name: string;
  html_url: string;
  body?: string | null;
  draft?: boolean;
  prerelease?: boolean;
  assets?: RawAsset[];
};

// "v1.2.3" → [1, 2, 3]
function parseVersion(version: string): number[] {
  return version
    .replace(/^v/i, '')
    .split('.')
    .map((part) => Number.parseInt(part, 10) || 0);
}

/** > 0, если a новее b */
export function compareVersions(a: string, b: string): number {
  const pa = parseVersion(a);
  const pb = parseVersion(b);
  const len = Math.max(pa.length, pb.length);
  for (let i = 0; i < len; i += 1) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Возвращает UpdateInfo, если последний релиз новее текущей версии, иначе null. */
export async function checkForUpdate(
  currentVersion: string,
): Promise<UpdateInfo | null> {
  let res: Response;
  try {
    res = await fetch(LATEST_RELEASE_URL, {
      headers: { Accept: 'application/vnd.github+json' },
    });
  } catch {
    throw new Error('Нет соединения с GitHub');
  }
  if (!res.ok) {
    throw new Error(`GitHub ответил ошибкой (${res.status})`);
  }

  const release = (await res.json()) as RawRelease;
  if (release.draft || release.prerelease) return null;
  if (compareVersions(release.tag_name, currentVersion) <= 0) return null;

  const apk = (release.assets ?? []).find((a) =>
    a.name.toLowerCase().endsWith('.apk'),
  );
  if (!apk) return null;

  return {
    version: release.tag_name.replace(/^v/i, ''),
    apkUrl: apk.browser_download_url,
    sizeBytes: apk.size,
    notes: (release.body ?? '').trim(),
    pageUrl: release.html_url,
  };
}
