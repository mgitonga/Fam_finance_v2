import { describe, it, expect } from 'vitest';
import {
  createBudgetSchema,
  updateBudgetSchema,
  createOverallBudgetSchema,
  copyBudgetSchema,
  getBudgetStatus,
  checkBudgetThreshold,
} from '@/lib/validations/budget';

describe('createBudgetSchema', () => {
  it('accepts valid budget data', () => {
    const result = createBudgetSchema.safeParse({
      category_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      amount: 5000,
      month: 3,
      year: 2026,
    });
    expect(result.success).toBe(true);
  });

  it('rejects zero amount', () => {
    const result = createBudgetSchema.safeParse({
      category_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      amount: 0,
      month: 3,
      year: 2026,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative amount', () => {
    const result = createBudgetSchema.safeParse({
      category_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      amount: -100,
      month: 3,
      year: 2026,
    });
    expect(result.success).toBe(false);
  });

  it('rejects month outside 1-12', () => {
    const result = createBudgetSchema.safeParse({
      category_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      amount: 5000,
      month: 13,
      year: 2026,
    });
    expect(result.success).toBe(false);
  });

  it('rejects month 0', () => {
    const result = createBudgetSchema.safeParse({
      category_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      amount: 5000,
      month: 0,
      year: 2026,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid category_id', () => {
    const result = createBudgetSchema.safeParse({
      category_id: 'not-uuid',
      amount: 5000,
      month: 3,
      year: 2026,
    });
    expect(result.success).toBe(false);
  });
});

describe('updateBudgetSchema', () => {
  it('accepts valid amount update', () => {
    const result = updateBudgetSchema.safeParse({ amount: 10000 });
    expect(result.success).toBe(true);
  });

  it('rejects zero amount', () => {
    const result = updateBudgetSchema.safeParse({ amount: 0 });
    expect(result.success).toBe(false);
  });
});

describe('createOverallBudgetSchema', () => {
  it('accepts valid overall budget', () => {
    const result = createOverallBudgetSchema.safeParse({
      amount: 100000,
      month: 3,
      year: 2026,
    });
    expect(result.success).toBe(true);
  });
});

describe('copyBudgetSchema', () => {
  it('accepts valid copy params', () => {
    const result = copyBudgetSchema.safeParse({
      from_month: 2,
      from_year: 2026,
      to_month: 3,
      to_year: 2026,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid month in copy', () => {
    const result = copyBudgetSchema.safeParse({
      from_month: 13,
      from_year: 2026,
      to_month: 3,
      to_year: 2026,
    });
    expect(result.success).toBe(false);
  });
});

describe('getBudgetStatus', () => {
  it('returns green for under 70%', () => {
    const status = getBudgetStatus(3000, 10000);
    expect(status.color).toBe('green');
    expect(status.percentage).toBe(30);
    expect(status.status).toBe('under');
  });

  it('returns green at exactly 69%', () => {
    const status = getBudgetStatus(6900, 10000);
    expect(status.color).toBe('green');
  });

  it('returns amber at 70%', () => {
    const status = getBudgetStatus(7000, 10000);
    expect(status.color).toBe('amber');
    expect(status.status).toBe('warning');
  });

  it('returns amber at 89%', () => {
    const status = getBudgetStatus(8900, 10000);
    expect(status.color).toBe('amber');
  });

  it('returns red at 90%', () => {
    const status = getBudgetStatus(9000, 10000);
    expect(status.color).toBe('red');
    expect(status.status).toBe('exceeded');
  });

  it('returns red at 100%', () => {
    const status = getBudgetStatus(10000, 10000);
    expect(status.color).toBe('red');
    expect(status.percentage).toBe(100);
  });

  it('caps percentage at 100 when overspent', () => {
    const status = getBudgetStatus(15000, 10000);
    expect(status.percentage).toBe(100);
    expect(status.color).toBe('red');
  });

  it('returns green for zero budget', () => {
    const status = getBudgetStatus(500, 0);
    expect(status.color).toBe('green');
    expect(status.percentage).toBe(0);
  });

  it('returns green for zero spent', () => {
    const status = getBudgetStatus(0, 10000);
    expect(status.color).toBe('green');
    expect(status.percentage).toBe(0);
  });
});

describe('checkBudgetThreshold', () => {
  it('returns null under 80%', () => {
    expect(checkBudgetThreshold(7900, 10000)).toBeNull();
  });

  it('returns warning at 80%', () => {
    expect(checkBudgetThreshold(8000, 10000)).toBe('warning');
  });

  it('returns warning at 99%', () => {
    expect(checkBudgetThreshold(9900, 10000)).toBe('warning');
  });

  it('returns exceeded at 100%', () => {
    expect(checkBudgetThreshold(10000, 10000)).toBe('exceeded');
  });

  it('returns exceeded when overspent', () => {
    expect(checkBudgetThreshold(12000, 10000)).toBe('exceeded');
  });

  it('returns null for zero budget', () => {
    expect(checkBudgetThreshold(5000, 0)).toBeNull();
  });
});
