'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAsset, useUpdateAsset, useAddValuation } from '@/hooks/use-assets';
import {
  type CreateAssetInput,
  ASSET_TYPE_LABELS,
  ASSET_CLASSIFICATION_LABELS,
} from '@/lib/validations/asset';
import { formatKES } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { AssetForm } from '@/components/forms/asset-form';
import { DisposeAssetDialog } from '@/components/forms/dispose-asset-dialog';
import { AssetValuationChart } from '@/components/charts/asset-valuation-chart';
import {
  Loader2,
  ArrowLeft,
  Pencil,
  TrendingUp,
  TrendingDown,
  Calendar,
  Trash2,
  Link2,
} from 'lucide-react';
import Link from 'next/link';

type Valuation = {
  id: string;
  value: number;
  date: string;
  notes: string | null;
};

export default function AssetDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: asset, isLoading } = useAsset(id);
  const updateAsset = useUpdateAsset();
  const addValuation = useAddValuation();

  const [showEditForm, setShowEditForm] = useState(false);
  const [showDisposeDialog, setShowDisposeDialog] = useState(false);
  const [showAddValuation, setShowAddValuation] = useState(false);
  const [newValValue, setNewValValue] = useState(0);
  const [newValDate, setNewValDate] = useState(new Date().toISOString().split('T')[0]);
  const [newValNotes, setNewValNotes] = useState('');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" data-testid="asset-detail-loading">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  if (!asset) {
    return (
      <div className="py-12 text-center" data-testid="asset-not-found">
        <p className="text-gray-500">Asset not found.</p>
        <Link href="/assets" className="text-primary mt-2 inline-block text-sm hover:underline">
          Back to Assets
        </Link>
      </div>
    );
  }

  const valueChange =
    asset.value_change ?? Number(asset.current_value) - Number(asset.purchase_price);
  const valueChangePct =
    asset.value_change_pct ??
    (Number(asset.purchase_price) > 0
      ? Math.round((valueChange / Number(asset.purchase_price)) * 100)
      : 0);
  const isUp = valueChange >= 0;

  async function handleEditSubmit(data: CreateAssetInput) {
    await updateAsset.mutateAsync({ id, data });
    setShowEditForm(false);
  }

  async function handleAddValuation() {
    await addValuation.mutateAsync({
      id,
      data: {
        value: newValValue,
        date: newValDate,
        notes: newValNotes || null,
      },
    });
    setShowAddValuation(false);
    setNewValValue(0);
    setNewValNotes('');
  }

  return (
    <div data-testid="asset-detail-page">
      {/* Back button + Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push('/assets')}
          className="rounded-md border p-2 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{asset.name}</h1>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                asset.classification === 'fixed'
                  ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                  : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
              }`}
            >
              {ASSET_CLASSIFICATION_LABELS[asset.classification] || asset.classification}
            </span>
            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium dark:bg-gray-800">
              {ASSET_TYPE_LABELS[asset.type] || asset.type}
            </span>
          </div>
          {asset.description && <p className="mt-1 text-sm text-gray-500">{asset.description}</p>}
        </div>
        <div className="flex gap-2">
          {asset.is_active && (
            <>
              <button
                onClick={() => setShowEditForm(true)}
                className="flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800"
                data-testid="edit-asset-detail-btn"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
              <button
                onClick={() => setShowDisposeDialog(true)}
                className="flex items-center gap-1 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700"
                data-testid="dispose-asset-btn"
              >
                <Trash2 className="h-4 w-4" />
                Dispose
              </button>
            </>
          )}
        </div>
      </div>

      {/* Disposed Banner */}
      {!asset.is_active && (
        <div
          className="mt-4 rounded-md border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-950"
          data-testid="disposed-banner"
        >
          <p className="text-sm font-medium text-red-800 dark:text-red-200">
            This asset was disposed on{' '}
            {asset.disposed_at ? new Date(asset.disposed_at).toLocaleDateString('en-GB') : 'N/A'}{' '}
            for {formatKES(Number(asset.disposal_amount ?? 0))}.
          </p>
          {asset.disposal_transaction_id && (
            <Link
              href={`/transactions?search=${encodeURIComponent(asset.name)}`}
              className="mt-1 inline-flex items-center gap-1 text-sm text-red-600 hover:underline dark:text-red-400"
            >
              <Link2 className="h-3 w-3" />
              View disposal transaction
            </Link>
          )}
        </div>
      )}

      {/* Key Metrics */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3" data-testid="asset-metrics">
        <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Purchase Price</p>
          <p className="mt-1 text-xl font-bold">{formatKES(Number(asset.purchase_price))}</p>
          <p className="mt-1 flex items-center gap-1 text-xs text-gray-500">
            <Calendar className="h-3 w-3" />
            {new Date(asset.purchase_date).toLocaleDateString('en-GB')}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Current Value</p>
          <p className="mt-1 text-xl font-bold">{formatKES(Number(asset.current_value))}</p>
        </div>
        <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm text-gray-500">Value Change</p>
          <div className="mt-1 flex items-center gap-2">
            {isUp ? (
              <TrendingUp className="h-5 w-5 text-green-600" />
            ) : (
              <TrendingDown className="h-5 w-5 text-red-600" />
            )}
            <p className={`text-xl font-bold ${isUp ? 'text-green-600' : 'text-red-600'}`}>
              {isUp ? '+' : ''}
              {formatKES(valueChange)}
            </p>
          </div>
          <p className={`mt-1 text-xs ${isUp ? 'text-green-600' : 'text-red-600'}`}>
            {isUp ? '+' : ''}
            {valueChangePct}%
          </p>
        </div>
      </div>

      {/* Valuation Chart */}
      <div className="mt-6 rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <h3 className="mb-4 text-lg font-semibold">Valuation History</h3>
        <AssetValuationChart
          data={(asset.valuations || []).map((v: Valuation) => ({
            date: v.date,
            value: Number(v.value),
          }))}
          purchasePrice={Number(asset.purchase_price)}
        />
      </div>

      {/* Valuation Entries Table */}
      <div className="mt-6 rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Valuation Entries</h3>
          {asset.is_active && (
            <button
              onClick={() => {
                setNewValValue(Number(asset.current_value));
                setShowAddValuation(true);
              }}
              className="bg-primary hover:bg-primary/90 rounded-md px-3 py-1.5 text-sm font-medium text-white"
              data-testid="add-valuation-btn"
            >
              Add Valuation
            </button>
          )}
        </div>
        {asset.valuations && asset.valuations.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-xs text-gray-500 dark:border-gray-800">
                  <th className="px-3 py-2">Date</th>
                  <th className="px-3 py-2 text-right">Value</th>
                  <th className="px-3 py-2">Notes</th>
                </tr>
              </thead>
              <tbody>
                {[...asset.valuations].reverse().map((v: Valuation) => (
                  <tr key={v.id} className="border-b dark:border-gray-800">
                    <td className="px-3 py-2 whitespace-nowrap">
                      {new Date(v.date).toLocaleDateString('en-GB')}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {formatKES(Number(v.value))}
                    </td>
                    <td className="px-3 py-2 text-gray-500">{v.notes || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-center text-sm text-gray-500">No valuation entries yet.</p>
        )}
      </div>

      {/* Edit Modal */}
      <Modal open={showEditForm} onClose={() => setShowEditForm(false)} title="Edit Asset">
        <AssetForm
          defaultValues={{
            name: asset.name,
            classification: asset.classification as 'fixed' | 'current',
            type: asset.type as CreateAssetInput['type'],
            purchase_price: Number(asset.purchase_price),
            current_value: Number(asset.current_value),
            purchase_date: asset.purchase_date,
            description: asset.description,
          }}
          onSubmit={handleEditSubmit}
          onCancel={() => setShowEditForm(false)}
          isEditing
        />
      </Modal>

      {/* Dispose Dialog */}
      {showDisposeDialog && (
        <DisposeAssetDialog
          asset={{
            id: asset.id,
            name: asset.name,
            current_value: Number(asset.current_value),
          }}
          open={showDisposeDialog}
          onClose={() => setShowDisposeDialog(false)}
        />
      )}

      {/* Add Valuation Modal */}
      <Modal
        open={showAddValuation}
        onClose={() => setShowAddValuation(false)}
        title="Add Valuation"
      >
        <div className="space-y-4" data-testid="add-valuation-form">
          <div>
            <label htmlFor="val_value" className="block text-sm font-medium">
              Value (KES)
            </label>
            <input
              id="val_value"
              type="number"
              step="0.01"
              min="0"
              value={newValValue}
              onChange={(e) => setNewValValue(Number(e.target.value))}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              data-testid="valuation-value"
            />
          </div>
          <div>
            <label htmlFor="val_date" className="block text-sm font-medium">
              Date
            </label>
            <input
              id="val_date"
              type="date"
              value={newValDate}
              onChange={(e) => setNewValDate(e.target.value)}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              data-testid="valuation-date"
            />
          </div>
          <div>
            <label htmlFor="val_notes" className="block text-sm font-medium">
              Notes
            </label>
            <input
              id="val_notes"
              type="text"
              value={newValNotes}
              onChange={(e) => setNewValNotes(e.target.value)}
              className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
              placeholder="Optional notes..."
              data-testid="valuation-notes"
            />
          </div>
          <div className="flex gap-2 border-t pt-4 dark:border-gray-800">
            <button
              onClick={handleAddValuation}
              disabled={addValuation.isPending}
              className="bg-primary hover:bg-primary/90 flex items-center rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              data-testid="valuation-save"
            >
              {addValuation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Valuation
            </button>
            <button
              onClick={() => setShowAddValuation(false)}
              className="rounded-md border px-4 py-2 text-sm dark:border-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
