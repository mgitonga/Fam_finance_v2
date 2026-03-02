import { z } from 'zod';

export const transactionTypeEnum = z.enum(['income', 'expense']);
export const paymentMethodEnum = z.enum(['cash', 'card', 'mobile_money', 'bank_transfer', 'other']);

export const createTransactionSchema = z.object({
  type: transactionTypeEnum,
  amount: z.number().positive('Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  account_id: z.string().uuid('Please select an account'),
  category_id: z.string().uuid('Please select a category'),
  description: z.string().max(500).nullable().optional(),
  merchant: z.string().max(200).nullable().optional(),
  payment_method: paymentMethodEnum.nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  split_with: z.string().uuid().nullable().optional(),
  split_ratio: z.number().min(0).max(1).nullable().optional(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
