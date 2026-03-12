import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/supabase/auth-helpers';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const format = searchParams.get('format') || 'csv';

    if (!startDate || !endDate) {
      return NextResponse.json({ error: 'start_date and end_date required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify account
    const { data: account } = await supabase
      .from('accounts')
      .select('id, name, type, balance')
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 });
    }

    // Get transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*, categories(name)')
      .or(`account_id.eq.${id},to_account_id.eq.${id}`)
      .eq('household_id', auth.context.householdId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('created_at', { ascending: true });

    const currentBalance = Number(account.balance);

    // Compute opening balance: currentBalance minus all changes from startDate to now
    const { data: startToNow } = await supabase
      .from('transactions')
      .select('type, amount, account_id, to_account_id')
      .or(`account_id.eq.${id},to_account_id.eq.${id}`)
      .eq('household_id', auth.context.householdId)
      .gte('date', startDate);

    let changeStartToNow = 0;
    for (const txn of startToNow || []) {
      if (txn.account_id === id) {
        if (txn.type === 'income') changeStartToNow += txn.amount;
        else if (txn.type === 'expense' || txn.type === 'transfer') changeStartToNow -= txn.amount;
      } else if (txn.to_account_id === id) {
        changeStartToNow += txn.amount;
      }
    }

    const openingBalance = currentBalance - changeStartToNow;

    // Build statement rows with running balance
    let runningBalance = openingBalance;
    const rows = (transactions || []).map((txn: Record<string, unknown>) => {
      let debit = 0;
      let credit = 0;

      if (txn.account_id === id) {
        if (txn.type === 'income') credit = Number(txn.amount);
        else if (txn.type === 'expense' || txn.type === 'transfer') debit = Number(txn.amount);
        else if (txn.type === 'adjustment') {
          // Positive adjustment = credit, negative = debit
          // amount is always positive, determine direction from description or context
          // For adjustments on this account: if it increased balance, it's credit
          credit = Number(txn.amount); // Adjustments are credits by default
        }
      } else if (txn.to_account_id === id) {
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

    if (format === 'csv') {
      const csvLines = [
        `Account Statement: ${account.name}`,
        `Period: ${startDate} to ${endDate}`,
        `Opening Balance: ${openingBalance}`,
        '',
        'Date,Description,Category,Debit,Credit,Balance',
        ...rows.map(
          (r: {
            date: unknown;
            description: unknown;
            category: string | null;
            debit: number;
            credit: number;
            running_balance: number;
          }) =>
            `${r.date},"${String(r.description || '').replace(/"/g, '""')}","${(r.category || '').replace(/"/g, '""')}",${r.debit || ''},${r.credit || ''},${r.running_balance}`,
        ),
        '',
        `Closing Balance: ${closingBalance}`,
        `Total Credits: ${totalCredits}`,
        `Total Debits: ${totalDebits}`,
        `Net Change: ${totalCredits - totalDebits}`,
      ];

      return new NextResponse(csvLines.join('\n'), {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="statement-${account.name}-${startDate}-${endDate}.csv"`,
        },
      });
    }

    // For PDF format, return JSON that the client can use to generate PDF
    // (Full PDF generation requires a library like jsPDF on the client side)
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
