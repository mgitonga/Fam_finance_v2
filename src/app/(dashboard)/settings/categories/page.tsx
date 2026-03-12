'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createCategorySchema, type CreateCategoryInput } from '@/lib/validations/category';
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from '@/hooks/use-categories';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  ChevronRight,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { Modal } from '@/components/ui/modal';
import { DynamicIcon } from '@/components/ui/dynamic-icon';
import { IconPicker } from '@/components/ui/icon-picker';

type CategoryWithChildren = {
  id: string;
  name: string;
  type: string;
  icon: string | null;
  color: string | null;
  sort_order: number;
  parent_id: string | null;
  children?: CategoryWithChildren[];
};

export default function CategoriesSettingsPage() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [parentId, setParentId] = useState<string | null>(null);

  // Import/Export state
  const [importStep, setImportStep] = useState<'idle' | 'preview' | 'result'>('idle');
  const [importPreview, setImportPreview] = useState<{
    rows: {
      row: number;
      name: string;
      type: string;
      parent_category: string;
      action: string;
      errors: string[];
      valid: boolean;
    }[];
    summary: { total: number; toCreate: number; toSkip: number; errors: number };
  } | null>(null);
  const [importResult, setImportResult] = useState<{
    created: number;
    skipped: number;
    errors: number;
    errorDetails: { row: number; error: string }[];
  } | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { name: '', type: 'expense', sort_order: 0 },
  });

  const selectedIcon = watch('icon');

  function startCreate(pId?: string) {
    setEditingId(null);
    setParentId(pId || null);
    reset({ name: '', type: 'expense', sort_order: 0, parent_id: pId || null });
    setShowForm(true);
  }

  function startEdit(cat: CategoryWithChildren) {
    setEditingId(cat.id);
    setParentId(cat.parent_id);
    reset({
      name: cat.name,
      type: cat.type as CreateCategoryInput['type'],
      color: cat.color,
      icon: cat.icon,
      sort_order: cat.sort_order,
      parent_id: cat.parent_id,
    });
    setShowForm(true);
  }

  function cancelForm() {
    setShowForm(false);
    setEditingId(null);
    setParentId(null);
    reset({ name: '', type: 'expense', sort_order: 0 });
  }

  async function onSubmit(data: CreateCategoryInput) {
    try {
      if (editingId) {
        await updateCategory.mutateAsync({ id: editingId, data });
      } else {
        await createCategory.mutateAsync({ ...data, parent_id: parentId });
      }
      cancelForm();
    } catch {
      // Error handled by mutation
    }
  }

  async function handleDelete(id: string) {
    if (confirm('Deactivate this category? Sub-categories will also be deactivated.')) {
      await deleteCategory.mutateAsync(id);
    }
  }

  const typeBadge = (type: string) => {
    const colors: Record<string, string> = {
      expense: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
      income: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
      both: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    };
    return (
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[type] || ''}`}>
        {type}
      </span>
    );
  };

  // ---- Import/Export handlers ----

  async function handleExport() {
    const response = await fetch('/api/categories/export');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'famfin-categories.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportTemplate() {
    const response = await fetch('/api/categories/import/template');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'famfin-categories-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleImportUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportError(null);
    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await fetch('/api/categories/import/preview', {
        method: 'POST',
        body: formData,
      });
      const json = await response.json();
      if (!response.ok) {
        setImportError(json.error || 'Failed to parse CSV');
        return;
      }
      setImportPreview(json.data);
      setImportStep('preview');
    } catch {
      setImportError('Failed to upload file');
    } finally {
      setImportLoading(false);
    }
  }

  async function handleImportConfirm() {
    if (!importPreview) return;
    const validRows = importPreview.rows.filter((r) => r.valid && r.action === 'create');
    if (validRows.length === 0) {
      setImportError('No valid rows to import');
      return;
    }

    setImportLoading(true);
    setImportError(null);
    try {
      const response = await fetch('/api/categories/import/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rows: validRows }),
      });
      const json = await response.json();
      if (!response.ok) {
        setImportError(json.error || 'Import failed');
        return;
      }
      setImportResult(json.data);
      setImportStep('result');
    } catch {
      setImportError('Import failed');
    } finally {
      setImportLoading(false);
    }
  }

  function resetImport() {
    setImportStep('idle');
    setImportPreview(null);
    setImportResult(null);
    setImportError(null);
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500">
        <Loader2 className="h-5 w-5 animate-spin" /> Loading categories...
      </div>
    );
  }

  return (
    <div data-testid="categories-settings">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Categories</h2>
          <p className="mt-1 text-sm text-gray-500">
            Manage expense and income categories with sub-categories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="flex items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
            data-testid="export-categories-btn"
          >
            <Download className="h-4 w-4" /> Export CSV
          </button>
          <label
            className="flex cursor-pointer items-center gap-1 rounded-md border px-3 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
            data-testid="import-categories-btn"
          >
            <Upload className="h-4 w-4" /> Import CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleImportUpload}
              disabled={importLoading}
            />
          </label>
          <button
            onClick={() => startCreate()}
            className="bg-primary hover:bg-primary/90 flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-white"
            data-testid="add-category-btn"
          >
            <Plus className="h-4 w-4" /> Add Category
          </button>
        </div>
      </div>

      {/* Import error */}
      {importError && (
        <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950 dark:text-red-400">
          {importError}
        </div>
      )}

      {/* Import preview */}
      {importStep === 'preview' && importPreview && (
        <div className="mt-4 space-y-4">
          <div className="flex items-center gap-4 rounded-lg border bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-blue-500" />
              <span className="font-medium">{importPreview.summary.total} rows</span>
            </div>
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>{importPreview.summary.toCreate} to create</span>
            </div>
            <div className="flex items-center gap-2 text-gray-500">
              <span>{importPreview.summary.toSkip} to skip (exist)</span>
            </div>
            {importPreview.summary.errors > 0 && (
              <div className="flex items-center gap-2 text-red-600">
                <XCircle className="h-4 w-4" />
                <span>{importPreview.summary.errors} errors</span>
              </div>
            )}
          </div>
          <div className="overflow-x-auto rounded-lg border dark:border-gray-800">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-gray-50 text-left dark:bg-gray-800">
                  <th className="px-3 py-2 font-medium">Row</th>
                  <th className="px-3 py-2 font-medium">Status</th>
                  <th className="px-3 py-2 font-medium">Name</th>
                  <th className="px-3 py-2 font-medium">Type</th>
                  <th className="px-3 py-2 font-medium">Parent</th>
                </tr>
              </thead>
              <tbody>
                {importPreview.rows.map((row) => (
                  <tr
                    key={row.row}
                    className={`border-b ${!row.valid ? 'bg-red-50 dark:bg-red-950/20' : row.action === 'skip' ? 'bg-gray-50 dark:bg-gray-800/30' : ''}`}
                  >
                    <td className="px-3 py-2">{row.row}</td>
                    <td className="px-3 py-2">
                      {row.valid ? (
                        row.action === 'create' ? (
                          <span className="text-xs font-medium text-green-600">Create</span>
                        ) : (
                          <span className="text-xs text-gray-400">Skip (exists)</span>
                        )
                      ) : (
                        <div>
                          {row.errors.map((e, i) => (
                            <p key={i} className="text-xs text-red-500">
                              {e}
                            </p>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 font-medium">{row.name}</td>
                    <td className="px-3 py-2 capitalize">{row.type}</td>
                    <td className="px-3 py-2">{row.parent_category || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleImportConfirm}
              disabled={importLoading || importPreview.summary.toCreate === 0}
              className="bg-primary hover:bg-primary/90 flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              data-testid="confirm-category-import"
            >
              {importLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Import {importPreview.summary.toCreate} categories
            </button>
            <button onClick={resetImport} className="rounded-md border px-4 py-2 text-sm">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Import result */}
      {importStep === 'result' && importResult && (
        <div className="mt-4 rounded-lg border bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <h3 className="text-lg font-semibold">Import Complete</h3>
              <p className="text-sm text-gray-500">
                {importResult.created} categories created, {importResult.skipped} skipped,{' '}
                {importResult.errors} errors
              </p>
            </div>
          </div>
          {importResult.errorDetails.length > 0 && (
            <div className="mt-3">
              <h4 className="text-sm font-medium text-red-600">Errors:</h4>
              <ul className="mt-1 space-y-1">
                {importResult.errorDetails.map((e, i) => (
                  <li key={i} className="text-xs text-red-500">
                    Row {e.row}: {e.error}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            onClick={resetImport}
            className="bg-primary hover:bg-primary/90 mt-4 rounded-md px-4 py-2 text-sm font-medium text-white"
          >
            Done
          </button>
        </div>
      )}

      <Modal
        open={showForm}
        onClose={cancelForm}
        title={editingId ? 'Edit Category' : parentId ? 'New Sub-Category' : 'New Category'}
      >
        <form onSubmit={handleSubmit(onSubmit)} data-testid="category-form">
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label htmlFor="cat-name" className="block text-sm font-medium">
                Name
              </label>
              <input
                id="cat-name"
                type="text"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                placeholder="e.g., Food & Groceries"
                data-testid="category-name"
                {...register('name')}
              />
              {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
            </div>
            <div>
              <label htmlFor="cat-type" className="block text-sm font-medium">
                Type
              </label>
              <select
                id="cat-type"
                className="mt-1 block w-full rounded-md border px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
                data-testid="category-type"
                {...register('type')}
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="both">Both</option>
              </select>
            </div>
            <div>
              <label htmlFor="cat-color" className="block text-sm font-medium">
                Color
              </label>
              <input
                id="cat-color"
                type="color"
                className="mt-1 block h-10 w-full rounded-md border px-1 dark:border-gray-700"
                defaultValue="#2563eb"
                onChange={(e) => setValue('color', e.target.value)}
                data-testid="category-color"
              />
              {errors.color && <p className="mt-1 text-xs text-red-500">{errors.color.message}</p>}
            </div>
          </div>
          <div className="mt-3">
            <label className="block text-sm font-medium">Icon</label>
            <IconPicker
              value={selectedIcon ?? null}
              onChange={(icon) => setValue('icon', icon)}
              className="mt-1"
            />
          </div>
          <div className="mt-4 flex gap-2 border-t pt-4 dark:border-gray-800">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 flex items-center rounded-md px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              data-testid="category-save"
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editingId ? 'Update' : 'Create'}
            </button>
            <button
              type="button"
              onClick={cancelForm}
              className="rounded-md border px-4 py-2 text-sm dark:border-gray-700"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      <div className="mt-4 space-y-1">
        {categories?.length === 0 && <p className="text-sm text-gray-500">No categories found.</p>}
        {categories?.map((cat: CategoryWithChildren) => (
          <div key={cat.id}>
            <div
              className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
              data-testid="category-row"
            >
              <div className="flex items-center gap-2">
                <DynamicIcon name={cat.icon} className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                {cat.color && (
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: cat.color }}
                  />
                )}
                <span className="font-medium">{cat.name}</span>
                {typeBadge(cat.type)}
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => startCreate(cat.id)}
                  className="text-primary rounded p-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-800"
                  title="Add sub-category"
                >
                  <Plus className="h-4 w-4" />
                </button>
                <button
                  onClick={() => startEdit(cat)}
                  className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Pencil className="h-4 w-4 text-gray-500" />
                </button>
                <button
                  onClick={() => handleDelete(cat.id)}
                  className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
            {/* Sub-categories */}
            {cat.children && cat.children.length > 0 && (
              <div className="ml-6 space-y-1 border-l pl-4">
                {cat.children.map((child: CategoryWithChildren) => (
                  <div
                    key={child.id}
                    className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    data-testid="subcategory-row"
                  >
                    <div className="flex items-center gap-2">
                      <ChevronRight className="h-3 w-3 text-gray-400" />
                      <DynamicIcon name={child.icon} className="h-3.5 w-3.5 text-gray-400" />
                      <span className="text-sm">{child.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => startEdit(child)}
                        className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Pencil className="h-3 w-3 text-gray-500" />
                      </button>
                      <button
                        onClick={() => handleDelete(child.id)}
                        className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
                      >
                        <Trash2 className="h-3 w-3 text-red-500" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
