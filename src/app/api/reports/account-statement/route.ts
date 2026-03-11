import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('account_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

    if (!accountId || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'account_id, start_date, and end_date are required' },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Verify account
    const { data: account } = await supabase
      .from('accounts')
      .select('id, name, type, balance')
      .eq('id', accountId)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Get transactions in the period
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, categories(name)')
      .or(`account_id.eq.${accountId},to_account_id.eq.${accountId}`)
      .eq('household_id', auth.context.householdId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });

    // Compute opening balance: current balance minus all changes from startDate to now
    const { data: startToNow } = await supabase
      .from('transactions')
      .select('type, amount, account_id, to_account_id')
      .or(`account_id.eq.${accountId},to_account_id.eq.${accountId}`)
      .eq('household_id', auth.context.householdId)
      .gte('date', startDate);

    let changeStartToNow = 0;
    for (const txn of startToNow || []) {
      if (txn.account_id === accountId) {
        if (txn.type === 'income') changeStartToNow += txn.amount;
        else if (txn.type === 'expense' || txn.type === 'transfer') changeStartToNow -= txn.amount;
      } else if (txn.to_account_id === accountId) {
        changeStartToNow += txn.amount;
      }
    }

    const currentBalance = Number(account.balance);
    const openingBalance = currentBalance - changeStartToNow;

    // Build rows with running balance
    let runningBalance = openingBalance;
    const rows = (transactions || []).map((txn: Record<string, unknown>) => {
      let debit = 0;
      let credit = 0;

      if (txn.account_id === accountId) {
        if (txn.type === 'income') credit = Number(txn.amount);
        else if (txn.type === 'expense' || txn.type === 'transfer') debit = Number(txn.amount);
        else if (txn.type === 'adjustment') credit = Number(txn.amount);
      } else if (txn.to_account_id === accountId) {
        credit = Number(txn.amount);
      }

      runningBalance += credit - debit;

      const categoryData = txn.categories as { name: string } | null;

      return {
        id: txn.id,
        date: txn.date,
        description: txn.description,
        merchant: txn.merchant,
        category: categoryData?.name || null,
        type: txn.type,
        debit,
        credit,
        running_balance: runningBalance,
      };
    });

    const closingBalance = runningBalance;
    const totalCredits = rows.reduce((s: number, r: { credit: number }) => s + r.credit, 0);
    const totalDebits = rows.reduce((s: number, r: { debit: number }) => s + r.debit, 0);

    return NextResponse.json({
      data: {
        account: { id: account.id, name: account.name, type: account.type },
        period: { start_date: startDate, end_date: endDate },
        opening_balance: openingBalance,
        closing_balance: closingBalance,
        transactions: rows,
        summary: {
          total_credits: totalCredits,
          total_debits: totalDebits,
          net_change: totalCredits - totalDebits,
        },
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
