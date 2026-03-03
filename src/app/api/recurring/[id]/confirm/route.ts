import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/supabase/auth-helpers';
import { getNextDueDate } from '@/lib/validations/recurring';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const supabase = await createClient();

    // Get the recurring rule
    const { data: rule } = await supabase
      .from('recurring_transactions')
      .select('*')
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!rule) {
      return NextResponse.json({ error: 'Recurring rule not found' }, { status: 404 });
    }

    // Allow user to override amount/description
    const body = await request.json().catch(() => ({}));
    const amount = body.amount || rule.amount;
    const description = body.description || rule.description;

    // Create the transaction
    const { data: transaction, error: txnError } = await supabase
      .from('transactions')
      .insert({
        household_id: auth.context.householdId,
        user_id: auth.context.userId,
        type: rule.type,
        amount,
        date: new Date().toISOString().split('T')[0],
        category_id: rule.category_id,
        account_id: rule.account_id,
        description,
        is_recurring: true,
        recurring_id: rule.id,
      })
      .select('*, categories(name, color), accounts(name)')
      .single();

    if (txnError) {
      return NextResponse.json({ error: txnError.message }, { status: 500 });
    }

    // Update account balance
    const { data: account } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', rule.account_id)
      .single();

    if (account) {
      const balanceChange = rule.type === 'income' ? Number(amount) : -Number(amount);
      await supabase
        .from('accounts')
        .update({ balance: Number(account.balance) + balanceChange })
        .eq('id', rule.account_id);
    }

    // Advance next_due_date to next month
    const nextDue = getNextDueDate(rule.day_of_month);
    await supabase.from('recurring_transactions').update({ next_due_date: nextDue }).eq('id', id);

    return NextResponse.json({ data: transaction }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
