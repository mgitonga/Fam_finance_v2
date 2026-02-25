import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export type AuthContext = {
  userId: string;
  householdId: string;
  role: 'admin' | 'contributor';
};

export async function getAuthContext(): Promise<
  { success: true; context: AuthContext } | { success: false; response: NextResponse }
> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return {
      success: false,
      response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('household_id, role')
    .eq('id', user.id)
    .single<{ household_id: string | null; role: string }>();

  if (!profile?.household_id) {
    return {
      success: false,
      response: NextResponse.json({ error: 'No household found' }, { status: 403 }),
    };
  }

  return {
    success: true,
    context: {
      userId: user.id,
      householdId: profile.household_id,
      role: profile.role as 'admin' | 'contributor',
    },
  };
}

export function requireAdmin(context: AuthContext): NextResponse | null {
  if (context.role !== 'admin') {
    return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
  }
  return null;
}
