import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/supabase/auth-helpers';

const CSV_TEMPLATE = `date,type,amount,category,sub_category,account,description,merchant,payment_method,notes
15/01/2026,expense,2500,Food & Groceries,Household Goods,Joint Account,Weekly shopping,Naivas,mobile_money,
01/01/2026,income,150000,Salary,,Joint Account,January salary,Employer,bank_transfer,`;

export async function GET() {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    return new NextResponse(CSV_TEMPLATE, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="famfin-import-template.csv"',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
