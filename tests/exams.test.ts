import { describe, expect, it } from 'vitest';
import {
  isStandardExamMark,
  type ExamRecord,
} from '../src/features/exams/types';

function exam(mark: number | null, markType: number | null): ExamRecord {
  return {
    id: 1,
    date: '2026-08-16',
    subject: 'Математика',
    teacher: 'Преподаватель',
    mark,
    markType,
  };
}

describe('isStandardExamMark', () => {
  it.each([1, 2, 3, 4, 5])('accepts the standard mark %i', (mark) => {
    expect(isStandardExamMark(exam(mark, 1))).toBe(true);
  });

  it.each([
    [null, 1],
    [0, 1],
    [6, 1],
    [20, -20],
    [5, null],
  ])('rejects a non-standard mark (%s, %s)', (mark, markType) => {
    expect(isStandardExamMark(exam(mark, markType))).toBe(false);
  });
});
