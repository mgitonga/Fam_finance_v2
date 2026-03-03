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
      .select('*, users(name)')
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

    // Get current goal state
    const { data: goal } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 });

    const previousAmount = Number(goal.current_amount);

    // Insert contribution (trigger auto-updates current_amount + is_completed)
    const { data: contribution, error } = await supabase
      .from('goal_contributions')
      .insert({
        goal_id: id,
        user_id: auth.context.userId,
        amount: parsed.data.amount,
        date: parsed.data.date,
        notes: parsed.data.notes || null,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Check for milestone notification
    const newAmount = previousAmount + parsed.data.amount;
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
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
