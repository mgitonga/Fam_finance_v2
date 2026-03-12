import { z } from 'zod';

export const transactionTypeEnum = z.enum(['income', 'expense', 'transfer', 'adjustment']);
export const paymentMethodEnum = z.enum(['cash', 'card', 'mobile_money', 'bank_transfer', 'other']);

const transactionBaseSchema = z.object({
  type: transactionTypeEnum,
  amount: z.number().positive('Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  account_id: z.string().uuid('Please select an account'),
  category_id: z.string().uuid('Please select a category').nullable().optional(),
  to_account_id: z.string().uuid('Please select a destination account').nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  merchant: z.string().max(200).nullable().optional(),
  payment_method: paymentMethodEnum.nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  notes: z.string().max(1000).nullable().optional(),
  split_with: z.string().uuid().nullable().optional(),
  split_ratio: z.number().min(0).max(1).nullable().optional(),
  debt_id: z.string().uuid().nullable().optional(),
});

function transactionRefinement(data: z.infer<typeof transactionBaseSchema>, ctx: z.RefinementCtx) {
  // Transfers require to_account_id and it must differ from account_id
  if (data.type === 'transfer') {
    if (!data.to_account_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Destination account is required for transfers',
        path: ['to_account_id'],
      });
    } else if (data.to_account_id === data.account_id) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Source and destination accounts must be different',
        path: ['to_account_id'],
      });
    }
  }
  // Non-transfers must not have to_account_id
  if (data.type !== 'transfer' && data.to_account_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Destination account is only valid for transfers',
      path: ['to_account_id'],
    });
  }
  // Income/expense require a category
  if ((data.type === 'income' || data.type === 'expense') && !data.category_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Please select a category',
      path: ['category_id'],
    });
  }
}

export const createTransactionSchema = transactionBaseSchema.superRefine(transactionRefinement);

export const updateTransactionSchema = transactionBaseSchema.partial();

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>;
export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>;
