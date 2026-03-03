import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';
import { copyBudgetSchema } from '@/lib/validations/budget';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const adminCheck = requireAdmin(auth.context);
    if (adminCheck) return adminCheck;

    const body = await request.json();
    const parsed = copyBudgetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Get budgets from source month
    const { data: sourceBudgets, error: fetchError } = await supabase
      .from('budgets')
      .select('category_id, amount')
      .eq('household_id', auth.context.householdId)
      .eq('month', parsed.data.from_month)
      .eq('year', parsed.data.from_year);

    if (fetchError) {
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    if (!sourceBudgets || sourceBudgets.length === 0) {
      return NextResponse.json({ error: 'No budgets found for the source month' }, { status: 400 });
    }

    // Copy to target month (upsert each)
    const budgetsToInsert = sourceBudgets.map((b) => ({
      household_id: auth.context.householdId,
      category_id: b.category_id,
      amount: b.amount,
      month: parsed.data.to_month,
      year: parsed.data.to_year,
    }));

    const { error: insertError } = await supabase.from('budgets').upsert(budgetsToInsert, {
      onConflict: 'household_id,category_id,month,year',
    });

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Also copy overall budget if it exists
    const { data: overallSource } = await supabase
      .from('overall_budgets')
      .select('amount')
      .eq('household_id', auth.context.householdId)
      .eq('month', parsed.data.from_month)
      .eq('year', parsed.data.from_year)
      .single();

    if (overallSource) {
      await supabase.from('overall_budgets').upsert(
        {
          household_id: auth.context.householdId,
          amount: overallSource.amount,
          month: parsed.data.to_month,
          year: parsed.data.to_year,
        },
        {
          onConflict: 'household_id,month,year',
        },
      );
    }

    return NextResponse.json({
      data: {
        copied: sourceBudgets.length,
        to_month: parsed.data.to_month,
        to_year: parsed.data.to_year,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
