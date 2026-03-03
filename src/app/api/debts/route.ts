import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';
import { createDebtSchema, calculatePayoffDate } from '@/lib/validations/savings-debt';

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('debts')
      .select('*')
      .eq('household_id', auth.context.householdId)
      .eq('is_active', true)
      .order('created_at', { ascending: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
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
    const parsed = createDebtSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Calculate projected payoff date
    let projectedPayoffDate: string | null = null;
    if (parsed.data.minimum_payment && parsed.data.interest_rate !== undefined) {
      projectedPayoffDate = calculatePayoffDate(
        parsed.data.outstanding_balance,
        parsed.data.interest_rate || 0,
        parsed.data.minimum_payment,
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('debts')
      .insert({
        ...parsed.data,
        household_id: auth.context.householdId,
        projected_payoff_date: projectedPayoffDate,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
