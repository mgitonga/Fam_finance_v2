import { describe, it, expect } from 'vitest';
import {
  createAssetSchema,
  updateAssetSchema,
  addValuationSchema,
  disposeAssetSchema,
  assetClassificationEnum,
  assetTypeEnum,
} from '@/lib/validations/asset';

describe('assetClassificationEnum', () => {
  it('accepts valid classifications', () => {
    expect(assetClassificationEnum.safeParse('fixed').success).toBe(true);
    expect(assetClassificationEnum.safeParse('current').success).toBe(true);
  });

  it('rejects invalid classification', () => {
    expect(assetClassificationEnum.safeParse('intangible').success).toBe(false);
    expect(assetClassificationEnum.safeParse('').success).toBe(false);
  });
});

describe('assetTypeEnum', () => {
  it('accepts valid types', () => {
    expect(assetTypeEnum.safeParse('real_estate').success).toBe(true);
    expect(assetTypeEnum.safeParse('vehicle').success).toBe(true);
    expect(assetTypeEnum.safeParse('furniture_equipment').success).toBe(true);
    expect(assetTypeEnum.safeParse('land').success).toBe(true);
    expect(assetTypeEnum.safeParse('investment').success).toBe(true);
    expect(assetTypeEnum.safeParse('money_market').success).toBe(true);
    expect(assetTypeEnum.safeParse('cash_equivalent').success).toBe(true);
    expect(assetTypeEnum.safeParse('inventory').success).toBe(true);
    expect(assetTypeEnum.safeParse('other').success).toBe(true);
  });

  it('rejects invalid type', () => {
    expect(assetTypeEnum.safeParse('crypto').success).toBe(false);
    expect(assetTypeEnum.safeParse('').success).toBe(false);
  });
});

describe('createAssetSchema', () => {
  const validAsset = {
    name: 'Kilimani Apartment',
    classification: 'fixed',
    type: 'real_estate',
    purchase_price: 15000000,
    current_value: 18000000,
    purchase_date: '2020-06-15',
    description: '3BR apartment in Kilimani',
  };

  it('accepts valid fixed asset data', () => {
    const result = createAssetSchema.safeParse(validAsset);
    expect(result.success).toBe(true);
  });

  it('accepts valid current asset data', () => {
    const result = createAssetSchema.safeParse({
      ...validAsset,
      name: 'Treasury Bills',
      classification: 'current',
      type: 'investment',
      purchase_price: 500000,
      current_value: 520000,
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createAssetSchema.safeParse({ ...validAsset, name: '' });
    expect(result.success).toBe(false);
  });

  it('rejects name over 100 characters', () => {
    const result = createAssetSchema.safeParse({ ...validAsset, name: 'A'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('rejects negative purchase price', () => {
    const result = createAssetSchema.safeParse({ ...validAsset, purchase_price: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects negative current value', () => {
    const result = createAssetSchema.safeParse({ ...validAsset, current_value: -100 });
    expect(result.success).toBe(false);
  });

  it('accepts zero values for price and value', () => {
    const result = createAssetSchema.safeParse({
      ...validAsset,
      purchase_price: 0,
      current_value: 0,
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing purchase date', () => {
    const result = createAssetSchema.safeParse({ ...validAsset, purchase_date: '' });
    expect(result.success).toBe(false);
  });

  it('accepts null description', () => {
    const result = createAssetSchema.safeParse({ ...validAsset, description: null });
    expect(result.success).toBe(true);
  });

  // Classification-type mapping tests
  it('rejects real_estate type with current classification', () => {
    const result = createAssetSchema.safeParse({
      ...validAsset,
      classification: 'current',
      type: 'real_estate',
    });
    expect(result.success).toBe(false);
  });

  it('rejects vehicle type with current classification', () => {
    const result = createAssetSchema.safeParse({
      ...validAsset,
      classification: 'current',
      type: 'vehicle',
    });
    expect(result.success).toBe(false);
  });

  it('rejects investment type with fixed classification', () => {
    const result = createAssetSchema.safeParse({
      ...validAsset,
      classification: 'fixed',
      type: 'investment',
    });
    expect(result.success).toBe(false);
  });

  it('rejects money_market type with fixed classification', () => {
    const result = createAssetSchema.safeParse({
      ...validAsset,
      classification: 'fixed',
      type: 'money_market',
    });
    expect(result.success).toBe(false);
  });

  it('accepts other type with fixed classification', () => {
    const result = createAssetSchema.safeParse({
      ...validAsset,
      classification: 'fixed',
      type: 'other',
    });
    expect(result.success).toBe(true);
  });

  it('accepts other type with current classification', () => {
    const result = createAssetSchema.safeParse({
      ...validAsset,
      classification: 'current',
      type: 'other',
    });
    expect(result.success).toBe(true);
  });

  it('accepts land type with fixed classification', () => {
    const result = createAssetSchema.safeParse({
      ...validAsset,
      classification: 'fixed',
      type: 'land',
    });
    expect(result.success).toBe(true);
  });

  it('rejects land type with current classification', () => {
    const result = createAssetSchema.safeParse({
      ...validAsset,
      classification: 'current',
      type: 'land',
    });
    expect(result.success).toBe(false);
  });
});

describe('updateAssetSchema', () => {
  it('accepts partial updates', () => {
    const result = updateAssetSchema.safeParse({ name: 'Updated Name' });
    expect(result.success).toBe(true);
  });

  it('accepts empty object', () => {
    const result = updateAssetSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('rejects invalid type in partial', () => {
    const result = updateAssetSchema.safeParse({ type: 'invalid' });
    expect(result.success).toBe(false);
  });

  it('validates classification-type mapping when both provided', () => {
    const result = updateAssetSchema.safeParse({
      classification: 'current',
      type: 'real_estate',
    });
    expect(result.success).toBe(false);
  });

  it('allows type without classification (no cross-validation)', () => {
    const result = updateAssetSchema.safeParse({ type: 'real_estate' });
    expect(result.success).toBe(true);
  });
});

describe('addValuationSchema', () => {
  it('accepts valid valuation data', () => {
    const result = addValuationSchema.safeParse({
      value: 20000000,
      date: '2024-01-15',
      notes: 'Annual revaluation',
    });
    expect(result.success).toBe(true);
  });

  it('accepts zero value', () => {
    const result = addValuationSchema.safeParse({
      value: 0,
      date: '2024-01-15',
    });
    expect(result.success).toBe(true);
  });

  it('rejects negative value', () => {
    const result = addValuationSchema.safeParse({
      value: -100,
      date: '2024-01-15',
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing date', () => {
    const result = addValuationSchema.safeParse({
      value: 1000000,
      date: '',
    });
    expect(result.success).toBe(false);
  });

  it('accepts null notes', () => {
    const result = addValuationSchema.safeParse({
      value: 1000000,
      date: '2024-01-15',
      notes: null,
    });
    expect(result.success).toBe(true);
  });
});

describe('disposeAssetSchema', () => {
  const validDisposal = {
    disposal_amount: 16000000,
    account_id: '550e8400-e29b-41d4-a716-446655440000',
    date: '2024-06-01',
    description: 'Sold apartment',
  };

  it('accepts valid disposal data', () => {
    const result = disposeAssetSchema.safeParse(validDisposal);
    expect(result.success).toBe(true);
  });

  it('accepts zero disposal amount', () => {
    const result = disposeAssetSchema.safeParse({ ...validDisposal, disposal_amount: 0 });
    expect(result.success).toBe(true);
  });

  it('rejects negative disposal amount', () => {
    const result = disposeAssetSchema.safeParse({ ...validDisposal, disposal_amount: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects invalid account_id', () => {
    const result = disposeAssetSchema.safeParse({ ...validDisposal, account_id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects missing date', () => {
    const result = disposeAssetSchema.safeParse({ ...validDisposal, date: '' });
    expect(result.success).toBe(false);
  });

  it('accepts null description', () => {
    const result = disposeAssetSchema.safeParse({ ...validDisposal, description: null });
    expect(result.success).toBe(true);
  });
});
