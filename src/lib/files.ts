import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';

// Скачивание файла (задание/сданная работа) и открытие системного
// share-листа — оттуда можно сохранить в «Файлы» или открыть в приложении.
// Ссылки fs.top-academy.ru публичные, авторизация не нужна.

// Имя файла из заголовка Content-Disposition (URL-ы fs.* непрозрачные).
function filenameFromDisposition(disposition: string | undefined): string | null {
  if (!disposition) return null;
  const utf8 = /filename\*=UTF-8''([^;]+)/i.exec(disposition);
  if (utf8?.[1]) {
    try {
      return decodeURIComponent(utf8[1]);
    } catch {
      /* падаем на обычный filename */
    }
  }
  const plain = /filename="?([^";]+)"?/i.exec(disposition);
  return plain?.[1] ?? null;
}

// Недопустимые в имени файла символы → "_".
function sanitize(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_');
}

export async function downloadAndShare(
  url: string,
  fallbackName: string,
): Promise<void> {
  // Качаем во временное имя, затем переименовываем по Content-Disposition,
  // чтобы share-лист показывал настоящее имя и расширение файла.
  const tmpPath = `${FileSystem.cacheDirectory}hw-${Date.now()}`;
  const result = await FileSystem.downloadAsync(url, tmpPath);
  if (result.status !== 200) {
    throw new Error(`Не удалось скачать файл (${result.status})`);
  }

  const headers = result.headers ?? {};
  const disposition =
    headers['Content-Disposition'] ?? headers['content-disposition'];
  const name = sanitize(filenameFromDisposition(disposition) ?? fallbackName);

  const finalPath = `${FileSystem.cacheDirectory}${name}`;
  if (finalPath !== tmpPath) {
    await FileSystem.moveAsync({ from: tmpPath, to: finalPath });
  }

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('Открытие файлов недоступно на этом устройстве');
  }
  const mimeType =
    headers['Content-Type'] ?? headers['content-type'] ?? undefined;
  await Sharing.shareAsync(finalPath, { mimeType });
}
