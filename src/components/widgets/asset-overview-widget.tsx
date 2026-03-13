'use client';

import { formatKES } from '@/lib/utils';
import { Building2, TrendingUp, TrendingDown } from 'lucide-react';
import { ASSET_TYPE_LABELS } from '@/lib/validations/asset';
import Link from 'next/link';

type AssetSummary = {
  id: string;
  name: string;
  type: string;
  current_value: number;
  purchase_price: number;
};

interface AssetOverviewWidgetProps {
  assets: AssetSummary[];
  totalValue: number;
}

export function AssetOverviewWidget({ assets, totalValue }: AssetOverviewWidgetProps) {
  const topAssets = [...assets]
    .sort((a, b) => Number(b.current_value) - Number(a.current_value))
    .slice(0, 3);

  return (
    <div
      className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
      data-testid="asset-overview-widget"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Asset Overview</h3>
        <Link href="/assets" className="text-primary text-xs hover:underline">
          View all
        </Link>
      </div>
      <p className="mt-2 text-2xl font-bold text-blue-600">{formatKES(totalValue)}</p>
      <p className="text-xs text-gray-500">{assets.length} total assets</p>

      {topAssets.length > 0 ? (
        <div className="mt-3 space-y-2">
          {topAssets.map((asset) => {
            const change = Number(asset.current_value) - Number(asset.purchase_price);
            const isUp = change >= 0;
            return (
              <div
                key={asset.id}
                className="flex items-center justify-between border-t pt-2 text-sm dark:border-gray-800"
              >
                <div className="flex items-center gap-2">
                  <Building2 className="h-3 w-3 text-gray-400" />
                  <div>
                    <p className="font-medium">{asset.name}</p>
                    <p className="text-xs text-gray-500">
                      {ASSET_TYPE_LABELS[asset.type] || asset.type}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatKES(Number(asset.current_value))}</p>
                  <p
                    className={`flex items-center justify-end gap-0.5 text-xs ${isUp ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {isUp ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {isUp ? '+' : ''}
                    {formatKES(change)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-3 text-center text-sm text-gray-500">No assets tracked yet</p>
      )}
    </div>
  );
}
