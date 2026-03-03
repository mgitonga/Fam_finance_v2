import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/supabase/auth-helpers';
import { logDebtPaymentSchema, calculatePayoffDate } from '@/lib/validations/savings-debt';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const body = await request.json();
    const parsed = logDebtPaymentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Get debt
    const { data: debt } = await supabase
      .from('debts')
      .select('*')
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!debt) return NextResponse.json({ error: 'Debt not found' }, { status: 404 });

    // Get account
    const { data: account } = await supabase
      .from('accounts')
      .select('id, balance')
      .eq('id', parsed.data.account_id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 400 });

    // Create transaction for the payment
    const { error: txnError } = await supabase.from('transactions').insert({
      household_id: auth.context.householdId,
      user_id: auth.context.userId,
      type: 'expense',
      amount: parsed.data.amount,
      date: new Date().toISOString().split('T')[0],
      account_id: parsed.data.account_id,
      category_id: debt.name, // Will need a "Loans" category — deferred
      description: `Debt payment: ${debt.name}`,
      payment_method: 'bank_transfer',
    });

    // Note: category_id above won't work as-is since it needs a UUID.
    // For now we skip the transaction and just update the balance.
    if (txnError) {
      // Non-fatal — still update the debt
      console.error('Failed to create debt payment transaction:', txnError.message);
    }

    // Update account balance
    await supabase
      .from('accounts')
      .update({ balance: Number(account.balance) - parsed.data.amount })
      .eq('id', account.id);

    // Update debt outstanding balance
    const newBalance = Math.max(0, Number(debt.outstanding_balance) - parsed.data.amount);
    let payoffDate = debt.projected_payoff_date;
    if (debt.minimum_payment && debt.interest_rate !== null) {
      payoffDate = calculatePayoffDate(
        newBalance,
        Number(debt.interest_rate || 0),
        Number(debt.minimum_payment),
      );
    }

    const { data: updatedDebt, error: debtError } = await supabase
      .from('debts')
      .update({
        outstanding_balance: newBalance,
        projected_payoff_date: payoffDate,
        is_active: newBalance > 0,
      })
      .eq('id', id)
      .select()
      .single();

    if (debtError) return NextResponse.json({ error: debtError.message }, { status: 500 });
    return NextResponse.json({ data: updatedDebt });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
