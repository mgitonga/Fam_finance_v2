'use client';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  GripVertical,
  ChevronUp,
  ChevronDown,
  LayoutGrid,
  BarChart3,
  TrendingUp,
  Receipt,
  CalendarClock,
  PiggyBank,
  Wallet,
  Target,
  BarChartBig,
} from 'lucide-react';
import type { WidgetDefinition } from '@/lib/dashboard-widgets';

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutGrid,
  BarChart3,
  TrendingUp,
  Receipt,
  CalendarClock,
  PiggyBank,
  Wallet,
  Target,
  BarChartBig,
};

interface SortableWidgetItemProps {
  widget: WidgetDefinition;
  enabled: boolean;
  isFirst: boolean;
  isLast: boolean;
  isLastEnabled: boolean;
  onToggle: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
}

export function SortableWidgetItem({
  widget,
  enabled,
  isFirst,
  isLast,
  isLastEnabled,
  onToggle,
  onMoveUp,
  onMoveDown,
}: SortableWidgetItemProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: widget.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = ICON_MAP[widget.icon];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 ${
        isDragging
          ? 'z-10 border-blue-300 bg-blue-50 shadow-lg dark:border-blue-700 dark:bg-blue-950'
          : enabled
            ? 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
            : 'border-gray-100 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-gray-950'
      }`}
      data-testid={`sortable-widget-${widget.id}`}
    >
      {/* Drag handle */}
      <button
        className="cursor-grab touch-none rounded p-1 text-gray-400 hover:text-gray-600 active:cursor-grabbing dark:hover:text-gray-300"
        aria-label={`Drag to reorder ${widget.label}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>

      {/* Icon + label */}
      <div className="flex flex-1 items-center gap-2.5 overflow-hidden">
        {Icon && (
          <Icon
            className={`h-4 w-4 shrink-0 ${enabled ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400 dark:text-gray-600'}`}
          />
        )}
        <div className="min-w-0">
          <p
            className={`text-sm font-medium ${
              enabled
                ? 'text-gray-900 dark:text-gray-100'
                : 'text-gray-500 line-through dark:text-gray-500'
            }`}
          >
            {widget.label}
          </p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{widget.description}</p>
        </div>
      </div>

      {/* Arrow buttons */}
      <div className="flex flex-col gap-0.5">
        <button
          onClick={() => onMoveUp(widget.id)}
          disabled={isFirst}
          className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:invisible dark:hover:text-gray-300"
          aria-label={`Move ${widget.label} up`}
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={() => onMoveDown(widget.id)}
          disabled={isLast}
          className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:invisible dark:hover:text-gray-300"
          aria-label={`Move ${widget.label} down`}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Toggle */}
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={enabled}
          disabled={enabled && isLastEnabled}
          onChange={() => onToggle(widget.id)}
          className="peer sr-only"
          aria-label={`${widget.label} ${enabled ? 'enabled' : 'disabled'}`}
        />
        <div
          className={`peer h-5 w-9 rounded-full peer-disabled:cursor-not-allowed peer-disabled:opacity-50 after:absolute after:top-[2px] after:left-[2px] after:h-4 after:w-4 after:rounded-full after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full ${
            enabled ? 'bg-blue-600 dark:bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
          }`}
        />
      </label>
    </div>
  );
}
