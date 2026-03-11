import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/supabase/auth-helpers';
import { logDebtPaymentSchema, calculatePayoffDate } from '@/lib/validations/savings-debt';
import { createDebtPayoffNotification } from '@/lib/notifications';

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
    if (!debt.is_active)
      return NextResponse.json({ error: 'Debt is already paid off' }, { status: 400 });

    // Block overpayment
    if (parsed.data.amount > Number(debt.outstanding_balance)) {
      return NextResponse.json(
        {
          error: `Amount exceeds outstanding balance of KES ${Number(debt.outstanding_balance).toLocaleString()}`,
        },
        { status: 400 },
      );
    }

    // Get account
    const { data: account } = await supabase
      .from('accounts')
      .select('id, balance')
      .eq('id', parsed.data.account_id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!account) return NextResponse.json({ error: 'Account not found' }, { status: 400 });

    // Overdraft protection
    if (Number(account.balance) < parsed.data.amount) {
      return NextResponse.json(
        {
          error: `Insufficient balance. Account has KES ${Number(account.balance).toLocaleString()} but transaction requires KES ${parsed.data.amount.toLocaleString()}.`,
        },
        { status: 400 },
      );
    }

    // Resolve category — look up a Loans sub-category for the household
    let categoryId = parsed.data.category_id;
    if (!categoryId) {
      // Find the "Loans" parent category
      const { data: loansParent } = await supabase
        .from('categories')
        .select('id')
        .eq('household_id', auth.context.householdId)
        .eq('name', 'Loans')
        .is('parent_id', null)
        .eq('is_active', true)
        .single();

      if (loansParent) {
        // Find the first sub-category under Loans
        const { data: loansSub } = await supabase
          .from('categories')
          .select('id')
          .eq('household_id', auth.context.householdId)
          .eq('parent_id', loansParent.id)
          .eq('is_active', true)
          .order('sort_order', { ascending: true })
          .limit(1)
          .single();

        categoryId = loansSub?.id || loansParent.id;
      } else {
        // Fallback: find any category — this shouldn't happen with seeded data
        return NextResponse.json(
          { error: 'No Loans category found. Please create a Loans category first.' },
          { status: 400 },
        );
      }
    }

    const paymentDate = parsed.data.date || new Date().toISOString().split('T')[0];
    const description = parsed.data.description || `Debt payment: ${debt.name}`;
    const paymentMethod = parsed.data.payment_method || 'bank_transfer';

    // Create transaction for the payment
    const { error: txnError } = await supabase.from('transactions').insert({
      household_id: auth.context.householdId,
      user_id: auth.context.userId,
      type: 'expense',
      amount: parsed.data.amount,
      date: paymentDate,
      account_id: parsed.data.account_id,
      category_id: categoryId,
      debt_id: id,
      description,
      payment_method: paymentMethod,
    });

    if (txnError) {
      return NextResponse.json(
        { error: `Failed to create transaction: ${txnError.message}` },
        { status: 500 },
      );
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

    const isPayoff = newBalance <= 0;

    const { data: updatedDebt, error: debtError } = await supabase
      .from('debts')
      .update({
        outstanding_balance: newBalance,
        projected_payoff_date: payoffDate,
        is_active: !isPayoff,
      })
      .eq('id', id)
      .select()
      .single();

    if (debtError) return NextResponse.json({ error: debtError.message }, { status: 500 });

    // Send payoff notification if debt is fully paid
    if (isPayoff) {
      await createDebtPayoffNotification(auth.context.householdId, debt.name);
    }

    return NextResponse.json({ data: updatedDebt, isPayoff });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
