import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/supabase/auth-helpers';
import { createTransactionSchema } from '@/lib/validations/transaction';
import { calculatePayoffDate } from '@/lib/validations/savings-debt';
import { createDebtPayoffNotification } from '@/lib/notifications';
import { ITEMS_PER_PAGE } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE));
    const offset = (page - 1) * limit;
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? true : false;

    const supabase = await createClient();

    let query = supabase
      .from('transactions')
      .select('*, categories(name, color, icon), accounts!transactions_account_id_fkey(name)', {
        count: 'exact',
      })
      .eq('household_id', auth.context.householdId);

    // Filters
    const type = searchParams.get('type');
    if (type) query = query.eq('type', type);

    const categoryId = searchParams.get('category_id');
    if (categoryId) query = query.eq('category_id', categoryId);

    const accountId = searchParams.get('account_id');
    if (accountId) query = query.eq('account_id', accountId);

    const userId = searchParams.get('user_id');
    if (userId) query = query.eq('user_id', userId);

    const paymentMethod = searchParams.get('payment_method');
    if (paymentMethod) query = query.eq('payment_method', paymentMethod);

    const dateFrom = searchParams.get('date_from');
    if (dateFrom) query = query.gte('date', dateFrom);

    const dateTo = searchParams.get('date_to');
    if (dateTo) query = query.lte('date', dateTo);

    const search = searchParams.get('search');
    if (search) {
      query = query.or(`description.ilike.%${search}%,merchant.ilike.%${search}%`);
    }

    const debtId = searchParams.get('debt_id');
    if (debtId) query = query.eq('debt_id', debtId);

    // Sort + paginate
    query = query.order(sortBy, { ascending: sortOrder }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const body = await request.json();
    const parsed = createTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Verify account belongs to household
    const { data: account } = await supabase
      .from('accounts')
      .select('id, balance')
      .eq('id', parsed.data.account_id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 400 });
    }

    // Overdraft protection: check balance for expense and transfer types
    if (parsed.data.type === 'expense' || parsed.data.type === 'transfer') {
      if (Number(account.balance) < parsed.data.amount) {
        return NextResponse.json(
          {
            error: `Insufficient balance. Account has KES ${Number(account.balance).toLocaleString()} but transaction requires KES ${parsed.data.amount.toLocaleString()}.`,
          },
          { status: 400 },
        );
      }
    }

    // For transfers, verify destination account
    let toAccount: { id: string; balance: number } | null = null;
    if (parsed.data.type === 'transfer') {
      const { data: destAccount } = await supabase
        .from('accounts')
        .select('id, balance')
        .eq('id', parsed.data.to_account_id!)
        .eq('household_id', auth.context.householdId)
        .single();

      if (!destAccount) {
        return NextResponse.json({ error: 'Destination account not found' }, { status: 400 });
      }
      toAccount = destAccount;
    }

    // Verify category is selectable (not a parent that has sub-categories)
    // Category not required for transfers and adjustments
    if (parsed.data.category_id) {
      const { data: category } = await supabase
        .from('categories')
        .select('id, name')
        .eq('id', parsed.data.category_id)
        .eq('household_id', auth.context.householdId)
        .single();

      if (!category) {
        return NextResponse.json({ error: 'Category not found' }, { status: 400 });
      }

      const { count: childCount } = await supabase
        .from('categories')
        .select('id', { count: 'exact', head: true })
        .eq('parent_id', parsed.data.category_id)
        .eq('household_id', auth.context.householdId)
        .eq('is_active', true);

      if (childCount && childCount > 0) {
        return NextResponse.json(
          {
            error: `"${category.name}" has sub-categories. Please select a specific sub-category instead.`,
          },
          { status: 400 },
        );
      }
    }

    // If linked to a debt, validate the debt and block overpayment
    if (parsed.data.debt_id) {
      const { data: debt } = await supabase
        .from('debts')
        .select('id, outstanding_balance, is_active, name')
        .eq('id', parsed.data.debt_id)
        .eq('household_id', auth.context.householdId)
        .single();

      if (!debt) {
        return NextResponse.json({ error: 'Debt not found' }, { status: 400 });
      }
      if (!debt.is_active) {
        return NextResponse.json({ error: 'Debt is already paid off' }, { status: 400 });
      }
      if (parsed.data.amount > Number(debt.outstanding_balance)) {
        return NextResponse.json(
          {
            error: `Amount exceeds outstanding balance of KES ${Number(debt.outstanding_balance).toLocaleString()}`,
          },
          { status: 400 },
        );
      }
    }

    // Insert transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...parsed.data,
        household_id: auth.context.householdId,
        user_id: auth.context.userId,
      })
      .select('*, categories(name, color, icon), accounts!transactions_account_id_fkey(name)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update account balance(s)
    if (parsed.data.type === 'transfer') {
      // Debit source, credit destination
      await supabase
        .from('accounts')
        .update({ balance: Number(account.balance) - parsed.data.amount })
        .eq('id', parsed.data.account_id);
      if (toAccount) {
        await supabase
          .from('accounts')
          .update({ balance: Number(toAccount.balance) + parsed.data.amount })
          .eq('id', parsed.data.to_account_id!);
      }
    } else if (parsed.data.type !== 'adjustment') {
      const balanceChange =
        parsed.data.type === 'income' ? parsed.data.amount : -parsed.data.amount;
      await supabase
        .from('accounts')
        .update({ balance: Number(account.balance) + balanceChange })
        .eq('id', parsed.data.account_id);
    }

    // If this transaction is linked to a debt, update the debt balance
    let isPayoff = false;
    if (parsed.data.debt_id) {
      const { data: debt } = await supabase
        .from('debts')
        .select('*')
        .eq('id', parsed.data.debt_id)
        .eq('household_id', auth.context.householdId)
        .single();

      if (debt) {
        const newBalance = Math.max(0, Number(debt.outstanding_balance) - parsed.data.amount);
        let payoffDate = debt.projected_payoff_date;
        if (debt.minimum_payment && debt.interest_rate !== null) {
          payoffDate = calculatePayoffDate(
            newBalance,
            Number(debt.interest_rate || 0),
            Number(debt.minimum_payment),
          );
        }

        isPayoff = newBalance <= 0;

        await supabase
          .from('debts')
          .update({
            outstanding_balance: newBalance,
            projected_payoff_date: payoffDate,
            is_active: !isPayoff,
          })
          .eq('id', parsed.data.debt_id);

        if (isPayoff) {
          await createDebtPayoffNotification(auth.context.householdId, debt.name);
        }
      }
    }

    return NextResponse.json({ data, isPayoff }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
