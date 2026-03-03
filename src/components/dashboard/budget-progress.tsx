import { cn } from '@/lib/utils';
import { formatKES } from '@/lib/utils';
import { getBudgetStatus } from '@/lib/validations/budget';

interface BudgetProgressProps {
  categoryName: string;
  categoryColor?: string | null;
  spent: number;
  budget: number;
}

export function BudgetProgress({
  categoryName,
  categoryColor,
  spent,
  budget,
}: BudgetProgressProps) {
  const { percentage, color } = getBudgetStatus(spent, budget);

  const barColorClass =
    color === 'red' ? 'bg-red-500' : color === 'amber' ? 'bg-amber-500' : 'bg-green-500';

  const textColorClass =
    color === 'red'
      ? 'text-red-600 dark:text-red-400'
      : color === 'amber'
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-green-600 dark:text-green-400';

  return (
    <div className="space-y-1.5" data-testid="budget-progress">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-2">
          {categoryColor && (
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: categoryColor }}
            />
          )}
          <span className="font-medium">{categoryName}</span>
        </span>
        <span className={cn('font-medium', textColorClass)}>
          {formatKES(spent)} / {formatKES(budget)}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
        <div
          className={cn('h-full rounded-full transition-all duration-300', barColorClass)}
          style={{ width: `${Math.min(percentage, 100)}%` }}
          data-testid="budget-progress-bar"
        />
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>{Math.round(percentage)}% used</span>
        <span>{formatKES(Math.max(budget - spent, 0))} remaining</span>
      </div>
    </div>
  );
}
