'use client';

import { useState } from 'react';
import { useAccounts } from '@/hooks/use-accounts';
import { useDisposeAsset } from '@/hooks/use-assets';
import { formatKES } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { Loader2, AlertTriangle } from 'lucide-react';

interface DisposeAssetDialogProps {
  asset: { id: string; name: string; current_value: number };
  open: boolean;
  onClose: () => void;
}

export function DisposeAssetDialog({ asset, open, onClose }: DisposeAssetDialogProps) {
  const { data: accounts } = useAccounts();
  const disposeAsset = useDisposeAsset();

  const [disposalAmount, setDisposalAmount] = useState(Number(asset.current_value));
  const [accountId, setAccountId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState(`Sale of ${asset.name}`);

  async function handleDispose() {
    if (!accountId) return;

    await disposeAsset.mutateAsync({
      id: asset.id,
      data: {
        disposal_amount: disposalAmount,
        account_id: accountId,
        date,
        description,
      },
    });

    onClose();
  }

  return (
    <Modal open={open} onClose={onClose} title="Dispose Asset">
      <div className="space-y-4" data-testid="dispose-asset-dialog">
        <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-950">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800 dark:text-amber-200">
            This will mark <strong>{asset.name}</strong> as disposed and create an income
            transaction of <strong>{formatKES(disposalAmount)}</strong> in your selected account.
          </p>
        </div>

        {/* Disposal Amount */}
        <div>
          <label htmlFor="disposal_amount" className="block text-sm font-medium">
            Sale Amount (KES)
          </label>
          <input
            id="disposal_amount"
            type="number"
            step="0.01"
            min="0"
            value={disposalAmount}
            onChange={(e) => setDisposalAmount(Number(e.target.value))}
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            data-testid="dispose-amount"
          />
        </div>

        {/* Account */}
        <div>
          <label htmlFor="dispose_account" className="block text-sm font-medium">
            Receive Funds Into
          </label>
          <select
            id="dispose_account"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            data-testid="dispose-account"
          >
            <option value="">Select account...</option>
            {accounts?.map((acc: { id: string; name: string }) => (
              <option key={acc.id} value={acc.id}>
                {acc.name}
              </option>
            ))}
          </select>
        </div>

        {/* Date */}
        <div>
          <label htmlFor="dispose_date" className="block text-sm font-medium">
            Disposal Date
          </label>
          <input
            id="dispose_date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            data-testid="dispose-date"
          />
        </div>

        {/* Description */}
        <div>
          <label htmlFor="dispose_description" className="block text-sm font-medium">
            Description
          </label>
          <input
            id="dispose_description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            data-testid="dispose-description"
          />
        </div>

        <div className="flex gap-2 border-t pt-4 dark:border-gray-800">
          <button
            type="button"
            onClick={handleDispose}
            disabled={!accountId || disposeAsset.isPending}
            className="flex items-center rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
            data-testid="dispose-confirm"
          >
            {disposeAsset.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Dispose Asset
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border px-4 py-2 text-sm dark:border-gray-700"
          >
            Cancel
          </button>
        </div>
      </div>
    </Modal>
  );
}
