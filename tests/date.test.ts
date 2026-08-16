import { describe, expect, it } from 'vitest';
import {
  formatDate,
  monthTitle,
  shiftDay,
  shiftMonth,
  weekStartIso,
} from '../src/lib/date';

describe('date helpers', () => {
  it('formats API dates without a timezone shift', () => {
    expect(formatDate('2026-08-16')).toBe('16.08.2026');
    expect(formatDate('unknown')).toBe('unknown');
  });

  it('moves across month and year boundaries', () => {
    expect(shiftMonth('2026-01-01', -1)).toBe('2025-12-01');
    expect(shiftMonth('2026-12-01', 1)).toBe('2027-01-01');
  });

  it('handles leap days', () => {
    expect(shiftDay('2024-02-28', 1)).toBe('2024-02-29');
    expect(shiftDay('2024-02-28', 2)).toBe('2024-03-01');
  });

  it('returns Monday as the start of a week', () => {
    expect(weekStartIso('2026-08-16')).toBe('2026-08-10');
  });

  it('builds a Russian month title', () => {
    expect(monthTitle('2026-08-01')).toBe('Август 2026');
  });
});
