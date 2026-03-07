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

    // Verify debt belongs to household
    const { data: debt } = await supabase
      .from('debts')
      .select('id')
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!debt) {
      return NextResponse.json({ error: 'Debt not found' }, { status: 404 });
    }

    // Fetch all transactions linked to this debt
    const { data: payments, error } = await supabase
      .from('transactions')
      .select(
        'id, amount, date, description, payment_method, created_at, categories(id, name), accounts(id, name)',
      )
      .eq('debt_id', id)
      .eq('household_id', auth.context.householdId)
      .order('date', { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const totalPaid = (payments || []).reduce((sum, p) => sum + Number(p.amount), 0);

    return NextResponse.json({
      payments: payments || [],
      totalPaid,
      paymentCount: (payments || []).length,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
