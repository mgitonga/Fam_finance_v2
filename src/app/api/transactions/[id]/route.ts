import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/supabase/auth-helpers';
import { updateTransactionSchema } from '@/lib/validations/transaction';
import { calculatePayoffDate } from '@/lib/validations/savings-debt';
import { createDebtPayoffNotification } from '@/lib/notifications';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(name, color), accounts(name)')
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const supabase = await createClient();

    // Get existing transaction
    const { data: existing } = await supabase
      .from('transactions')
      .select('*, accounts(balance)')
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Permission check: own transaction or admin
    if (existing.user_id !== auth.context.userId && auth.context.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Reverse old balance impact
    const oldBalanceChange = existing.type === 'income' ? -existing.amount : existing.amount;

    // Calculate new balance impact
    const newType = parsed.data.type || existing.type;
    const newAmount = parsed.data.amount || existing.amount;
    const newBalanceChange = newType === 'income' ? newAmount : -newAmount;

    // Update transaction
    const { data, error } = await supabase
      .from('transactions')
      .update(parsed.data)
      .eq('id', id)
      .select('*, categories(name, color), accounts(name)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update account balance (reverse old + apply new)
    const accountId = parsed.data.account_id || existing.account_id;
    const { data: account } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    if (account) {
      await supabase
        .from('accounts')
        .update({ balance: account.balance + oldBalanceChange + newBalanceChange })
        .eq('id', accountId);
    }

    // Handle debt balance adjustments
    const oldDebtId = existing.debt_id;
    const newDebtId = parsed.data.debt_id !== undefined ? parsed.data.debt_id : oldDebtId;

    // If debt link is being removed, restore amount to old debt
    if (oldDebtId && !newDebtId) {
      await adjustDebtBalance(
        supabase,
        oldDebtId,
        existing.amount,
        'restore',
        auth.context.householdId,
      );
    }
    // If debt link is being added to a new debt
    else if (!oldDebtId && newDebtId) {
      await adjustDebtBalance(supabase, newDebtId, -newAmount, 'reduce', auth.context.householdId);
    }
    // If debt link is changing to a different debt
    else if (oldDebtId && newDebtId && oldDebtId !== newDebtId) {
      await adjustDebtBalance(
        supabase,
        oldDebtId,
        existing.amount,
        'restore',
        auth.context.householdId,
      );
      await adjustDebtBalance(supabase, newDebtId, -newAmount, 'reduce', auth.context.householdId);
    }
    // If same debt but amount changed
    else if (oldDebtId && newDebtId && oldDebtId === newDebtId) {
      const delta = existing.amount - newAmount; // positive means reduced payment, negative means increased payment
      if (delta !== 0) {
        await adjustDebtBalance(supabase, oldDebtId, delta, 'adjust', auth.context.householdId);
      }
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const supabase = await createClient();

    // Get existing transaction
    const { data: existing } = await supabase
      .from('transactions')
      .select('*, accounts(balance)')
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Permission check: own transaction or admin
    if (existing.user_id !== auth.context.userId && auth.context.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Delete transaction
    const { error } = await supabase.from('transactions').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Reverse balance impact
    const balanceRevert = existing.type === 'income' ? -existing.amount : existing.amount;
    const { data: account } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', existing.account_id)
      .single();

    if (account) {
      await supabase
        .from('accounts')
        .update({ balance: account.balance + balanceRevert })
        .eq('id', existing.account_id);
    }

    // If the deleted transaction was linked to a debt, restore the amount
    if (existing.debt_id) {
      await adjustDebtBalance(
        supabase,
        existing.debt_id,
        existing.amount,
        'restore',
        auth.context.householdId,
      );
    }

    return NextResponse.json({ message: 'Transaction deleted' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Helper to adjust a debt's outstanding balance when a linked transaction is modified or deleted.
 * - 'restore': adds amount back (delete / unlink)
 * - 'reduce': subtracts amount (new link)
 * - 'adjust': adds delta (edit — positive delta means payment decreased so balance goes up)
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function adjustDebtBalance(
  supabase: any,
  debtId: string,
  amount: number,
  _action: 'restore' | 'reduce' | 'adjust',
  householdId: string,
) {
  const { data: debt } = await supabase.from('debts').select('*').eq('id', debtId).single();

  if (!debt) return;

  const newBalance = Math.max(0, Number(debt.outstanding_balance) + amount);
  let payoffDate = debt.projected_payoff_date;
  if (debt.minimum_payment && debt.interest_rate !== null) {
    payoffDate = calculatePayoffDate(
      newBalance,
      Number(debt.interest_rate || 0),
      Number(debt.minimum_payment),
    );
  }

  const isPayoff = newBalance <= 0;
  const wasInactive = !debt.is_active;

  await supabase
    .from('debts')
    .update({
      outstanding_balance: newBalance,
      projected_payoff_date: payoffDate,
      is_active: !isPayoff,
    })
    .eq('id', debtId);

  // If debt just got paid off, send notification
  if (isPayoff && !wasInactive) {
    await createDebtPayoffNotification(householdId, debt.name);
  }
}
