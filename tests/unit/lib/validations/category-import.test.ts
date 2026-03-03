import { describe, it, expect } from 'vitest';
import { categoryImportRowSchema, validateCategoryImportRow } from '@/lib/validations/category';

describe('categoryImportRowSchema', () => {
  it('accepts valid row', () => {
    const result = categoryImportRowSchema.safeParse({
      name: 'Food & Groceries',
      type: 'expense',
    });
    expect(result.success).toBe(true);
  });

  it('accepts row with all fields', () => {
    const result = categoryImportRowSchema.safeParse({
      name: 'Household Goods',
      type: 'expense',
      parent_category: 'Food & Groceries',
      color: '#2563EB',
      icon: 'shopping-cart',
      sort_order: 2,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = categoryImportRowSchema.safeParse({
      name: '',
      type: 'expense',
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid type', () => {
    const result = categoryImportRowSchema.safeParse({
      name: 'Test',
      type: 'savings',
    });
    expect(result.success).toBe(false);
  });

  it('accepts all valid types', () => {
    expect(categoryImportRowSchema.safeParse({ name: 'A', type: 'expense' }).success).toBe(true);
    expect(categoryImportRowSchema.safeParse({ name: 'B', type: 'income' }).success).toBe(true);
    expect(categoryImportRowSchema.safeParse({ name: 'C', type: 'both' }).success).toBe(true);
  });

  it('rejects invalid hex color', () => {
    const result = categoryImportRowSchema.safeParse({
      name: 'Test',
      type: 'expense',
      color: 'red',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid hex color', () => {
    const result = categoryImportRowSchema.safeParse({
      name: 'Test',
      type: 'expense',
      color: '#FF5733',
    });
    expect(result.success).toBe(true);
  });

  it('defaults sort_order to 0', () => {
    const result = categoryImportRowSchema.safeParse({
      name: 'Test',
      type: 'expense',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.sort_order).toBe(0);
    }
  });
});

describe('validateCategoryImportRow', () => {
  it('returns create for new category', () => {
    const existingNames = new Set(['salary']);
    const csvParentNames = new Set<string>();
    const result = validateCategoryImportRow(
      {
        name: 'Transport',
        type: 'expense',
        parent_category: '',
        color: '',
        icon: '',
        sort_order: 0,
      },
      existingNames,
      csvParentNames,
    );
    expect(result.action).toBe('create');
    expect(result.errors).toHaveLength(0);
  });

  it('returns skip for existing category (case-insensitive)', () => {
    const existingNames = new Set(['food & groceries']);
    const csvParentNames = new Set<string>();
    const result = validateCategoryImportRow(
      {
        name: 'Food & Groceries',
        type: 'expense',
        parent_category: '',
        color: '',
        icon: '',
        sort_order: 0,
      },
      existingNames,
      csvParentNames,
    );
    expect(result.action).toBe('skip');
  });

  it('returns error for missing parent', () => {
    const existingNames = new Set<string>();
    const csvParentNames = new Set<string>();
    const result = validateCategoryImportRow(
      {
        name: 'Sub Cat',
        type: 'expense',
        parent_category: 'NonExistent',
        color: '',
        icon: '',
        sort_order: 0,
      },
      existingNames,
      csvParentNames,
    );
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('not found');
  });

  it('resolves parent defined earlier in CSV', () => {
    const existingNames = new Set<string>();
    const csvParentNames = new Set(['food & groceries']);
    const result = validateCategoryImportRow(
      {
        name: 'Household Goods',
        type: 'expense',
        parent_category: 'Food & Groceries',
        color: '',
        icon: '',
        sort_order: 0,
      },
      existingNames,
      csvParentNames,
    );
    expect(result.action).toBe('create');
    expect(result.errors).toHaveLength(0);
  });

  it('resolves parent from existing DB categories', () => {
    const existingNames = new Set(['food & groceries']);
    const csvParentNames = new Set<string>();
    const result = validateCategoryImportRow(
      {
        name: 'New Sub',
        type: 'expense',
        parent_category: 'Food & Groceries',
        color: '',
        icon: '',
        sort_order: 0,
      },
      existingNames,
      csvParentNames,
    );
    expect(result.action).toBe('create');
  });

  it('case-insensitive duplicate detection', () => {
    const existingNames = new Set(['salary']);
    const result = validateCategoryImportRow(
      { name: 'SALARY', type: 'income', parent_category: '', color: '', icon: '', sort_order: 0 },
      existingNames,
      new Set<string>(),
    );
    expect(result.action).toBe('skip');
  });
});
