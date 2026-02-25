import { describe, it, expect } from 'vitest';
import { formatKES, formatDate, cn } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'py-1')).toBe('px-2 py-1');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'extra')).toBe('base extra');
  });

  it('merges conflicting tailwind classes', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });
});

describe('formatKES', () => {
  it('formats a positive number as KES currency', () => {
    expect(formatKES(1500)).toBe('KES 1,500.00');
  });

  it('formats zero', () => {
    const result = formatKES(0);
    expect(result).toContain('0.00');
  });

  it('formats decimal amounts', () => {
    const result = formatKES(1234.56);
    expect(result).toContain('1,234.56');
  });

  it('formats large numbers with comma separators', () => {
    const result = formatKES(150000);
    expect(result).toContain('150,000');
  });
});

describe('formatDate', () => {
  it('formats a date string to DD/MM/YYYY', () => {
    expect(formatDate('2026-01-15')).toBe('15/01/2026');
  });

  it('formats a Date object to DD/MM/YYYY', () => {
    expect(formatDate(new Date(2026, 0, 15))).toBe('15/01/2026');
  });
});
