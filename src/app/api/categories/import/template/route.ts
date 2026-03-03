import { NextResponse } from 'next/server';
import { getAuthContext, requireAdmin } from '@/lib/supabase/auth-helpers';

const TEMPLATE = `name,type,parent_category,color,icon,sort_order
Food & Groceries,expense,,#2563EB,,1
Household Goods,expense,Food & Groceries,,,2
Salary,income,,#22c55e,,1`;

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;
    const adminCheck = requireAdmin(auth.context);
    if (adminCheck) return adminCheck;

    return new NextResponse(TEMPLATE, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="famfin-categories-template.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
