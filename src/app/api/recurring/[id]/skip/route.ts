import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/supabase/auth-helpers';
import { getNextDueDate } from '@/lib/validations/recurring';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const supabase = await createClient();

    const { data: rule } = await supabase
      .from('recurring_transactions')
      .select('day_of_month')
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!rule) {
      return NextResponse.json({ error: 'Recurring rule not found' }, { status: 404 });
    }

    // Advance next_due_date without creating a transaction
    const nextDue = getNextDueDate(rule.day_of_month);
    await supabase.from('recurring_transactions').update({ next_due_date: nextDue }).eq('id', id);

    return NextResponse.json({ message: 'Skipped for this month', next_due_date: nextDue });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
