import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('overall_budgets')
      .select('*')
      .eq('household_id', auth.context.householdId)
      .eq('month', month)
      .eq('year', year)
      .single();

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get total spending for the month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate =
      month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const { data: spending } = await supabase
      .from('transactions')
      .select('amount')
      .eq('household_id', auth.context.householdId)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lt('date', endDate);

    const totalSpent = (spending || []).reduce((sum, tx) => sum + Number(tx.amount), 0);

    return NextResponse.json({
      data: {
        budget: data,
        spent: totalSpent,
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

    const adminCheck = requireAdmin(auth.context);
    if (adminCheck) return adminCheck;

    const body = await request.json();
    const { amount, month, year } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
    }

    const supabase = await createClient();

    const { data, error } = await supabase
      .from('overall_budgets')
      .upsert(
        {
          household_id: auth.context.householdId,
          amount,
          month,
          year,
        },
        {
          onConflict: 'household_id,month,year',
        },
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
