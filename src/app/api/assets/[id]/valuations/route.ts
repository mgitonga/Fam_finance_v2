import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';
import { addValuationSchema } from '@/lib/validations/asset';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const adminCheck = requireAdmin(auth.context);
    if (adminCheck) return adminCheck;

    const body = await request.json();
    const parsed = addValuationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Verify asset exists and belongs to household
    const { data: asset } = await supabase
      .from('assets')
      .select('id')
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Insert valuation
    const { data: valuation, error: valError } = await supabase
      .from('asset_valuations')
      .insert({
        asset_id: id,
        value: parsed.data.value,
        date: parsed.data.date,
        notes: parsed.data.notes ?? null,
      })
      .select()
      .single();

    if (valError) {
      return NextResponse.json({ error: valError.message }, { status: 500 });
    }

    // Update current_value on the asset
    const { error: updateError } = await supabase
      .from('assets')
      .update({ current_value: parsed.data.value })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ data: valuation }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
