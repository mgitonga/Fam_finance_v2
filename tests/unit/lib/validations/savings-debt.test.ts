import { describe, it, expect } from 'vitest';
import {
  createSavingsGoalSchema,
  addContributionSchema,
  createDebtSchema,
  logDebtPaymentSchema,
  calculateRequiredMonthly,
  checkGoalMilestone,
  calculatePayoffDate,
} from '@/lib/validations/savings-debt';

describe('createSavingsGoalSchema', () => {
  it('accepts valid goal', () => {
    expect(
      createSavingsGoalSchema.safeParse({
        name: 'Vacation',
        target_amount: 100000,
        target_date: '2026-12-31',
      }).success,
    ).toBe(true);
  });

  it('rejects zero target', () => {
    expect(
      createSavingsGoalSchema.safeParse({
        name: 'Test',
        target_amount: 0,
        target_date: '2026-12-31',
      }).success,
    ).toBe(false);
  });

  it('rejects empty name', () => {
    expect(
      createSavingsGoalSchema.safeParse({
        name: '',
        target_amount: 1000,
        target_date: '2026-12-31',
      }).success,
    ).toBe(false);
  });
});

describe('addContributionSchema', () => {
  it('accepts valid contribution', () => {
    expect(
      addContributionSchema.safeParse({
        amount: 5000,
        date: '2026-03-01',
        account_id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'deposit',
      }).success,
    ).toBe(true);
  });

  it('accepts valid withdrawal', () => {
    expect(
      addContributionSchema.safeParse({
        amount: 2000,
        date: '2026-03-01',
        account_id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'withdrawal',
      }).success,
    ).toBe(true);
  });

  it('rejects zero amount', () => {
    expect(
      addContributionSchema.safeParse({
        amount: 0,
        date: '2026-03-01',
        account_id: '550e8400-e29b-41d4-a716-446655440000',
        type: 'deposit',
      }).success,
    ).toBe(false);
  });

  it('rejects missing account_id', () => {
    expect(
      addContributionSchema.safeParse({ amount: 5000, date: '2026-03-01', type: 'deposit' })
        .success,
    ).toBe(false);
  });
});

describe('createDebtSchema', () => {
  it('accepts valid debt', () => {
    expect(
      createDebtSchema.safeParse({
        name: 'Mortgage',
        type: 'mortgage',
        original_amount: 5000000,
        outstanding_balance: 4500000,
        start_date: '2025-01-01',
      }).success,
    ).toBe(true);
  });

  it('rejects invalid debt type', () => {
    expect(
      createDebtSchema.safeParse({
        name: 'Test',
        type: 'invalid',
        original_amount: 1000,
        outstanding_balance: 1000,
        start_date: '2025-01-01',
      }).success,
    ).toBe(false);
  });

  it('rejects negative balance', () => {
    expect(
      createDebtSchema.safeParse({
        name: 'Test',
        type: 'personal_loan',
        original_amount: 1000,
        outstanding_balance: -100,
        start_date: '2025-01-01',
      }).success,
    ).toBe(false);
  });
});

describe('logDebtPaymentSchema', () => {
  it('accepts valid payment', () => {
    expect(
      logDebtPaymentSchema.safeParse({
        amount: 50000,
        account_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      }).success,
    ).toBe(true);
  });

  it('rejects zero amount', () => {
    expect(
      logDebtPaymentSchema.safeParse({
        amount: 0,
        account_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      }).success,
    ).toBe(false);
  });
});

describe('calculateRequiredMonthly', () => {
  it('calculates monthly amount needed', () => {
    // Target: 100k, current: 40k, 6 months left → need 10k/mo
    const result = calculateRequiredMonthly(100000, 40000, '2026-09-01');
    expect(result).toBeGreaterThan(0);
  });

  it('returns 0 when goal is already met', () => {
    expect(calculateRequiredMonthly(100000, 100000, '2026-12-31')).toBe(0);
  });

  it('returns 0 when current exceeds target', () => {
    expect(calculateRequiredMonthly(100000, 120000, '2026-12-31')).toBe(0);
  });

  it('returns full remaining when past due date', () => {
    const result = calculateRequiredMonthly(100000, 50000, '2020-01-01');
    expect(result).toBe(50000);
  });
});

describe('checkGoalMilestone', () => {
  it('returns 25 when crossing 25%', () => {
    expect(checkGoalMilestone(26000, 100000, 20000)).toBe(25);
  });

  it('returns 50 when crossing 50%', () => {
    expect(checkGoalMilestone(51000, 100000, 45000)).toBe(50);
  });

  it('returns 75 when crossing 75%', () => {
    expect(checkGoalMilestone(76000, 100000, 70000)).toBe(75);
  });

  it('returns 100 when crossing 100%', () => {
    expect(checkGoalMilestone(100000, 100000, 95000)).toBe(100);
  });

  it('returns null when no milestone crossed', () => {
    expect(checkGoalMilestone(30000, 100000, 28000)).toBeNull();
  });

  it('returns null when already past milestone', () => {
    expect(checkGoalMilestone(55000, 100000, 52000)).toBeNull();
  });

  it('returns null for zero target', () => {
    expect(checkGoalMilestone(5000, 0, 0)).toBeNull();
  });
});

describe('calculatePayoffDate', () => {
  it('returns a date for payable debt', () => {
    const result = calculatePayoffDate(100000, 12, 10000);
    expect(result).not.toBeNull();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns null when payment <= monthly interest', () => {
    // 1M at 12% = 10k/mo interest, payment = 5k → can never pay off
    const result = calculatePayoffDate(1000000, 12, 5000);
    expect(result).toBeNull();
  });

  it('returns today for zero balance', () => {
    const result = calculatePayoffDate(0, 12, 10000);
    expect(result).not.toBeNull();
  });

  it('returns null for zero payment', () => {
    expect(calculatePayoffDate(100000, 12, 0)).toBeNull();
  });

  it('handles zero interest rate', () => {
    const result = calculatePayoffDate(100000, 0, 10000);
    expect(result).not.toBeNull();
    // Should take ~10 months
  });
});
