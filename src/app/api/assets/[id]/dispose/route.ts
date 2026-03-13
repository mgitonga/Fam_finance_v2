import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';
import { disposeAssetSchema } from '@/lib/validations/asset';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const adminCheck = requireAdmin(auth.context);
    if (adminCheck) return adminCheck;

    const body = await request.json();
    const parsed = disposeAssetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const hid = auth.context.householdId;

    // Verify asset exists, belongs to household, and is active
    const { data: asset } = await supabase
      .from('assets')
      .select('*')
      .eq('id', id)
      .eq('household_id', hid)
      .eq('is_active', true)
      .single();

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found or already disposed' }, { status: 404 });
    }

    // Look up "Asset Sales" income category
    const { data: category } = await supabase
      .from('categories')
      .select('id')
      .eq('household_id', hid)
      .eq('name', 'Asset Sales')
      .eq('type', 'income')
      .eq('is_active', true)
      .single();

    if (!category) {
      return NextResponse.json(
        {
          error:
            'Asset Sales category not found. Please restore or create an "Asset Sales" income category.',
        },
        { status: 400 },
      );
    }

    // Create income transaction for the disposal
    const { data: transaction, error: txnError } = await supabase
      .from('transactions')
      .insert({
        household_id: hid,
        user_id: auth.context.userId,
        type: 'income',
        amount: parsed.data.disposal_amount,
        account_id: parsed.data.account_id,
        category_id: category.id,
        date: parsed.data.date,
        description: parsed.data.description || `Sale of ${asset.name}`,
      })
      .select()
      .single();

    if (txnError) {
      return NextResponse.json({ error: txnError.message }, { status: 500 });
    }

    // Update the asset as disposed
    const { data: disposedAsset, error: assetError } = await supabase
      .from('assets')
      .update({
        is_active: false,
        disposed_at: new Date().toISOString(),
        disposal_amount: parsed.data.disposal_amount,
        disposal_transaction_id: transaction.id,
      })
      .eq('id', id)
      .select()
      .single();

    if (assetError) {
      return NextResponse.json({ error: assetError.message }, { status: 500 });
    }

    return NextResponse.json({ data: { asset: disposedAsset, transaction } });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
