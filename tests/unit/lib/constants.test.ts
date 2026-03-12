import { describe, it, expect } from 'vitest';
import {
  APP_NAME,
  DEFAULT_CURRENCY,
  ITEMS_PER_PAGE,
  ACCOUNT_TYPES,
  PAYMENT_METHODS,
  TRANSACTION_TYPES,
  BUDGET_THRESHOLDS,
  NOTIFICATION_TYPES,
} from '@/lib/constants';

describe('constants', () => {
  it('has correct app name', () => {
    expect(APP_NAME).toBe('FamFin');
  });

  it('has correct default currency', () => {
    expect(DEFAULT_CURRENCY).toBe('KES');
  });

  it('has correct items per page', () => {
    expect(ITEMS_PER_PAGE).toBe(20);
  });

  it('has all account types', () => {
    const types = ACCOUNT_TYPES.map((t) => t.value);
    expect(types).toContain('bank');
    expect(types).toContain('mobile_money');
    expect(types).toContain('cash');
    expect(types).toContain('credit_card');
    expect(types).toContain('other');
    expect(types).toHaveLength(5);
  });

  it('has all payment methods', () => {
    const methods = PAYMENT_METHODS.map((m) => m.value);
    expect(methods).toContain('cash');
    expect(methods).toContain('card');
    expect(methods).toContain('mobile_money');
    expect(methods).toContain('bank_transfer');
    expect(methods).toHaveLength(5);
  });

  it('has income and expense transaction types', () => {
    const types = TRANSACTION_TYPES.map((t) => t.value);
    expect(types).toEqual(['income', 'expense', 'transfer', 'adjustment']);
  });

  it('has correct budget thresholds', () => {
    expect(BUDGET_THRESHOLDS.GREEN_MAX).toBe(70);
    expect(BUDGET_THRESHOLDS.AMBER_MAX).toBe(90);
    expect(BUDGET_THRESHOLDS.WARNING_THRESHOLD).toBe(80);
    expect(BUDGET_THRESHOLDS.EXCEEDED_THRESHOLD).toBe(100);
  });

  it('has all notification types', () => {
    expect(NOTIFICATION_TYPES).toContain('bill_reminder');
    expect(NOTIFICATION_TYPES).toContain('budget_warning');
    expect(NOTIFICATION_TYPES).toContain('budget_exceeded');
    expect(NOTIFICATION_TYPES).toContain('goal_milestone');
    expect(NOTIFICATION_TYPES).toContain('recurring_due');
    expect(NOTIFICATION_TYPES).toContain('system');
    expect(NOTIFICATION_TYPES).toHaveLength(6);
  });
});
