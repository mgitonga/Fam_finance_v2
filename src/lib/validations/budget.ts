import { z } from 'zod';

export const createBudgetSchema = z.object({
  category_id: z.string().uuid('Please select a category'),
  amount: z.number().positive('Budget amount must be greater than 0'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

export const updateBudgetSchema = z.object({
  amount: z.number().positive('Budget amount must be greater than 0'),
});

export const createOverallBudgetSchema = z.object({
  amount: z.number().positive('Budget amount must be greater than 0'),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2020).max(2100),
});

export const copyBudgetSchema = z.object({
  from_month: z.number().int().min(1).max(12),
  from_year: z.number().int().min(2020).max(2100),
  to_month: z.number().int().min(1).max(12),
  to_year: z.number().int().min(2020).max(2100),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type CreateOverallBudgetInput = z.infer<typeof createOverallBudgetSchema>;
export type CopyBudgetInput = z.infer<typeof copyBudgetSchema>;

/**
 * Calculate budget progress percentage and threshold color.
 */
export function getBudgetStatus(spent: number, budget: number) {
  if (budget <= 0) return { percentage: 0, color: 'green' as const, status: 'under' as const };

  const percentage = Math.min((spent / budget) * 100, 100);

  if (percentage >= 90) return { percentage, color: 'red' as const, status: 'exceeded' as const };
  if (percentage >= 70) return { percentage, color: 'amber' as const, status: 'warning' as const };
  return { percentage, color: 'green' as const, status: 'under' as const };
}

/**
 * Check if a budget threshold has been crossed.
 * Returns the threshold that was crossed, or null.
 */
export function checkBudgetThreshold(spent: number, budget: number): 'warning' | 'exceeded' | null {
  if (budget <= 0) return null;
  const percentage = (spent / budget) * 100;
  if (percentage >= 100) return 'exceeded';
  if (percentage >= 80) return 'warning';
  return null;
}
