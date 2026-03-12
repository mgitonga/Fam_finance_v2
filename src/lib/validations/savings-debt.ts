import { z } from 'zod';

// ---- Savings Goals ----

export const createSavingsGoalSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  target_amount: z.number().positive('Target amount must be greater than 0'),
  target_date: z.string().min(1, 'Target date is required'),
  icon: z.string().max(50).nullable().optional(),
  color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color')
    .nullable()
    .optional(),
});

export const updateSavingsGoalSchema = createSavingsGoalSchema.partial();

export const contributionTypeEnum = z.enum(['deposit', 'withdrawal']);

export const addContributionSchema = z.object({
  amount: z.number().positive('Amount must be greater than 0'),
  date: z.string().min(1, 'Date is required'),
  account_id: z.string().uuid('Please select an account'),
  type: contributionTypeEnum,
  notes: z.string().max(500).nullable().optional(),
});

export type CreateSavingsGoalInput = z.infer<typeof createSavingsGoalSchema>;
export type UpdateSavingsGoalInput = z.infer<typeof updateSavingsGoalSchema>;
export type AddContributionInput = z.infer<typeof addContributionSchema>;

// ---- Debts ----

export const debtTypeEnum = z.enum([
  'mortgage',
  'car_loan',
  'personal_loan',
  'credit_card',
  'student_loan',
  'other',
]);

export const createDebtSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  type: debtTypeEnum,
  original_amount: z.number().positive('Original amount must be greater than 0'),
  outstanding_balance: z.number().min(0, 'Balance cannot be negative'),
  interest_rate: z.number().min(0).max(100).nullable().optional(),
  minimum_payment: z.number().positive().nullable().optional(),
  payment_day: z.number().int().min(1).max(31).nullable().optional(),
  start_date: z.string().min(1, 'Start date is required'),
});

export const updateDebtSchema = createDebtSchema.partial();

export const logDebtPaymentSchema = z.object({
  amount: z.number().positive('Payment amount must be greater than 0'),
  account_id: z.string().uuid('Please select an account'),
  category_id: z.string().uuid().optional(),
  date: z.string().optional(),
  description: z.string().max(500).optional(),
  payment_method: z.enum(['cash', 'card', 'mobile_money', 'bank_transfer', 'other']).optional(),
});

export type CreateDebtInput = z.infer<typeof createDebtSchema>;
export type UpdateDebtInput = z.infer<typeof updateDebtSchema>;
export type LogDebtPaymentInput = z.infer<typeof logDebtPaymentSchema>;

// ---- Utility Functions ----

/**
 * Calculate the required monthly contribution to reach a savings goal on time.
 */
export function calculateRequiredMonthly(
  targetAmount: number,
  currentAmount: number,
  targetDate: string,
): number {
  const remaining = targetAmount - currentAmount;
  if (remaining <= 0) return 0;

  const now = new Date();
  const target = new Date(targetDate);
  const monthsLeft =
    (target.getFullYear() - now.getFullYear()) * 12 + (target.getMonth() - now.getMonth());

  if (monthsLeft <= 0) return remaining; // Past due — full amount needed
  return Math.ceil(remaining / monthsLeft);
}

/**
 * Check if a savings goal has reached a milestone (25%, 50%, 75%, 100%).
 * Returns the milestone percentage or null.
 */
export function checkGoalMilestone(
  currentAmount: number,
  targetAmount: number,
  previousAmount: number,
): 25 | 50 | 75 | 100 | null {
  if (targetAmount <= 0) return null;

  const prevPct = (previousAmount / targetAmount) * 100;
  const currPct = (currentAmount / targetAmount) * 100;

  // Check each milestone in descending order
  if (currPct >= 100 && prevPct < 100) return 100;
  if (currPct >= 75 && prevPct < 75) return 75;
  if (currPct >= 50 && prevPct < 50) return 50;
  if (currPct >= 25 && prevPct < 25) return 25;

  return null;
}

/**
 * Calculate projected payoff date for a debt based on minimum payment and interest.
 * Uses simple amortization: each month, interest accrues and payment is applied.
 * Returns ISO date string or null if cannot be paid off (payment < interest).
 */
export function calculatePayoffDate(
  outstandingBalance: number,
  annualInterestRate: number,
  monthlyPayment: number,
): string | null {
  if (outstandingBalance <= 0) return new Date().toISOString().split('T')[0];
  if (monthlyPayment <= 0) return null;

  const monthlyRate = annualInterestRate / 100 / 12;
  let balance = outstandingBalance;
  let months = 0;
  const maxMonths = 360; // 30 year cap

  while (balance > 0 && months < maxMonths) {
    const interest = balance * monthlyRate;
    if (monthlyPayment <= interest) return null; // Can never pay off
    balance = balance + interest - monthlyPayment;
    months++;
  }

  if (balance > 0) return null;

  const payoffDate = new Date();
  payoffDate.setMonth(payoffDate.getMonth() + months);
  return payoffDate.toISOString().split('T')[0];
}
