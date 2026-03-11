export const APP_NAME = 'FamFin';
export const APP_DESCRIPTION = 'Family Budget & Finance Tracking';
export const DEFAULT_CURRENCY = 'KES';
export const ITEMS_PER_PAGE = 20;

export const ACCOUNT_TYPES = [
  { value: 'bank', label: 'Bank' },
  { value: 'mobile_money', label: 'Mobile Money (M-Pesa)' },
  { value: 'cash', label: 'Cash' },
  { value: 'credit_card', label: 'Credit Card' },
  { value: 'other', label: 'Other' },
] as const;

export const PAYMENT_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' },
  { value: 'mobile_money', label: 'Mobile Money' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'other', label: 'Other' },
] as const;

export const TRANSACTION_TYPES = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' },
  { value: 'adjustment', label: 'Adjustment' },
] as const;

export const BUDGET_THRESHOLDS = {
  GREEN_MAX: 70,
  AMBER_MAX: 90,
  WARNING_THRESHOLD: 80,
  EXCEEDED_THRESHOLD: 100,
} as const;

export const NOTIFICATION_TYPES = [
  'bill_reminder',
  'budget_warning',
  'budget_exceeded',
  'goal_milestone',
  'recurring_due',
  'system',
] as const;
