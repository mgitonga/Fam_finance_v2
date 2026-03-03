import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';
import { createBudgetSchema } from '@/lib/validations/budget';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const month = parseInt(searchParams.get('month') || String(new Date().getMonth() + 1));
    const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()));

    const supabase = await createClient();

    // Get budgets for the month
    const { data: budgets, error } = await supabase
      .from('budgets')
      .select('*, categories(name, color, type)')
      .eq('household_id', auth.context.householdId)
      .eq('month', month)
      .eq('year', year)
      .order('created_at', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get spending per category for the same month
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const endDate =
      month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, '0')}-01`;

    const { data: spending } = await supabase
      .from('transactions')
      .select('category_id, amount')
      .eq('household_id', auth.context.householdId)
      .eq('type', 'expense')
      .gte('date', startDate)
      .lt('date', endDate);

    // Aggregate spending by category
    const spendingMap = new Map<string, number>();
    (spending || []).forEach((tx) => {
      const current = spendingMap.get(tx.category_id) || 0;
      spendingMap.set(tx.category_id, current + Number(tx.amount));
    });

    // Merge budget + spending data
    const budgetsWithSpending = (budgets || []).map((budget) => ({
      ...budget,
      spent: spendingMap.get(budget.category_id) || 0,
    }));

    return NextResponse.json({ data: budgetsWithSpending });
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
    const parsed = createBudgetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Upsert budget (update if exists for same category/month/year)
    const { data, error } = await supabase
      .from('budgets')
      .upsert(
        {
          ...parsed.data,
          household_id: auth.context.householdId,
        },
        {
          onConflict: 'household_id,category_id,month,year',
        },
      )
      .select('*, categories(name, color, type)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
