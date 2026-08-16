import { describe, expect, it } from 'vitest';
import {
  OFFLINE_CACHE_MAX_AGE,
  shouldPersistQuery,
} from '../src/lib/offlineCachePolicy';

describe('offline cache policy', () => {
  it('keeps successful queries for seven days', () => {
    expect(OFFLINE_CACHE_MAX_AGE).toBe(7 * 24 * 60 * 60 * 1000);
    expect(shouldPersistQuery({ state: { status: 'success' } })).toBe(true);
  });

  it.each(['pending', 'error'])('does not persist %s queries', (status) => {
    expect(shouldPersistQuery({ state: { status } })).toBe(false);
  });

  it('supports explicit opt-out for sensitive future queries', () => {
    expect(
      shouldPersistQuery({
        state: { status: 'success' },
        meta: { persist: false },
      }),
    ).toBe(false);
  });
});
