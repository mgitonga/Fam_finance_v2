import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/supabase/auth-helpers';
import { updateTransactionSchema } from '@/lib/validations/transaction';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('transactions')
      .select('*, categories(name, color), accounts(name)')
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const supabase = await createClient();

    // Get existing transaction
    const { data: existing } = await supabase
      .from('transactions')
      .select('*, accounts(balance)')
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Permission check: own transaction or admin
    if (existing.user_id !== auth.context.userId && auth.context.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const parsed = updateTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Reverse old balance impact
    const oldBalanceChange = existing.type === 'income' ? -existing.amount : existing.amount;

    // Calculate new balance impact
    const newType = parsed.data.type || existing.type;
    const newAmount = parsed.data.amount || existing.amount;
    const newBalanceChange = newType === 'income' ? newAmount : -newAmount;

    // Update transaction
    const { data, error } = await supabase
      .from('transactions')
      .update(parsed.data)
      .eq('id', id)
      .select('*, categories(name, color), accounts(name)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update account balance (reverse old + apply new)
    const accountId = parsed.data.account_id || existing.account_id;
    const { data: account } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', accountId)
      .single();

    if (account) {
      await supabase
        .from('accounts')
        .update({ balance: account.balance + oldBalanceChange + newBalanceChange })
        .eq('id', accountId);
    }

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

    const supabase = await createClient();

    // Get existing transaction
    const { data: existing } = await supabase
      .from('transactions')
      .select('*, accounts(balance)')
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    // Permission check: own transaction or admin
    if (existing.user_id !== auth.context.userId && auth.context.role !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Delete transaction
    const { error } = await supabase.from('transactions').delete().eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Reverse balance impact
    const balanceRevert = existing.type === 'income' ? -existing.amount : existing.amount;
    const { data: account } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', existing.account_id)
      .single();

    if (account) {
      await supabase
        .from('accounts')
        .update({ balance: account.balance + balanceRevert })
        .eq('id', existing.account_id);
    }

    return NextResponse.json({ message: 'Transaction deleted' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
