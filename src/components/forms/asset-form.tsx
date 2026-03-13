'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  createAssetSchema,
  type CreateAssetInput,
  CLASSIFICATION_TYPE_MAP,
  ASSET_TYPE_LABELS,
} from '@/lib/validations/asset';
import { Loader2 } from 'lucide-react';

interface AssetFormProps {
  defaultValues?: Partial<CreateAssetInput>;
  onSubmit: (data: CreateAssetInput) => Promise<void>;
  onCancel: () => void;
  isEditing?: boolean;
}

export function AssetForm({ defaultValues, onSubmit, onCancel, isEditing }: AssetFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateAssetInput>({
    resolver: zodResolver(createAssetSchema),
    defaultValues: {
      name: '',
      classification: 'fixed',
      type: 'real_estate',
      purchase_price: 0,
      current_value: 0,
      purchase_date: new Date().toISOString().split('T')[0],
      description: '',
      ...defaultValues,
    },
  });

  const classification = watch('classification');
  const currentType = watch('type');

  // When classification changes, reset type to first valid option if current is invalid
  useEffect(() => {
    const validTypes = CLASSIFICATION_TYPE_MAP[classification] as readonly string[];
    if (!validTypes.includes(currentType)) {
      setValue('type', validTypes[0] as CreateAssetInput['type']);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classification]);

  const validTypes = CLASSIFICATION_TYPE_MAP[classification] as readonly string[];

  async function onFormSubmit(data: CreateAssetInput) {
    await onSubmit(data);
  }

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} data-testid="asset-form">
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Name */}
        <div className="sm:col-span-2">
          <label htmlFor="name" className="block text-sm font-medium">
            Asset Name
          </label>
          <input
            id="name"
            type="text"
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            placeholder="e.g., 3BR Apartment Kilimani"
            data-testid="asset-name"
            {...register('name')}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
        </div>

        {/* Classification */}
        <div>
          <label htmlFor="classification" className="block text-sm font-medium">
            Classification
          </label>
          <select
            id="classification"
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            data-testid="asset-classification"
            {...register('classification')}
          >
            <option value="fixed">Fixed Asset</option>
            <option value="current">Current Asset</option>
          </select>
        </div>

        {/* Type (filtered by classification) */}
        <div>
          <label htmlFor="type" className="block text-sm font-medium">
            Type
          </label>
          <select
            id="type"
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            data-testid="asset-type"
            {...register('type')}
          >
            {validTypes.map((t) => (
              <option key={t} value={t}>
                {ASSET_TYPE_LABELS[t] || t}
              </option>
            ))}
          </select>
          {errors.type && <p className="mt-1 text-xs text-red-500">{errors.type.message}</p>}
        </div>

        {/* Purchase Price */}
        <div>
          <label htmlFor="purchase_price" className="block text-sm font-medium">
            Purchase Price (KES)
          </label>
          <input
            id="purchase_price"
            type="number"
            step="0.01"
            min="0"
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            placeholder="0.00"
            data-testid="asset-purchase-price"
            {...register('purchase_price', { valueAsNumber: true })}
          />
          {errors.purchase_price && (
            <p className="mt-1 text-xs text-red-500">{errors.purchase_price.message}</p>
          )}
        </div>

        {/* Current Value */}
        <div>
          <label htmlFor="current_value" className="block text-sm font-medium">
            Current Value (KES)
          </label>
          <input
            id="current_value"
            type="number"
            step="0.01"
            min="0"
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            placeholder="0.00"
            data-testid="asset-current-value"
            {...register('current_value', { valueAsNumber: true })}
          />
          {errors.current_value && (
            <p className="mt-1 text-xs text-red-500">{errors.current_value.message}</p>
          )}
        </div>

        {/* Purchase Date */}
        <div>
          <label htmlFor="purchase_date" className="block text-sm font-medium">
            Purchase Date
          </label>
          <input
            id="purchase_date"
            type="date"
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            data-testid="asset-purchase-date"
            {...register('purchase_date')}
          />
          {errors.purchase_date && (
            <p className="mt-1 text-xs text-red-500">{errors.purchase_date.message}</p>
          )}
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            rows={2}
            className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            placeholder="Optional description..."
            data-testid="asset-description"
            {...register('description')}
          />
        </div>
      </div>

      <div className="mt-6 flex gap-2 border-t pt-4 dark:border-gray-800">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-primary hover:bg-primary/90 flex items-center rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          data-testid="asset-save"
        >
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEditing ? 'Update Asset' : 'Add Asset'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border px-4 py-2 text-sm dark:border-gray-700"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
