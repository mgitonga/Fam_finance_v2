import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const adminCheck = requireAdmin(auth.context);
    if (adminCheck) return adminCheck;

    const supabase = await createClient();

    // Lazily expire pending invites that have passed their expiry
    await supabase
      .from('household_invites')
      .update({ status: 'expired' })
      .eq('household_id', auth.context.householdId)
      .eq('status', 'pending')
      .lt('expires_at', new Date().toISOString());

    // Optional status filter
    const { searchParams } = new URL(request.url);
    const statusFilter = searchParams.get('status');

    let query = supabase
      .from('household_invites')
      .select('*, invited_by_user:users!household_invites_invited_by_fkey(name)')
      .eq('household_id', auth.context.householdId)
      .order('invited_at', { ascending: false });

    if (statusFilter) {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Flatten the joined user name
    const invites = data.map((invite) => ({
      id: invite.id,
      email: invite.email,
      name: invite.name,
      role: invite.role,
      status: invite.status,
      invited_by: invite.invited_by,
      invited_by_name: (invite.invited_by_user as { name: string } | null)?.name ?? 'Unknown',
      invited_at: invite.invited_at,
      expires_at: invite.expires_at,
      accepted_at: invite.accepted_at,
      cancelled_at: invite.cancelled_at,
    }));

    return NextResponse.json({ data: invites });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
