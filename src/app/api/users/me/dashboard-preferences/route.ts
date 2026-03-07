import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/supabase/auth-helpers';
import { dashboardPreferencesSchema } from '@/lib/validations/dashboard';
import { DASHBOARD_WIDGETS } from '@/lib/dashboard-widgets';

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const supabase = await createClient();
    const { data, error } = await supabase
      .from('dashboard_preferences')
      .select('preferences')
      .eq('user_id', auth.context.userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ preferences: data?.preferences ?? null });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const body = await request.json();
    const parsed = dashboardPreferencesSchema.safeParse(body.preferences);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Ensure all known widget IDs are present
    const knownIds = DASHBOARD_WIDGETS.map((w) => w.id);
    const submittedIds = parsed.data.map((p) => p.id);
    const missingIds = knownIds.filter((id) => !submittedIds.includes(id));

    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: `Missing widget IDs: ${missingIds.join(', ')}` },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { error } = await supabase.from('dashboard_preferences').upsert(
      {
        user_id: auth.context.userId,
        preferences: parsed.data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    );

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ preferences: parsed.data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const supabase = await createClient();
    const { error } = await supabase
      .from('dashboard_preferences')
      .delete()
      .eq('user_id', auth.context.userId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ preferences: null });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
