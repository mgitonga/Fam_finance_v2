import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';

type RouteParams = { params: Promise<{ id: string }> };

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const adminCheck = requireAdmin(auth.context);
    if (adminCheck) return adminCheck;

    // Cannot remove yourself
    if (id === auth.context.userId) {
      return NextResponse.json({ error: 'Cannot remove yourself' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify user belongs to the same household
    const { data: targetUser, error: fetchError } = await supabase
      .from('users')
      .select('id, name, role, household_id')
      .eq('id', id)
      .eq('household_id', auth.context.householdId)
      .single();

    if (fetchError || !targetUser) {
      return NextResponse.json({ error: 'User not found in your household' }, { status: 404 });
    }

    // Cannot remove the last admin
    if (targetUser.role === 'admin') {
      const { count } = await supabase
        .from('users')
        .select('id', { count: 'exact', head: true })
        .eq('household_id', auth.context.householdId)
        .eq('role', 'admin');

      if ((count ?? 0) <= 1) {
        return NextResponse.json(
          { error: 'Cannot remove the last admin from the household' },
          { status: 400 },
        );
      }
    }

    // Soft-remove: null out household_id
    const adminSupabase = createAdminClient();

    const { error: updateError } = await adminSupabase
      .from('users')
      .update({ household_id: null })
      .eq('id', id);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Force sign-out the removed user
    await adminSupabase.auth.admin.signOut(id);

    return NextResponse.json({ message: `${targetUser.name} has been removed from the household` });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
