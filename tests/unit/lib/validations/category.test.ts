import { describe, it, expect } from 'vitest';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryTypeEnum,
} from '@/lib/validations/category';

describe('categoryTypeEnum', () => {
  it('accepts valid category types', () => {
    expect(categoryTypeEnum.safeParse('expense').success).toBe(true);
    expect(categoryTypeEnum.safeParse('income').success).toBe(true);
    expect(categoryTypeEnum.safeParse('both').success).toBe(true);
  });

  it('rejects invalid category type', () => {
    expect(categoryTypeEnum.safeParse('savings').success).toBe(false);
  });
});

describe('createCategorySchema', () => {
  it('accepts valid category data', () => {
    const result = createCategorySchema.safeParse({
      name: 'Food & Groceries',
      type: 'expense',
      sort_order: 1,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createCategorySchema.safeParse({
      name: '',
      type: 'expense',
      sort_order: 0,
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid hex color', () => {
    const result = createCategorySchema.safeParse({
      name: 'Test',
      type: 'expense',
      color: '#2563EB',
      sort_order: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid hex color', () => {
    const result = createCategorySchema.safeParse({
      name: 'Test',
      type: 'expense',
      color: 'red',
      sort_order: 0,
    });
    expect(result.success).toBe(false);
  });

  it('accepts null parent_id', () => {
    const result = createCategorySchema.safeParse({
      name: 'Root',
      type: 'expense',
      parent_id: null,
      sort_order: 0,
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid UUID parent_id', () => {
    const result = createCategorySchema.safeParse({
      name: 'Sub',
      type: 'expense',
      parent_id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
      sort_order: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-UUID parent_id', () => {
    const result = createCategorySchema.safeParse({
      name: 'Sub',
      type: 'expense',
      parent_id: 'not-a-uuid',
      sort_order: 0,
    });
    expect(result.success).toBe(false);
  });
});

describe('updateCategorySchema', () => {
  it('accepts partial updates', () => {
    const result = updateCategorySchema.safeParse({ name: 'Updated' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateCategorySchema.safeParse({});
    expect(result.success).toBe(true);
  });
});
