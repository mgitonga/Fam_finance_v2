'use client';

import { useState, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable';
import { Settings2, X, RotateCcw, Loader2 } from 'lucide-react';
import { DASHBOARD_WIDGETS, getDefaultPreferences } from '@/lib/dashboard-widgets';
import type { WidgetId } from '@/lib/dashboard-widgets';
import { SortableWidgetItem } from './sortable-widget-item';
import {
  useDashboardPreferences,
  useSaveDashboardPreferences,
  useResetDashboardPreferences,
} from '@/hooks/use-dashboard-preferences';
import type { DashboardPreferences } from '@/lib/validations/dashboard';

interface WidgetState {
  id: string;
  enabled: boolean;
}

export function CustomizeDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: savedPreferences } = useDashboardPreferences();
  const saveMutation = useSaveDashboardPreferences();
  const resetMutation = useResetDashboardPreferences();

  const [localWidgets, setLocalWidgets] = useState<WidgetState[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const openDialog = useCallback(() => {
    // Initialize local state from saved preferences or defaults
    const prefs = savedPreferences ?? getDefaultPreferences();
    setLocalWidgets(
      prefs
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((p) => ({ id: p.id, enabled: p.enabled })),
    );
    setIsOpen(true);
  }, [savedPreferences]);

  const closeDialog = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setLocalWidgets((items) => {
      const oldIndex = items.findIndex((i) => i.id === active.id);
      const newIndex = items.findIndex((i) => i.id === over.id);
      return arrayMove(items, oldIndex, newIndex);
    });
  }, []);

  const handleToggle = useCallback((id: string) => {
    setLocalWidgets((items) =>
      items.map((item) => (item.id === id ? { ...item, enabled: !item.enabled } : item)),
    );
  }, []);

  const handleMoveUp = useCallback((id: string) => {
    setLocalWidgets((items) => {
      const index = items.findIndex((i) => i.id === id);
      if (index <= 0) return items;
      return arrayMove(items, index, index - 1);
    });
  }, []);

  const handleMoveDown = useCallback((id: string) => {
    setLocalWidgets((items) => {
      const index = items.findIndex((i) => i.id === id);
      if (index >= items.length - 1) return items;
      return arrayMove(items, index, index + 1);
    });
  }, []);

  const handleReset = useCallback(() => {
    const defaults = getDefaultPreferences();
    setLocalWidgets(
      defaults
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((p) => ({ id: p.id, enabled: p.enabled })),
    );
  }, []);

  const handleSave = useCallback(async () => {
    const preferences: DashboardPreferences = localWidgets.map((w, index) => ({
      id: w.id as WidgetId,
      order: index,
      enabled: w.enabled,
    }));

    await saveMutation.mutateAsync(preferences);
    setIsOpen(false);
  }, [localWidgets, saveMutation]);

  const handleResetAndSave = useCallback(async () => {
    await resetMutation.mutateAsync();
    setIsOpen(false);
  }, [resetMutation]);

  const enabledCount = localWidgets.filter((w) => w.enabled).length;
  const isSaving = saveMutation.isPending || resetMutation.isPending;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={openDialog}
        className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
        data-testid="customize-dashboard-button"
      >
        <Settings2 className="h-4 w-4" />
        Customize
      </button>

      {/* Modal overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={closeDialog} aria-hidden="true" />

          {/* Dialog */}
          <div
            className="relative mx-4 flex max-h-[85vh] w-full max-w-lg flex-col rounded-xl border bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
            role="dialog"
            aria-modal="true"
            aria-label="Customize Dashboard"
            data-testid="customize-dialog"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b px-5 py-4 dark:border-gray-700">
              <div>
                <h2 className="text-lg font-semibold">Customize Dashboard</h2>
                <p className="mt-0.5 text-sm text-gray-500">
                  Drag to reorder, toggle to show/hide widgets
                </p>
              </div>
              <button
                onClick={closeDialog}
                className="rounded-md p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                aria-label="Close dialog"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Sortable list */}
            <div className="flex-1 overflow-y-auto px-5 py-3">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localWidgets.map((w) => w.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {localWidgets.map((widget, index) => {
                      const def = DASHBOARD_WIDGETS.find((w) => w.id === widget.id);
                      if (!def) return null;

                      return (
                        <SortableWidgetItem
                          key={widget.id}
                          widget={def}
                          enabled={widget.enabled}
                          isFirst={index === 0}
                          isLast={index === localWidgets.length - 1}
                          isLastEnabled={widget.enabled && enabledCount <= 1}
                          onToggle={handleToggle}
                          onMoveUp={handleMoveUp}
                          onMoveDown={handleMoveDown}
                        />
                      );
                    })}
                  </div>
                </SortableContext>
              </DndContext>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t px-5 py-3 dark:border-gray-700">
              <button
                onClick={handleResetAndSave}
                disabled={isSaving}
                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-400 dark:hover:bg-gray-800"
                data-testid="reset-defaults-button"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to Default
              </button>

              <div className="flex gap-2">
                <button
                  onClick={closeDialog}
                  disabled={isSaving}
                  className="rounded-md border px-4 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || enabledCount === 0}
                  className="inline-flex items-center gap-1.5 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                  data-testid="save-preferences-button"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
