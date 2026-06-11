// Мини-парсер HTML новостей журнала (text_bbs): текстовые абзацы + картинки.
// Полноценный HTML-рендерер не нужен — новости состоят из <p>, <b>, <br>, <img>.

export type HtmlBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; url: string };

// Именованные сущности, встречающиеся в текстах журнала.
const NAMED_ENTITIES: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  nbsp: ' ',
  laquo: '«',
  raquo: '»',
  mdash: '—',
  ndash: '–',
  hellip: '…',
};

function decodeEntities(s: string): string {
  return s
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) =>
      String.fromCodePoint(Number.parseInt(hex, 16)),
    )
    .replace(/&#(\d+);/g, (_, dec: string) =>
      String.fromCodePoint(Number.parseInt(dec, 10)),
    )
    .replace(/&([a-zA-Z]+);/g, (m, name: string) => NAMED_ENTITIES[name] ?? m);
}

export function htmlToBlocks(html: string): HtmlBlock[] {
  // Картинки → маркеры-строки, чтобы пережить вырезание тегов.
  let s = html.replace(
    /<img[^>]*src="([^"]+)"[^>]*\/?>/gi,
    (_, url: string) => `\n@@IMG@@${url}\n`,
  );
  // Блочные границы → переводы строк, остальные теги — долой.
  s = s
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, '');
  s = decodeEntities(s);

  const blocks: HtmlBlock[] = [];
  for (const rawLine of s.split('\n')) {
    const line = rawLine.replace(/\s+/g, ' ').trim();
    if (!line) continue;
    if (line.startsWith('@@IMG@@')) {
      blocks.push({ type: 'image', url: line.slice('@@IMG@@'.length).trim() });
    } else {
      blocks.push({ type: 'text', text: line });
    }
  }
  return blocks;
}
