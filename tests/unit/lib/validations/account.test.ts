import { describe, it, expect } from 'vitest';
import {
  createAccountSchema,
  updateAccountSchema,
  accountTypeEnum,
} from '@/lib/validations/account';

describe('accountTypeEnum', () => {
  it('accepts valid account types', () => {
    expect(accountTypeEnum.safeParse('bank').success).toBe(true);
    expect(accountTypeEnum.safeParse('mobile_money').success).toBe(true);
    expect(accountTypeEnum.safeParse('cash').success).toBe(true);
    expect(accountTypeEnum.safeParse('credit_card').success).toBe(true);
    expect(accountTypeEnum.safeParse('other').success).toBe(true);
  });

  it('rejects invalid account type', () => {
    expect(accountTypeEnum.safeParse('crypto').success).toBe(false);
    expect(accountTypeEnum.safeParse('').success).toBe(false);
  });
});

describe('createAccountSchema', () => {
  it('accepts valid account data', () => {
    const result = createAccountSchema.safeParse({
      name: 'Joint Account',
      type: 'bank',
      balance: 50000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createAccountSchema.safeParse({
      name: '',
      type: 'bank',
      balance: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects name over 100 characters', () => {
    const result = createAccountSchema.safeParse({
      name: 'A'.repeat(101),
      type: 'bank',
      balance: 0,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid account type', () => {
    const result = createAccountSchema.safeParse({
      name: 'Test',
      type: 'invalid',
      balance: 0,
    });
    expect(result.success).toBe(false);
  });

  it('accepts zero balance', () => {
    const result = createAccountSchema.safeParse({
      name: 'Cash',
      type: 'cash',
      balance: 0,
    });
    expect(result.success).toBe(true);
  });

  it('accepts negative balance', () => {
    const result = createAccountSchema.safeParse({
      name: 'Credit Card',
      type: 'credit_card',
      balance: -5000,
    });
    expect(result.success).toBe(true);
  });
});

describe('updateAccountSchema', () => {
  it('accepts partial updates', () => {
    const result = updateAccountSchema.safeParse({ name: 'Updated Name' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateAccountSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid type in partial', () => {
    const result = updateAccountSchema.safeParse({ type: 'invalid' });
    expect(result.success).toBe(false);
  });
});
