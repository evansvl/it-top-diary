// Минимальный декодер payload JWT (base64url) без внешних зависимостей.
// Нужен, чтобы достать userId/exp из access-токена.

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function base64UrlDecode(input: string): string {
  let str = input.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  let output = '';
  let buffer = 0;
  let bits = 0;
  for (const ch of str) {
    if (ch === '=') break;
    const idx = B64.indexOf(ch);
    if (idx === -1) continue;
    buffer = (buffer << 6) | idx;
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      output += String.fromCharCode((buffer >> bits) & 0xff);
    }
  }
  return output;
}

export type JwtPayload = {
  userId?: number;
  idCity?: number;
  exp?: number;
  [key: string]: unknown;
};

// Безопасно декодирует payload. Возвращает null, если токен битый.
export function decodeJwt(token: string): JwtPayload | null {
  const parts = token.split('.');
  if (parts.length < 2 || !parts[1]) return null;
  try {
    return JSON.parse(base64UrlDecode(parts[1])) as JwtPayload;
  } catch {
    return null;
  }
}
