import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/supabase/auth-helpers';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const supabase = await createClient();

    // Verify account belongs to household
    const { data: account } = await supabase
      .from('accounts')
      .select('id, balance')
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Get transactions for the last 30 days to compute daily closing balances
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    const { data: transactions } = await supabase
      .from('transactions')
      .select('date, type, amount, account_id, to_account_id')
      .eq('household_id', auth.context.householdId)
      .gte('date', startDate.toISOString().split('T')[0])
      .lte('date', endDate.toISOString().split('T')[0])
      .or(`account_id.eq.${id},to_account_id.eq.${id}`)
      .order('date', { ascending: true });

    // Build daily balance map working backwards from current balance
    const currentBalance = Number(account.balance);
    const dailyChanges = new Map<string, number>();

    for (const txn of transactions || []) {
      const date = txn.date;
      let change = 0;

      if (txn.account_id === id) {
        // This account is the source
        if (txn.type === 'income') change = txn.amount;
        else if (txn.type === 'expense' || txn.type === 'transfer') change = -txn.amount;
      } else if (txn.to_account_id === id) {
        // This account is the transfer destination
        change = txn.amount;
      }

      dailyChanges.set(date, (dailyChanges.get(date) || 0) + change);
    }

    // Generate 30 data points
    const dates: string[] = [];
    for (let i = 0; i <= 30; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      dates.push(d.toISOString().split('T')[0]);
    }
    dates.reverse();

    // Compute opening balance and build daily balances
    const openingBalance =
      currentBalance - Array.from(dailyChanges.values()).reduce((a, b) => a + b, 0);
    const result: { date: string; balance: number }[] = [];
    let runningBalance = openingBalance;

    for (const date of dates) {
      runningBalance += dailyChanges.get(date) || 0;
      result.push({ date, balance: runningBalance });
    }

    return NextResponse.json({ data: result });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
