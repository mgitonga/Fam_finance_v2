import { describe, it, expect } from 'vitest';
import {
  createTransactionSchema,
  updateTransactionSchema,
  transactionTypeEnum,
  paymentMethodEnum,
} from '@/lib/validations/transaction';

describe('transactionTypeEnum', () => {
  it('accepts income and expense', () => {
    expect(transactionTypeEnum.safeParse('income').success).toBe(true);
    expect(transactionTypeEnum.safeParse('expense').success).toBe(true);
    expect(transactionTypeEnum.safeParse('transfer').success).toBe(true);
    expect(transactionTypeEnum.safeParse('adjustment').success).toBe(true);
  });

  it('rejects invalid type', () => {
    expect(transactionTypeEnum.safeParse('refund').success).toBe(false);
  });
});

describe('paymentMethodEnum', () => {
  it('accepts all valid payment methods', () => {
    expect(paymentMethodEnum.safeParse('cash').success).toBe(true);
    expect(paymentMethodEnum.safeParse('card').success).toBe(true);
    expect(paymentMethodEnum.safeParse('mobile_money').success).toBe(true);
    expect(paymentMethodEnum.safeParse('bank_transfer').success).toBe(true);
    expect(paymentMethodEnum.safeParse('other').success).toBe(true);
  });

  it('rejects invalid payment method', () => {
    expect(paymentMethodEnum.safeParse('crypto').success).toBe(false);
  });
});

describe('createTransactionSchema', () => {
  const validTransaction = {
    type: 'expense',
    amount: 2500,
    date: '2026-03-01',
    account_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    category_id: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  };

  it('accepts valid transaction data', () => {
    const result = createTransactionSchema.safeParse(validTransaction);
    expect(result.success).toBe(true);
  });

  it('accepts full transaction with all fields', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      description: 'Weekly groceries',
      merchant: 'Naivas',
      payment_method: 'mobile_money',
      tags: ['groceries', 'weekly'],
      notes: 'Shopping for the week',
    });
    expect(result.success).toBe(true);
  });

  it('rejects zero amount', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      amount: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative amount', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      amount: -100,
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing date', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      date: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid account_id format', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      account_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid category_id format', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      category_id: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid transaction type', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      type: 'transfer',
    });
    expect(result.success).toBe(false);
  });

  it('accepts null optional fields', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      description: null,
      merchant: null,
      payment_method: null,
      notes: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts split expense fields', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      split_with: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
      split_ratio: 0.6,
    });
    expect(result.success).toBe(true);
  });

  it('rejects split_ratio above 1', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      split_ratio: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects split_ratio below 0', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      split_ratio: -0.1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects description over 500 chars', () => {
    const result = createTransactionSchema.safeParse({
      ...validTransaction,
      description: 'A'.repeat(501),
    });
    expect(result.success).toBe(false);
  });
});

describe('updateTransactionSchema', () => {
  it('accepts partial update with only amount', () => {
    const result = updateTransactionSchema.safeParse({ amount: 3000 });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateTransactionSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid amount in partial', () => {
    const result = updateTransactionSchema.safeParse({ amount: -100 });
    expect(result.success).toBe(false);
  });

  it('accepts partial type change', () => {
    const result = updateTransactionSchema.safeParse({ type: 'income' });
    expect(result.success).toBe(true);
  });
});
