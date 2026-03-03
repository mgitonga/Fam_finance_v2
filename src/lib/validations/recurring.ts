import { z } from 'zod';

export const createRecurringSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be greater than 0'),
  category_id: z.string().uuid('Please select a category'),
  account_id: z.string().uuid('Please select an account'),
  day_of_month: z.number().int().min(1).max(31),
  description: z.string().min(1, 'Description is required').max(200),
});

export const updateRecurringSchema = createRecurringSchema.partial();

export type CreateRecurringInput = z.infer<typeof createRecurringSchema>;
export type UpdateRecurringInput = z.infer<typeof updateRecurringSchema>;

export const createBillReminderSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  amount: z.number().positive().nullable().optional(),
  due_day: z.number().int().min(1).max(31),
  category_id: z.string().uuid().nullable().optional(),
  reminder_days_before: z.number().int().min(1).max(30),
  notification_method: z.enum(['in_app', 'email', 'both']),
});

export const updateBillReminderSchema = createBillReminderSchema.partial();

export type CreateBillReminderInput = z.infer<typeof createBillReminderSchema>;
export type UpdateBillReminderInput = z.infer<typeof updateBillReminderSchema>;

/**
 * Calculate the next due date for a recurring transaction.
 */
export function getNextDueDate(dayOfMonth: number, fromDate?: Date): string {
  const now = fromDate || new Date();
  const currentDay = now.getDate();
  let month = now.getMonth();
  let year = now.getFullYear();

  if (currentDay >= dayOfMonth) {
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  // Clamp day to last day of month
  const lastDay = new Date(year, month + 1, 0).getDate();
  const day = Math.min(dayOfMonth, lastDay);

  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

/**
 * Check if a bill reminder should fire based on days before due.
 */
export function shouldSendReminder(
  dueDay: number,
  reminderDaysBefore: number,
  today?: Date,
): boolean {
  const now = today || new Date();
  const currentDay = now.getDate();
  const daysUntilDue = dueDay >= currentDay ? dueDay - currentDay : 0;
  return daysUntilDue === reminderDaysBefore;
}

/**
 * Get days remaining until a bill is due this month.
 */
export function getDaysUntilDue(dueDay: number, today?: Date): number {
  const now = today || new Date();
  const currentDay = now.getDate();
  if (dueDay >= currentDay) {
    return dueDay - currentDay;
  }
  // Due day has passed this month — calculate to next month
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - currentDay + dueDay;
}
