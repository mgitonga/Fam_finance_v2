import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/supabase/auth-helpers';
import { updateTransactionSchema } from '@/lib/validations/transaction';
import { calculatePayoffDate } from '@/lib/validations/savings-debt';
import { createDebtPayoffNotification } from '@/lib/notifications';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(name, color, icon), accounts!transactions_account_id_fkey(name)')
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
    const newType = parsed.data.type || existing.type;
    const newAmount = parsed.data.amount || existing.amount;
    const newAccountId = parsed.data.account_id || existing.account_id;
    const newToAccountId =
      parsed.data.to_account_id !== undefined ? parsed.data.to_account_id : existing.to_account_id;

    // Get the current account balance for overdraft check
    const { data: account } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', newAccountId)
      .single();

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 400 });
    }

    // Compute projected balance after reversing old and applying new
    let projectedBalance = Number(account.balance);

    // Reverse old impact on this account (if same account)
    if (existing.account_id === newAccountId) {
      if (existing.type === 'income') {
        projectedBalance -= existing.amount;
      } else if (existing.type === 'expense' || existing.type === 'transfer') {
        projectedBalance += existing.amount;
      }
    }

    // Apply new impact
    if (newType === 'expense' || newType === 'transfer') {
      projectedBalance -= newAmount;
    } else if (newType === 'income') {
      projectedBalance += newAmount;
    }

    // Overdraft protection
    if (projectedBalance < 0) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Account has KES ${Number(account.balance).toLocaleString()} but transaction requires KES ${newAmount.toLocaleString()}.`,
        },
        { status: 400 },
      );
    }

    // For transfers, verify destination account
    if (newType === 'transfer' && newToAccountId) {
      const { data: destAccount } = await supabase
        .from('accounts')
        .select('id, balance')
        .eq('id', newToAccountId)
        .single();

      if (!destAccount) {
        return NextResponse.json({ error: 'Destination account not found' }, { status: 400 });
      }
    }

    // Update transaction
    const { data, error } = await supabase
      .from('transactions')
      .update(parsed.data)
      .eq('id', id)
      .select('*, categories(name, color, icon), accounts!transactions_account_id_fkey(name)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Reverse old balance impacts
    if (existing.type === 'transfer') {
      // Reverse source debit
      const { data: oldSrcAccount } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', existing.account_id)
        .single();
      if (oldSrcAccount) {
        await supabase
          .from('accounts')
          .update({ balance: Number(oldSrcAccount.balance) + existing.amount })
          .eq('id', existing.account_id);
      }
      // Reverse destination credit
      if (existing.to_account_id) {
        const { data: oldDestAccount } = await supabase
          .from('accounts')
          .select('balance')
          .eq('id', existing.to_account_id)
          .single();
        if (oldDestAccount) {
          await supabase
            .from('accounts')
            .update({ balance: Number(oldDestAccount.balance) - existing.amount })
            .eq('id', existing.to_account_id);
        }
      }
    } else if (existing.type !== 'adjustment') {
      const oldBalanceChange = existing.type === 'income' ? -existing.amount : existing.amount;
      const { data: oldAccount } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', existing.account_id)
        .single();
      if (oldAccount) {
        await supabase
          .from('accounts')
          .update({ balance: Number(oldAccount.balance) + oldBalanceChange })
          .eq('id', existing.account_id);
      }
    }

    // Apply new balance impacts
    if (newType === 'transfer') {
      const { data: srcAccount } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', newAccountId)
        .single();
      if (srcAccount) {
        await supabase
          .from('accounts')
          .update({ balance: Number(srcAccount.balance) - newAmount })
          .eq('id', newAccountId);
      }
      if (newToAccountId) {
        const { data: destAccount } = await supabase
          .from('accounts')
          .select('balance')
          .eq('id', newToAccountId)
          .single();
        if (destAccount) {
          await supabase
            .from('accounts')
            .update({ balance: Number(destAccount.balance) + newAmount })
            .eq('id', newToAccountId);
        }
      }
    } else if (newType !== 'adjustment') {
      const newBalanceChange = newType === 'income' ? newAmount : -newAmount;
      const { data: newAccount } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', newAccountId)
        .single();
      if (newAccount) {
        await supabase
          .from('accounts')
          .update({ balance: Number(newAccount.balance) + newBalanceChange })
          .eq('id', newAccountId);
      }
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
      .select('*, accounts!transactions_account_id_fkey(balance)')
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

    // Overdraft protection: deleting income reduces balance
    if (existing.type === 'income') {
      const currentBalance = Number(
        existing.accounts ? (existing.accounts as { balance: number }).balance : 0,
      );
      if (currentBalance - existing.amount < 0) {
        return NextResponse.json(
          {
            error: `Insufficient balance. Account has KES ${currentBalance.toLocaleString()} but reversing this income requires KES ${existing.amount.toLocaleString()}.`,
          },
          { status: 400 },
        );
      }
    }

    // Delete transaction
    const { error } = await supabase.from('transactions').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Reverse balance impact
    if (existing.type === 'transfer') {
      // Restore source balance (add back), reduce destination balance (subtract)
      const { data: srcAccount } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', existing.account_id)
        .single();
      if (srcAccount) {
        await supabase
          .from('accounts')
          .update({ balance: Number(srcAccount.balance) + existing.amount })
          .eq('id', existing.account_id);
      }
      if (existing.to_account_id) {
        const { data: destAccount } = await supabase
          .from('accounts')
          .select('balance')
          .eq('id', existing.to_account_id)
          .single();
        if (destAccount) {
          await supabase
            .from('accounts')
            .update({ balance: Number(destAccount.balance) - existing.amount })
            .eq('id', existing.to_account_id);
        }
      }
    } else if (existing.type !== 'adjustment') {
      const balanceRevert = existing.type === 'income' ? -existing.amount : existing.amount;
      const { data: account } = await supabase
        .from('accounts')
        .select('balance')
        .eq('id', existing.account_id)
        .single();

      if (account) {
        await supabase
          .from('accounts')
          .update({ balance: Number(account.balance) + balanceRevert })
          .eq('id', existing.account_id);
      }
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
async function adjustDebtBalance(
  supabase: SupabaseClient<Database>,
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
