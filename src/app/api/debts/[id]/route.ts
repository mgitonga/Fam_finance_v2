import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';
import { updateDebtSchema, calculatePayoffDate } from '@/lib/validations/savings-debt';

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;
    const adminCheck = requireAdmin(auth.context);
    if (adminCheck) return adminCheck;

    const body = await request.json();
    const parsed = updateDebtSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Get current debt to recalculate payoff if needed
    const { data: current } = await supabase
      .from('debts')
      .select('*')
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!current) return NextResponse.json({ error: 'Debt not found' }, { status: 404 });

    const balance = parsed.data.outstanding_balance ?? Number(current.outstanding_balance);
    const rate = parsed.data.interest_rate ?? current.interest_rate ?? 0;
    const payment = parsed.data.minimum_payment ?? current.minimum_payment;

    let projectedPayoffDate = current.projected_payoff_date;
    if (payment) {
      projectedPayoffDate = calculatePayoffDate(balance, Number(rate), Number(payment));
    }

    const { data, error } = await supabase
      .from('debts')
      .update({ ...parsed.data, projected_payoff_date: projectedPayoffDate })
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;
    const adminCheck = requireAdmin(auth.context);
    if (adminCheck) return adminCheck;

    const supabase = await createClient();
    const { error } = await supabase
      .from('debts')
      .update({ is_active: false })
      .eq('id', id)
      .eq('household_id', auth.context.householdId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ message: 'Debt deactivated' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
