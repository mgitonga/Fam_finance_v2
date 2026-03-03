import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';
import { createRecurringSchema } from '@/lib/validations/recurring';
import { getNextDueDate } from '@/lib/validations/recurring';

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('recurring_transactions')
      .select('*, categories(name, color), accounts(name)')
      .eq('household_id', auth.context.householdId)
      .eq('is_active', true)
      .order('next_due_date', { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

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
    const parsed = createRecurringSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const nextDueDate = getNextDueDate(parsed.data.day_of_month);

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('recurring_transactions')
      .insert({
        ...parsed.data,
        household_id: auth.context.householdId,
        next_due_date: nextDueDate,
      })
      .select('*, categories(name, color), accounts(name)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
