import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';
import { updateAssetSchema } from '@/lib/validations/asset';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const supabase = await createClient();

    const { data: asset, error } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (error || !asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // Fetch valuations
    const { data: valuations } = await supabase
      .from('asset_valuations')
      .select('*')
      .eq('asset_id', id)
      .order('date', { ascending: true });

    const valueChange = Number(asset.current_value) - Number(asset.purchase_price);
    const valueChangePct =
      Number(asset.purchase_price) > 0
        ? Math.round((valueChange / Number(asset.purchase_price)) * 100)
        : 0;

    return NextResponse.json({
      data: {
        ...asset,
        valuations: valuations || [],
        value_change: valueChange,
        value_change_pct: valueChangePct,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const adminCheck = requireAdmin(auth.context);
    if (adminCheck) return adminCheck;

    const body = await request.json();
    const parsed = updateAssetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const supabase = await createClient();

    // Get existing asset
    const { data: existing } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    // If current_value changed, insert a new valuation entry
    if (
      parsed.data.current_value !== undefined &&
      parsed.data.current_value !== Number(existing.current_value)
    ) {
      await supabase.from('asset_valuations').insert({
        asset_id: id,
        value: parsed.data.current_value,
        date: new Date().toISOString().split('T')[0],
        notes: 'Value updated via asset edit',
      });
    }

    const { data, error } = await supabase
      .from('assets')
      .update(parsed.data)
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
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

    const adminCheck = requireAdmin(auth.context);
    if (adminCheck) return adminCheck;

    const supabase = await createClient();
    const { error } = await supabase
      .from('assets')
      .update({ is_active: false })
      .eq('id', id)
      .eq('household_id', auth.context.householdId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Asset deactivated' });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
