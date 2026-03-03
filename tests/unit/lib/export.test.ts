import { describe, it, expect } from 'vitest';
import { formatKES, formatDate } from '@/lib/utils';

describe('formatKES (export context)', () => {
  it('formats for CSV output', () => {
    expect(formatKES(150000)).toBe('KES 150,000.00');
  });

  it('formats zero for export', () => {
    expect(formatKES(0)).toBe('KES 0.00');
  });

  it('formats decimals correctly', () => {
    expect(formatKES(2500.5)).toBe('KES 2,500.50');
  });
});

describe('formatDate (export context)', () => {
  it('formats ISO date to DD/MM/YYYY', () => {
    expect(formatDate('2026-03-15')).toBe('15/03/2026');
  });

  it('formats another date', () => {
    expect(formatDate('2026-12-01')).toBe('01/12/2026');
  });
});
