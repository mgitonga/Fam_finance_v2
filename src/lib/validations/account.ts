import { z } from 'zod';

export const accountTypeEnum = z.enum(['bank', 'mobile_money', 'cash', 'credit_card', 'other']);

export const createAccountSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  type: accountTypeEnum,
  balance: z.number(),
});

export const updateAccountSchema = createAccountSchema.partial();

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
