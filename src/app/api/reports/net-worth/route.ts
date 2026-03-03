import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12');

    const supabase = await createClient();
    const hid = auth.context.householdId;

    const now = new Date();
    const data: { month: string; netWorth: number }[] = [];

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const endDate = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const label = `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${y}`;

      // Get all transactions up to this month to calculate running balance
      const { data: txns } = await supabase
        .from('transactions')
        .select('type, amount')
        .eq('household_id', hid)
        .lt('date', endDate);

      const totalIncome = (txns || [])
        .filter((t) => t.type === 'income')
        .reduce((s, t) => s + Number(t.amount), 0);
      const totalExpense = (txns || [])
        .filter((t) => t.type === 'expense')
        .reduce((s, t) => s + Number(t.amount), 0);

      // Get debts at that point (simplified: use current debts)
      const { data: debts } = await supabase
        .from('debts')
        .select('outstanding_balance')
        .eq('household_id', hid)
        .eq('is_active', true);

      const totalDebt = (debts || []).reduce((s, d) => s + Number(d.outstanding_balance), 0);
      const netWorth = totalIncome - totalExpense - totalDebt;

      data.push({ month: label, netWorth });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
