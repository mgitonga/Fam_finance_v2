import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';
import { inviteUserSchema } from '@/lib/validations/user';

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const adminCheck = requireAdmin(auth.context);
    if (adminCheck) return adminCheck;

    const body = await request.json();
    const parsed = inviteUserSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Use regular client for RLS-scoped queries, admin client for auth.admin API
    const supabase = await createClient();
    const adminSupabase = createAdminClient();

    // Check if user already exists in household
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', parsed.data.email)
      .eq('household_id', auth.context.householdId)
      .single();

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already belongs to this household' },
        { status: 400 },
      );
    }

    // Check for existing pending invite
    const { data: existingInvite } = await supabase
      .from('household_invites')
      .select('id')
      .eq('email', parsed.data.email)
      .eq('household_id', auth.context.householdId)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      return NextResponse.json(
        { error: 'A pending invite already exists for this email' },
        { status: 400 },
      );
    }

    // Create invite record
    const { data: invite, error: insertError } = await supabase
      .from('household_invites')
      .insert({
        household_id: auth.context.householdId,
        email: parsed.data.email,
        name: parsed.data.name,
        role: 'contributor',
        invited_by: auth.context.userId,
      })
      .select()
      .single();

    if (insertError) {
      return NextResponse.json(
        { error: `Failed to create invite: ${insertError.message}` },
        { status: 500 },
      );
    }

    // Send invite email via Supabase Auth (requires service role key)
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const { error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
      parsed.data.email,
      {
        data: {
          name: parsed.data.name,
          role: 'contributor',
          household_id: auth.context.householdId,
        },
        redirectTo: `${siteUrl}/auth/callback?next=/accept-invite`,
      },
    );

    if (inviteError) {
      // Rollback the invite record
      await supabase.from('household_invites').delete().eq('id', invite.id);
      return NextResponse.json(
        { error: `Failed to send invite: ${inviteError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { message: `Invite sent to ${parsed.data.email}`, data: invite },
      { status: 201 },
    );
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
