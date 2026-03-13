import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getAuthContext } from '@/lib/supabase/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthContext();
    if (!auth.success) return auth.response;

    const { searchParams } = new URL(request.url);
    const months = parseInt(searchParams.get('months') || '12');

    const supabase = await createClient();
    const hid = auth.context.householdId;

    const now = new Date();
    const data: {
      month: string;
      netWorth: number;
      assets: number;
      accounts: number;
      debts: number;
    }[] = [];

    // Fetch all assets with valuations for the household (including disposed ones for historical)
    const { data: allAssets } = await supabase
      .from('assets')
      .select(
        'id, purchase_price, purchase_date, current_value, is_active, disposed_at, created_at',
      )
      .eq('household_id', hid);

    const { data: allValuations } = await supabase
      .from('asset_valuations')
      .select('asset_id, value, date')
      .in(
        'asset_id',
        (allAssets || []).map((a) => a.id),
      )
      .order('date', { ascending: true });

    for (let i = months - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth() + 1;
      const y = d.getFullYear();
      const endDate = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, '0')}-01`;
      const label = `${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][m - 1]} ${y}`;

      // Account balances (simplified: use current balances)
      const { data: accountsData } = await supabase
        .from('accounts')
        .select('balance')
        .eq('household_id', hid)
        .eq('is_active', true);

      const totalAccounts = (accountsData || []).reduce((s, a) => s + Number(a.balance), 0);

      // Debts (simplified: use current debts)
      const { data: debtsData } = await supabase
        .from('debts')
        .select('outstanding_balance')
        .eq('household_id', hid)
        .eq('is_active', true);

      const totalDebt = (debtsData || []).reduce((s, dd) => s + Number(dd.outstanding_balance), 0);

      // Calculate total asset value at this month's end
      let totalAssets = 0;
      for (const asset of allAssets || []) {
        // Skip assets created after this period
        if (asset.created_at > endDate) continue;
        // Skip assets disposed before this period
        if (
          !asset.is_active &&
          asset.disposed_at &&
          asset.disposed_at < `${y}-${String(m).padStart(2, '0')}-01`
        )
          continue;

        // Find the most recent valuation on or before endDate
        const assetValuations = (allValuations || []).filter(
          (v) => v.asset_id === asset.id && v.date < endDate,
        );

        if (assetValuations.length > 0) {
          totalAssets += Number(assetValuations[assetValuations.length - 1].value);
        } else {
          totalAssets += Number(asset.purchase_price);
        }
      }

      const netWorth = totalAssets + totalAccounts - totalDebt;
      data.push({
        month: label,
        netWorth,
        assets: totalAssets,
        accounts: totalAccounts,
        debts: totalDebt,
      });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
