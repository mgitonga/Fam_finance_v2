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
import { Loader2, Plus, Pencil, Trash2, X, ChevronRight } from 'lucide-react';

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

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateCategoryInput>({
    resolver: zodResolver(createCategorySchema),
    defaultValues: { name: '', type: 'expense', sort_order: 0 },
  });

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
        {!showForm && (
          <button
            onClick={() => startCreate()}
            className="bg-primary hover:bg-primary/90 flex items-center gap-1 rounded-md px-3 py-2 text-sm font-medium text-white"
            data-testid="add-category-btn"
          >
            <Plus className="h-4 w-4" /> Add Category
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="mt-4 rounded-lg border bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900"
          data-testid="category-form"
        >
          <div className="flex items-center justify-between">
            <h3 className="font-medium">
              {editingId ? 'Edit Category' : parentId ? 'New Sub-Category' : 'New Category'}
            </h3>
            <button
              type="button"
              onClick={cancelForm}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
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
          <div className="mt-3 flex gap-2">
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
              className="rounded-md border px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="mt-4 space-y-1">
        {categories?.length === 0 && <p className="text-sm text-gray-500">No categories found.</p>}
        {categories?.map((cat: CategoryWithChildren) => (
          <div key={cat.id}>
            <div
              className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
              data-testid="category-row"
            >
              <div className="flex items-center gap-2">
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
