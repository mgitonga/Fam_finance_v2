import { createAdminClient } from '@/lib/supabase/admin';

type NotificationType =
  | 'bill_reminder'
  | 'budget_warning'
  | 'budget_exceeded'
  | 'goal_milestone'
  | 'recurring_due'
  | 'system'
  | 'debt_reminder'
  | 'debt_payoff';

interface CreateNotificationParams {
  householdId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  actionUrl?: string;
}

/**
 * Create an in-app notification for a user.
 * Uses admin client to bypass RLS.
 */
export async function createNotification(params: CreateNotificationParams) {
  const supabase = createAdminClient();

  const { error } = await supabase.from('notifications').insert({
    household_id: params.householdId,
    user_id: params.userId,
    type: params.type,
    title: params.title,
    message: params.message,
    action_url: params.actionUrl || null,
  });

  if (error) {
    console.error('Failed to create notification:', error.message);
  }
}

/**
 * Create budget warning/exceeded notifications for all household members.
 */
export async function createBudgetNotifications(
  householdId: string,
  categoryName: string,
  spent: number,
  budget: number,
  threshold: 'warning' | 'exceeded',
) {
  const supabase = createAdminClient();

  // Get all household members
  const { data: users } = await supabase.from('users').select('id').eq('household_id', householdId);

  if (!users || users.length === 0) return;

  const title =
    threshold === 'exceeded'
      ? `🔴 Budget Exceeded: ${categoryName}`
      : `⚠️ Budget Warning: ${categoryName}`;

  const percentage = Math.round((spent / budget) * 100);
  const message =
    threshold === 'exceeded'
      ? `You've exceeded your ${categoryName} budget by KES ${(spent - budget).toLocaleString()}. Budget: KES ${budget.toLocaleString()}, Spent: KES ${spent.toLocaleString()}.`
      : `You've used ${percentage}% of your ${categoryName} budget (KES ${spent.toLocaleString()} of KES ${budget.toLocaleString()}).`;

  const notifications = users.map((user) => ({
    household_id: householdId,
    user_id: user.id,
    type: (threshold === 'exceeded' ? 'budget_exceeded' : 'budget_warning') as NotificationType,
    title,
    message,
    action_url: '/budgets',
  }));

  const { error } = await supabase.from('notifications').insert(notifications);

  if (error) {
    console.error('Failed to create budget notifications:', error.message);
  }
}

/**
 * Create debt payment reminder notifications for all household members.
 */
export async function createDebtReminderNotification(
  householdId: string,
  debtName: string,
  amount: number,
  daysUntil: number,
) {
  const supabase = createAdminClient();

  const { data: users } = await supabase.from('users').select('id').eq('household_id', householdId);
  if (!users || users.length === 0) return;

  const title = `🔔 Debt Payment Due Soon: ${debtName}`;
  const message =
    daysUntil === 0
      ? `Your ${debtName} payment of KES ${amount.toLocaleString()} is due today.`
      : `Your ${debtName} payment of KES ${amount.toLocaleString()} is due in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}.`;

  const notifications = users.map((user) => ({
    household_id: householdId,
    user_id: user.id,
    type: 'debt_reminder' as NotificationType,
    title,
    message,
    action_url: '/debts',
  }));

  const { error } = await supabase.from('notifications').insert(notifications);
  if (error) {
    console.error('Failed to create debt reminder notifications:', error.message);
  }
}

/**
 * Create debt payoff celebration notifications for all household members.
 */
export async function createDebtPayoffNotification(householdId: string, debtName: string) {
  const supabase = createAdminClient();

  const { data: users } = await supabase.from('users').select('id').eq('household_id', householdId);
  if (!users || users.length === 0) return;

  const title = `🎉 Debt Paid Off: ${debtName}`;
  const message = `Congratulations! You've completely paid off "${debtName}". Keep up the great work!`;

  const notifications = users.map((user) => ({
    household_id: householdId,
    user_id: user.id,
    type: 'debt_payoff' as NotificationType,
    title,
    message,
    action_url: '/debts',
  }));

  const { error } = await supabase.from('notifications').insert(notifications);
  if (error) {
    console.error('Failed to create debt payoff notifications:', error.message);
  }
}
