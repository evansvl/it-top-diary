import { describe, expect, it } from 'vitest';
import { listOrEmpty } from '../src/api/response';

describe('listOrEmpty', () => {
  it('normalizes a null API list to an empty array', () => {
    expect(listOrEmpty(null)).toEqual([]);
  });

  it('keeps an existing array unchanged', () => {
    const payload = [{ id: 1 }];
    expect(listOrEmpty(payload)).toBe(payload);
  });

  it.each([
    [{}, 'Object'],
    [undefined, 'Undefined'],
    ['not-a-list', 'String'],
  ])('rejects an unexpected payload %#', (payload, type) => {
    expect(() => listOrEmpty(payload)).toThrow(
      `ожидался массив или null, получено ${type}`,
    );
  });
});
