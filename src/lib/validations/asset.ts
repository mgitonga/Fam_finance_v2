import { z } from 'zod';

export const assetClassificationEnum = z.enum(['fixed', 'current']);
export const assetTypeEnum = z.enum([
  'real_estate',
  'vehicle',
  'furniture_equipment',
  'land',
  'investment',
  'money_market',
  'cash_equivalent',
  'inventory',
  'other',
]);

const FIXED_TYPES = ['real_estate', 'vehicle', 'furniture_equipment', 'land', 'other'] as const;
const CURRENT_TYPES = [
  'investment',
  'money_market',
  'cash_equivalent',
  'inventory',
  'other',
] as const;

export const CLASSIFICATION_TYPE_MAP = {
  fixed: FIXED_TYPES,
  current: CURRENT_TYPES,
} as const;

const assetBaseSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  classification: assetClassificationEnum,
  type: assetTypeEnum,
  purchase_price: z.number().min(0, 'Purchase price must be 0 or greater'),
  current_value: z.number().min(0, 'Current value must be 0 or greater'),
  purchase_date: z.string().min(1, 'Purchase date is required'),
  description: z.string().nullable().optional(),
});

export const createAssetSchema = assetBaseSchema.superRefine((data, ctx) => {
  const validTypes = CLASSIFICATION_TYPE_MAP[data.classification] as readonly string[];
  if (!validTypes.includes(data.type)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Type "${data.type}" is not valid for classification "${data.classification}"`,
      path: ['type'],
    });
  }
});

export const updateAssetSchema = assetBaseSchema.partial().superRefine((data, ctx) => {
  if (data.classification && data.type) {
    const validTypes = CLASSIFICATION_TYPE_MAP[data.classification] as readonly string[];
    if (!validTypes.includes(data.type)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Type "${data.type}" is not valid for classification "${data.classification}"`,
        path: ['type'],
      });
    }
  }
});

export const addValuationSchema = z.object({
  value: z.number().min(0, 'Value must be 0 or greater'),
  date: z.string().min(1, 'Date is required'),
  notes: z.string().nullable().optional(),
});

export const disposeAssetSchema = z.object({
  disposal_amount: z.number().min(0, 'Disposal amount must be 0 or greater'),
  account_id: z.string().uuid('Valid account is required'),
  date: z.string().min(1, 'Date is required'),
  description: z.string().nullable().optional(),
});

export type CreateAssetInput = z.infer<typeof createAssetSchema>;
export type UpdateAssetInput = z.infer<typeof updateAssetSchema>;
export type AddValuationInput = z.infer<typeof addValuationSchema>;
export type DisposeAssetInput = z.infer<typeof disposeAssetSchema>;

export const ASSET_TYPE_LABELS: Record<string, string> = {
  real_estate: 'Real Estate',
  vehicle: 'Vehicle',
  furniture_equipment: 'Furniture & Equipment',
  land: 'Land',
  investment: 'Investment',
  money_market: 'Money Market',
  cash_equivalent: 'Cash Equivalent',
  inventory: 'Inventory',
  other: 'Other',
};

export const ASSET_CLASSIFICATION_LABELS: Record<string, string> = {
  fixed: 'Fixed Asset',
  current: 'Current Asset',
};
