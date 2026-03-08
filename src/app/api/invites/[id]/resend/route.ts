import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const adminCheck = requireAdmin(auth.context);
    if (adminCheck) return adminCheck;

    const supabase = await createClient();

    // Fetch the invite
    const { data: invite, error: fetchError } = await supabase
      .from('household_invites')
      .select('*')
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (fetchError || !invite) {
      return NextResponse.json({ error: 'Invite not found' }, { status: 404 });
    }

    // Allow resending pending or expired invites
    if (invite.status !== 'pending' && invite.status !== 'expired') {
      return NextResponse.json(
        { error: `Cannot resend an invite with status: ${invite.status}` },
        { status: 400 },
      );
    }

    // Resend via Supabase Auth
    const adminSupabase = createAdminClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

    const { error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(invite.email, {
      data: {
        name: invite.name,
        role: invite.role,
        household_id: auth.context.householdId,
      },
      redirectTo: `${siteUrl}/auth/callback?next=/accept-invite`,
    });

    if (inviteError) {
      return NextResponse.json(
        { error: `Failed to resend invite: ${inviteError.message}` },
        { status: 500 },
      );
    }

    // Reset status to pending and extend expiry
    const { data, error: updateError } = await supabase
      .from('household_invites')
      .update({
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({ message: `Invite resent to ${invite.email}`, data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
