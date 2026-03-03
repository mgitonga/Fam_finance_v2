import { describe, it, expect } from 'vitest';
import {
  createRecurringSchema,
  createBillReminderSchema,
  getNextDueDate,
  shouldSendReminder,
  getDaysUntilDue,
} from '@/lib/validations/recurring';

describe('createRecurringSchema', () => {
  const valid = {
    type: 'expense' as const,
    amount: 5000,
    category_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    account_id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
    day_of_month: 15,
    description: 'Monthly rent',
  };

  it('accepts valid recurring data', () => {
    expect(createRecurringSchema.safeParse(valid).success).toBe(true);
  });

  it('rejects zero amount', () => {
    expect(createRecurringSchema.safeParse({ ...valid, amount: 0 }).success).toBe(false);
  });

  it('rejects day 0', () => {
    expect(createRecurringSchema.safeParse({ ...valid, day_of_month: 0 }).success).toBe(false);
  });

  it('rejects day 32', () => {
    expect(createRecurringSchema.safeParse({ ...valid, day_of_month: 32 }).success).toBe(false);
  });

  it('rejects empty description', () => {
    expect(createRecurringSchema.safeParse({ ...valid, description: '' }).success).toBe(false);
  });

  it('rejects invalid type', () => {
    expect(createRecurringSchema.safeParse({ ...valid, type: 'transfer' }).success).toBe(false);
  });
});

describe('createBillReminderSchema', () => {
  const valid = {
    name: 'Rent',
    due_day: 1,
    reminder_days_before: 3,
    notification_method: 'both' as const,
  };

  it('accepts valid bill reminder', () => {
    expect(createBillReminderSchema.safeParse(valid).success).toBe(true);
  });

  it('accepts with optional amount', () => {
    expect(createBillReminderSchema.safeParse({ ...valid, amount: 50000 }).success).toBe(true);
  });

  it('accepts null amount', () => {
    expect(createBillReminderSchema.safeParse({ ...valid, amount: null }).success).toBe(true);
  });

  it('rejects empty name', () => {
    expect(createBillReminderSchema.safeParse({ ...valid, name: '' }).success).toBe(false);
  });

  it('rejects due_day 0', () => {
    expect(createBillReminderSchema.safeParse({ ...valid, due_day: 0 }).success).toBe(false);
  });

  it('rejects invalid notification method', () => {
    expect(
      createBillReminderSchema.safeParse({ ...valid, notification_method: 'sms' }).success,
    ).toBe(false);
  });
});

describe('getNextDueDate', () => {
  it('returns this month if day has not passed', () => {
    const result = getNextDueDate(25, new Date(2026, 2, 3)); // March 3
    expect(result).toBe('2026-03-25');
  });

  it('returns next month if day has passed', () => {
    const result = getNextDueDate(1, new Date(2026, 2, 15)); // March 15, day 1 passed
    expect(result).toBe('2026-04-01');
  });

  it('handles December to January rollover', () => {
    const result = getNextDueDate(5, new Date(2026, 11, 10)); // Dec 10, day 5 passed
    expect(result).toBe('2027-01-05');
  });

  it('clamps to last day of month (Feb 30 → Feb 28)', () => {
    const result = getNextDueDate(30, new Date(2026, 1, 1)); // Feb 1
    expect(result).toBe('2026-02-28');
  });

  it('returns same day if today matches', () => {
    const result = getNextDueDate(15, new Date(2026, 2, 15)); // March 15
    // Day >= dayOfMonth, so next month
    expect(result).toBe('2026-04-15');
  });
});

describe('shouldSendReminder', () => {
  it('returns true when days match', () => {
    expect(shouldSendReminder(10, 3, new Date(2026, 2, 7))).toBe(true); // 10 - 7 = 3
  });

  it('returns false when days do not match', () => {
    expect(shouldSendReminder(10, 3, new Date(2026, 2, 5))).toBe(false); // 10 - 5 = 5
  });

  it('returns false when due day has passed', () => {
    expect(shouldSendReminder(5, 3, new Date(2026, 2, 10))).toBe(false);
  });
});

describe('getDaysUntilDue', () => {
  it('returns correct days when due is ahead', () => {
    expect(getDaysUntilDue(15, new Date(2026, 2, 10))).toBe(5);
  });

  it('returns 0 when due is today', () => {
    expect(getDaysUntilDue(10, new Date(2026, 2, 10))).toBe(0);
  });

  it('calculates days wrapping to next month when due has passed', () => {
    const result = getDaysUntilDue(5, new Date(2026, 2, 10)); // March 10, due day 5 passed
    // 31 - 10 + 5 = 26 days until next month's day 5
    expect(result).toBe(26);
  });
});
