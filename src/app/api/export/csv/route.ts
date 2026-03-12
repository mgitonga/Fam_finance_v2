import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const supabase = await createClient();

    let query = supabase
      .from('transactions')
      .select(
        'date, type, amount, description, merchant, payment_method, notes, categories(name), accounts!transactions_account_id_fkey(name)',
      )
      .eq('household_id', auth.context.householdId)
      .order('date', { ascending: false });

    if (from) query = query.gte('date', from);
    if (to) query = query.lte('date', to);

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Build CSV
    const headers = [
      'Date',
      'Type',
      'Amount',
      'Category',
      'Account',
      'Description',
      'Merchant',
      'Payment Method',
      'Notes',
    ];
    const rows = (data || []).map((t) => {
      const cat = t.categories as { name: string } | null;
      const acc = t.accounts as { name: string } | null;
      return [
        t.date,
        t.type,
        String(t.amount),
        cat?.name || '',
        acc?.name || '',
        (t.description || '').replace(/"/g, '""'),
        (t.merchant || '').replace(/"/g, '""'),
        t.payment_method || '',
        (t.notes || '').replace(/"/g, '""'),
      ]
        .map((v) => `"${v}"`)
        .join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="famfin-transactions-${from || 'all'}-${to || 'all'}.csv"`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
