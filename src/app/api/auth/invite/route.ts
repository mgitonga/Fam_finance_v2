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

    // Send invite email via Supabase Auth (requires service role key)
    const { error: inviteError } = await adminSupabase.auth.admin.inviteUserByEmail(
      parsed.data.email,
      {
        data: {
          name: parsed.data.name,
          role: 'contributor',
          household_id: auth.context.householdId,
        },
      },
    );

    if (inviteError) {
      // Fallback: if admin API not available, use signUp with auto-confirm disabled
      return NextResponse.json(
        { error: `Failed to send invite: ${inviteError.message}` },
        { status: 500 },
      );
    }

    return NextResponse.json({ message: `Invite sent to ${parsed.data.email}` }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
