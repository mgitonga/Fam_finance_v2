import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/supabase/auth-helpers';
import { createTransactionSchema } from '@/lib/validations/transaction';
import { ITEMS_PER_PAGE } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || String(ITEMS_PER_PAGE));
    const offset = (page - 1) * limit;
    const sortBy = searchParams.get('sortBy') || 'date';
    const sortOrder = searchParams.get('sortOrder') === 'asc' ? true : false;

    const supabase = await createClient();

    let query = supabase
      .from('transactions')
      .select('*, categories(name, color), accounts(name)', { count: 'exact' })
      .eq('household_id', auth.context.householdId);

    // Filters
    const type = searchParams.get('type');
    if (type) query = query.eq('type', type);

    const categoryId = searchParams.get('category_id');
    if (categoryId) query = query.eq('category_id', categoryId);

    const accountId = searchParams.get('account_id');
    if (accountId) query = query.eq('account_id', accountId);

    const userId = searchParams.get('user_id');
    if (userId) query = query.eq('user_id', userId);

    const paymentMethod = searchParams.get('payment_method');
    if (paymentMethod) query = query.eq('payment_method', paymentMethod);

    const dateFrom = searchParams.get('date_from');
    if (dateFrom) query = query.gte('date', dateFrom);

    const dateTo = searchParams.get('date_to');
    if (dateTo) query = query.lte('date', dateTo);

    const search = searchParams.get('search');
    if (search) {
      query = query.or(`description.ilike.%${search}%,merchant.ilike.%${search}%`);
    }

    // Sort + paginate
    query = query.order(sortBy, { ascending: sortOrder }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
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

    const body = await request.json();
    const parsed = createTransactionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Verify account belongs to household
    const { data: account } = await supabase
      .from('accounts')
      .select('id, balance')
      .eq('id', parsed.data.account_id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 400 });
    }

    // Insert transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        ...parsed.data,
        household_id: auth.context.householdId,
        user_id: auth.context.userId,
      })
      .select('*, categories(name, color), accounts(name)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update account balance
    const balanceChange = parsed.data.type === 'income' ? parsed.data.amount : -parsed.data.amount;
    await supabase
      .from('accounts')
      .update({ balance: account.balance + balanceChange })
      .eq('id', parsed.data.account_id);

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
