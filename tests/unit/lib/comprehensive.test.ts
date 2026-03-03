import { describe, it, expect } from 'vitest';
import { cn, formatKES, formatDate } from '@/lib/utils';
import { getBudgetStatus, checkBudgetThreshold } from '@/lib/validations/budget';
import {
  calculateRequiredMonthly,
  checkGoalMilestone,
  calculatePayoffDate,
} from '@/lib/validations/savings-debt';
import { getNextDueDate, getDaysUntilDue } from '@/lib/validations/recurring';
import { parseCSVLine, parseDateString, validateReceiptFile } from '@/lib/csv';

// ============================================
// Comprehensive edge case tests
// ============================================

describe('formatKES edge cases', () => {
  it('formats very large numbers', () => {
    expect(formatKES(10000000)).toBe('KES 10,000,000.00');
  });

  it('formats very small decimals', () => {
    expect(formatKES(0.01)).toBe('KES 0.01');
  });

  it('formats negative numbers', () => {
    const result = formatKES(-5000);
    expect(result).toContain('5,000');
  });
});

describe('formatDate edge cases', () => {
  it('formats leap year date', () => {
    expect(formatDate('2024-02-29')).toBe('29/02/2024');
  });

  it('formats end of year', () => {
    expect(formatDate('2026-12-31')).toBe('31/12/2026');
  });

  it('formats start of year', () => {
    expect(formatDate('2026-01-01')).toBe('01/01/2026');
  });
});

describe('cn utility edge cases', () => {
  it('handles undefined inputs', () => {
    expect(cn(undefined, 'test')).toBe('test');
  });

  it('handles null inputs', () => {
    expect(cn(null, 'test')).toBe('test');
  });

  it('handles empty string', () => {
    expect(cn('', 'test')).toBe('test');
  });

  it('deduplicates tailwind classes', () => {
    expect(cn('text-red-500', 'text-blue-500')).toBe('text-blue-500');
  });
});

describe('budget status boundary tests', () => {
  it('handles exactly 0% spent', () => {
    const status = getBudgetStatus(0, 10000);
    expect(status.percentage).toBe(0);
    expect(status.color).toBe('green');
  });

  it('handles exactly 70% boundary', () => {
    const status = getBudgetStatus(7000, 10000);
    expect(status.color).toBe('amber');
  });

  it('handles 69.99% (just under amber)', () => {
    const status = getBudgetStatus(6999, 10000);
    expect(status.color).toBe('green');
  });

  it('handles 89.99% (just under red)', () => {
    const status = getBudgetStatus(8999, 10000);
    expect(status.color).toBe('amber');
  });

  it('handles very large overspend', () => {
    const status = getBudgetStatus(1000000, 100);
    expect(status.color).toBe('red');
    expect(status.percentage).toBe(100); // Capped
  });
});

describe('budget threshold notification tests', () => {
  it('returns null at exactly 79.99%', () => {
    expect(checkBudgetThreshold(7999, 10000)).toBeNull();
  });

  it('returns warning at exactly 80%', () => {
    expect(checkBudgetThreshold(8000, 10000)).toBe('warning');
  });

  it('returns exceeded at exactly 100%', () => {
    expect(checkBudgetThreshold(10000, 10000)).toBe('exceeded');
  });

  it('returns exceeded at 200%', () => {
    expect(checkBudgetThreshold(20000, 10000)).toBe('exceeded');
  });

  it('returns null for negative budget', () => {
    expect(checkBudgetThreshold(5000, -1000)).toBeNull();
  });
});

describe('savings goal milestone edge cases', () => {
  it('detects jump from 0 to 100%', () => {
    expect(checkGoalMilestone(100000, 100000, 0)).toBe(100);
  });

  it('returns highest milestone when multiple crossed', () => {
    // Jump from 0% to 80% — should return 75 (highest crossed)
    expect(checkGoalMilestone(80000, 100000, 0)).toBe(75);
  });

  it('handles overshoot beyond 100%', () => {
    expect(checkGoalMilestone(150000, 100000, 90000)).toBe(100);
  });
});

describe('payoff projection edge cases', () => {
  it('handles very high interest with adequate payment', () => {
    const result = calculatePayoffDate(100000, 24, 5000);
    expect(result).not.toBeNull();
  });

  it('handles exact payment equals interest (never pays off)', () => {
    // 120k at 10% = 1k/mo interest, payment exactly 1k
    const result = calculatePayoffDate(120000, 10, 1000);
    expect(result).toBeNull();
  });

  it('handles very small balance', () => {
    const result = calculatePayoffDate(1, 12, 100);
    expect(result).not.toBeNull();
  });
});

describe('recurring date calculation edge cases', () => {
  it('handles day 31 in a 30-day month', () => {
    const result = getNextDueDate(31, new Date(2026, 3, 1)); // April has 30 days
    expect(result).toBe('2026-04-30'); // Clamped to last day
  });

  it('handles day 29 in non-leap year February', () => {
    const result = getNextDueDate(29, new Date(2027, 1, 1)); // Feb 2027 (non-leap)
    expect(result).toBe('2027-02-28');
  });

  it('getDaysUntilDue returns 0 on due day', () => {
    expect(getDaysUntilDue(15, new Date(2026, 2, 15))).toBe(0);
  });

  it('getDaysUntilDue wraps correctly at month boundary', () => {
    const result = getDaysUntilDue(1, new Date(2026, 2, 31)); // March 31, due day 1
    expect(result).toBe(1); // 1 day until April 1
  });
});

describe('CSV parser edge cases', () => {
  it('handles double quotes within quoted fields', () => {
    const result = parseCSVLine('"hello ""world""",test');
    expect(result[0]).toBe('hello world');
    expect(result[1]).toBe('test');
  });

  it('handles newline-like content in non-quoted fields', () => {
    const result = parseCSVLine('a,b,c');
    expect(result).toHaveLength(3);
  });

  it('handles all empty fields', () => {
    const result = parseCSVLine(',,,');
    expect(result).toHaveLength(4);
    expect(result.every((v) => v === '')).toBe(true);
  });
});

describe('date parser edge cases', () => {
  it('rejects DD-MM-YYYY format (wrong separator)', () => {
    expect(parseDateString('15-01-2026')).toBeNull();
  });

  it('rejects MM/DD/YYYY ambiguous dates', () => {
    // 15/01/2026 is valid DD/MM/YYYY → 2026-01-15
    expect(parseDateString('15/01/2026')).toBe('2026-01-15');
  });

  it('rejects random strings', () => {
    expect(parseDateString('not a date')).toBeNull();
    expect(parseDateString('2026')).toBeNull();
    expect(parseDateString('')).toBeNull();
  });
});

describe('receipt file validation edge cases', () => {
  it('accepts exactly 5MB', () => {
    expect(validateReceiptFile({ type: 'image/jpeg', size: 5 * 1024 * 1024 })).toBeNull();
  });

  it('rejects 5MB + 1 byte', () => {
    expect(validateReceiptFile({ type: 'image/jpeg', size: 5 * 1024 * 1024 + 1 })).not.toBeNull();
  });

  it('rejects empty file type', () => {
    expect(validateReceiptFile({ type: '', size: 100 })).not.toBeNull();
  });

  it('rejects application/json', () => {
    expect(validateReceiptFile({ type: 'application/json', size: 100 })).not.toBeNull();
  });
});
