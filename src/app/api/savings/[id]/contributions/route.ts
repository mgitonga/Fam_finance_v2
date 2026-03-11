import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/supabase/auth-helpers';
import { addContributionSchema, checkGoalMilestone } from '@/lib/validations/savings-debt';
import { createNotification } from '@/lib/notifications';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('goal_contributions')
      .select('*, users(name), accounts(name)')
      .eq('goal_id', id)
      .order('date', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const body = await request.json();
    const parsed = addContributionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { amount, date, account_id, type, notes } = parsed.data;

    // Get current goal state
    const { data: goal } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

    // Verify account belongs to household
    const { data: account } = await supabase
      .from('accounts')
      .select('id, balance, name')
      .eq('id', account_id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 400 });

    const previousAmount = Number(goal.current_amount);

    if (type === 'deposit') {
      // Block deposits on completed goals
      if (goal.is_completed) {
        return NextResponse.json(
          { error: 'Goal has reached its target. No more deposits allowed.' },
          { status: 400 },
        );
      }

      // Overdraft protection
      if (Number(account.balance) < amount) {
        return NextResponse.json(
          {
            error: `Insufficient balance. Account has KES ${Number(account.balance).toLocaleString()} but deposit requires KES ${amount.toLocaleString()}.`,
          },
          { status: 400 },
        );
      }

      // Insert contribution (trigger auto-updates current_amount + is_completed)
      const { data: contribution, error } = await supabase
        .from('goal_contributions')
        .insert({
          goal_id: id,
          user_id: auth.context.userId,
          account_id,
          type: 'deposit',
          amount,
          date,
          notes: notes || null,
        })
        .select()
        .single();

      if (error) return NextResponse.json({ error: error.message }, { status: 500 });

      // Debit account
      await supabase
        .from('accounts')
        .update({ balance: Number(account.balance) - amount })
        .eq('id', account_id);

      // Create transaction audit record
      await supabase.from('transactions').insert({
        household_id: auth.context.householdId,
        user_id: auth.context.userId,
        type: 'expense',
        amount,
        date,
        account_id,
        description: `Savings: ${goal.name}`,
      });

      // Check milestone notifications
      const newAmount = previousAmount + amount;
      const milestone = checkGoalMilestone(newAmount, Number(goal.target_amount), previousAmount);
      if (milestone) {
        await createNotification({
          householdId: auth.context.householdId,
          userId: auth.context.userId,
          type: 'goal_milestone',
          title: `🎯 ${goal.name} — ${milestone}% reached!`,
          message: `You've reached ${milestone}% of your "${goal.name}" savings goal.`,
          actionUrl: '/savings',
        });
      }

      return NextResponse.json({ data: contribution }, { status: 201 });
    }

    // --- Withdrawal flow ---

    // Pot overdraft protection
    if (previousAmount < amount) {
      return NextResponse.json(
        {
          error: `Insufficient goal balance. Goal has KES ${previousAmount.toLocaleString()} but withdrawal requires KES ${amount.toLocaleString()}.`,
        },
        { status: 400 },
      );
    }

    // Insert withdrawal contribution (trigger auto-updates current_amount + is_completed)
    const { data: contribution, error } = await supabase
      .from('goal_contributions')
      .insert({
        goal_id: id,
        user_id: auth.context.userId,
        account_id,
        type: 'withdrawal',
        amount,
        date,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Credit account
    await supabase
      .from('accounts')
      .update({ balance: Number(account.balance) + amount })
      .eq('id', account_id);

    // Create transaction audit record
    await supabase.from('transactions').insert({
      household_id: auth.context.householdId,
      user_id: auth.context.userId,
      type: 'income',
      amount,
      date,
      account_id,
      description: `Savings withdrawal: ${goal.name}`,
    });

    return NextResponse.json({ data: contribution }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
