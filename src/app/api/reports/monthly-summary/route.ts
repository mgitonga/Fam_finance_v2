import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    const supabase = await createClient();
    const hid = auth.context.householdId;

    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate =
      month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    // Previous month for comparison
    const prevMonth = month === 1 ? 12 : month - 1;
    const prevYear = month === 1 ? year - 1 : year;
    const prevStartDate = `${prevYear}-${String(prevMonth).padStart(2, '0')}-01`;
    const prevEndDate = startDate;

    const [currentRes, prevRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('type, amount')
        .eq('household_id', hid)
        .gte('date', startDate)
        .lt('date', endDate),
      supabase
        .from('transactions')
        .select('type, amount')
        .eq('household_id', hid)
        .gte('date', prevStartDate)
        .lt('date', prevEndDate),
    ]);

    const current = currentRes.data || [];
    const previous = prevRes.data || [];

    const totalIncome = current
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + Number(t.amount), 0);
    const totalExpenses = current
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount), 0);
    const prevIncome = previous
      .filter((t) => t.type === 'income')
      .reduce((s, t) => s + Number(t.amount), 0);
    const prevExpenses = previous
      .filter((t) => t.type === 'expense')
      .reduce((s, t) => s + Number(t.amount), 0);

    return NextResponse.json({
      data: {
        totalIncome,
        totalExpenses,
        net: totalIncome - totalExpenses,
        previousIncome: prevIncome,
        previousExpenses: prevExpenses,
        previousNet: prevIncome - prevExpenses,
        incomeChange:
          prevIncome > 0 ? Math.round(((totalIncome - prevIncome) / prevIncome) * 100) : 0,
        expenseChange:
          prevExpenses > 0 ? Math.round(((totalExpenses - prevExpenses) / prevExpenses) * 100) : 0,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
