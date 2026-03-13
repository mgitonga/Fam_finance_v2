'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAssets, useCreateAsset, useUpdateAsset, useDeleteAsset } from '@/hooks/use-assets';
import { type CreateAssetInput, ASSET_TYPE_LABELS } from '@/lib/validations/asset';
import { formatKES } from '@/lib/utils';
import { Modal } from '@/components/ui/modal';
import { AssetForm } from '@/components/forms/asset-form';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Building2,
  TrendingUp,
  TrendingDown,
  Package,
} from 'lucide-react';

type Asset = {
  id: string;
  name: string;
  classification: string;
  type: string;
  purchase_price: number;
  current_value: number;
  purchase_date: string;
  description: string | null;
};

export default function AssetsPage() {
  const { data: assets, isLoading } = useAssets();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();
  const [showForm, setShowForm] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [filter, setFilter] = useState<'all' | 'fixed' | 'current'>('all');

  function startEdit(e: React.MouseEvent, asset: Asset) {
    e.preventDefault();
    e.stopPropagation();
    setEditingAsset(asset);
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingAsset(null);
  }

  async function onSubmit(data: CreateAssetInput) {
    if (editingAsset) {
      await updateAsset.mutateAsync({ id: editingAsset.id, data });
    } else {
      await createAsset.mutateAsync(data);
    }
    cancelForm();
  }

  async function handleDelete(e: React.MouseEvent, id: string) {
    e.preventDefault();
    e.stopPropagation();
    if (confirm('Are you sure you want to remove this asset?')) {
      await deleteAsset.mutateAsync(id);
    }
  }

  const filteredAssets =
    assets?.filter((a: Asset) => filter === 'all' || a.classification === filter) ?? [];

  const totalValue =
    assets?.reduce((sum: number, a: Asset) => sum + Number(a.current_value), 0) ?? 0;
  const fixedValue =
    assets
      ?.filter((a: Asset) => a.classification === 'fixed')
      .reduce((sum: number, a: Asset) => sum + Number(a.current_value), 0) ?? 0;
  const currentValue =
    assets
      ?.filter((a: Asset) => a.classification === 'current')
      .reduce((sum: number, a: Asset) => sum + Number(a.current_value), 0) ?? 0;
  const assetCount = assets?.length ?? 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12" data-testid="assets-loading">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div data-testid="assets-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Assets</h1>
          <p className="mt-1 text-sm text-gray-500">Manage your fixed and current assets</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white"
          data-testid="add-asset-btn"
        >
          <Plus className="h-4 w-4" />
          Add Asset
        </button>
      </div>

      {/* Summary Cards */}
      <div
        className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        data-testid="asset-summary"
      >
        <SummaryCard
          icon={Building2}
          label="Total Assets"
          value={formatKES(totalValue)}
          color="text-blue-600"
        />
        <SummaryCard
          icon={Package}
          label="Fixed Assets"
          value={formatKES(fixedValue)}
          color="text-purple-600"
        />
        <SummaryCard
          icon={TrendingUp}
          label="Current Assets"
          value={formatKES(currentValue)}
          color="text-green-600"
        />
        <SummaryCard
          icon={Building2}
          label="Asset Count"
          value={assetCount.toString()}
          color="text-gray-600"
        />
      </div>

      {/* Filter Tabs */}
      <div className="mt-6 flex gap-1 border-b" data-testid="asset-filters">
        {(['all', 'fixed', 'current'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`border-b-2 px-4 py-2 text-sm font-medium capitalize transition-colors ${
              filter === f
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {f === 'all' ? 'All' : f === 'fixed' ? 'Fixed Assets' : 'Current Assets'}
          </button>
        ))}
      </div>

      {/* Asset Cards Grid */}
      {filteredAssets.length === 0 ? (
        <div className="mt-8 text-center text-gray-500" data-testid="no-assets">
          <Building2 className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-2">No assets found.</p>
          <p className="text-sm">Click &ldquo;Add Asset&rdquo; to get started.</p>
        </div>
      ) : (
        <div
          className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
          data-testid="asset-grid"
        >
          {filteredAssets.map((asset: Asset) => {
            const valueChange = Number(asset.current_value) - Number(asset.purchase_price);
            const valueChangePct =
              Number(asset.purchase_price) > 0
                ? Math.round((valueChange / Number(asset.purchase_price)) * 100)
                : 0;
            const isUp = valueChange >= 0;

            return (
              <Link
                key={asset.id}
                href={`/assets/${asset.id}`}
                className="group relative rounded-lg border bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-800 dark:bg-gray-900"
                data-testid="asset-card"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold">{asset.name}</h3>
                    <span className="mt-1 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize dark:bg-gray-800">
                      {ASSET_TYPE_LABELS[asset.type] || asset.type}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      asset.classification === 'fixed'
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                    }`}
                  >
                    {asset.classification === 'fixed' ? 'Fixed' : 'Current'}
                  </span>
                </div>

                <div className="mt-3">
                  <p className="text-lg font-bold">{formatKES(Number(asset.current_value))}</p>
                  <p className="text-xs text-gray-500">
                    Purchased: {formatKES(Number(asset.purchase_price))}
                  </p>
                </div>

                <div className="mt-2 flex items-center gap-1">
                  {isUp ? (
                    <TrendingUp className="h-3 w-3 text-green-600" />
                  ) : (
                    <TrendingDown className="h-3 w-3 text-red-600" />
                  )}
                  <span
                    className={`text-xs font-medium ${isUp ? 'text-green-600' : 'text-red-600'}`}
                  >
                    {isUp ? '+' : ''}
                    {formatKES(valueChange)} ({valueChangePct}%)
                  </span>
                </div>

                {/* Hover Actions */}
                <div className="absolute top-2 right-2 hidden gap-1 group-hover:flex">
                  <button
                    onClick={(e) => startEdit(e, asset)}
                    className="rounded-md bg-white p-1 shadow hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                    title="Edit"
                    data-testid="edit-asset-btn"
                  >
                    <Pencil className="h-4 w-4 text-gray-500" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, asset.id)}
                    className="rounded-md bg-white p-1 shadow hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700"
                    title="Delete"
                    data-testid="delete-asset-btn"
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </button>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Form Modal */}
      <Modal
        open={showForm}
        onClose={cancelForm}
        title={editingAsset ? 'Edit Asset' : 'Add New Asset'}
      >
        <AssetForm
          defaultValues={
            editingAsset
              ? {
                  name: editingAsset.name,
                  classification: editingAsset.classification as 'fixed' | 'current',
                  type: editingAsset.type as CreateAssetInput['type'],
                  purchase_price: Number(editingAsset.purchase_price),
                  current_value: Number(editingAsset.current_value),
                  purchase_date: editingAsset.purchase_date,
                  description: editingAsset.description,
                }
              : undefined
          }
          onSubmit={onSubmit}
          onCancel={cancelForm}
          isEditing={!!editingAsset}
        />
      </Modal>
    </div>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{label}</p>
        <Icon className={`h-5 w-5 ${color}`} />
      </div>
      <p className={`mt-2 text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
