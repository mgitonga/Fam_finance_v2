import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';

type RouteParams = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const adminCheck = requireAdmin(auth.context);
    if (adminCheck) return adminCheck;

    const supabase = await createClient();

    // Verify the invite exists and is pending
    const { data: invite, error: fetchError } = await supabase
      .from('household_invites')
      .select('id, status')
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (fetchError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    if (invite.status !== 'pending') {
      return NextResponse.json(
        { error: `Cannot cancel an invite with status: ${invite.status}` },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from('household_invites')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      })
      .eq('id', id)
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
