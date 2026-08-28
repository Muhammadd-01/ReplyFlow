import { cn } from '@/utils/cn';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'increase' | 'decrease';
  description?: string;
  className?: string;
}

export default function StatCard({ title, value, icon: Icon, change, changeType, description, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800',
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
        <div className="rounded-lg bg-primary-50 p-3 dark:bg-primary-900/20">
          <Icon className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
      </div>
      {(change || description) && (
        <div className="mt-3 flex items-center gap-2">
          {change && changeType && (
            <span
              className={cn(
                'inline-flex items-center gap-1 text-xs font-medium',
                changeType === 'increase' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
              )}
            >
              {changeType === 'increase' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {change}
            </span>
          )}
          {description && <span className="text-xs text-gray-500 dark:text-gray-400">{description}</span>}
        </div>
      )}
    </div>
  );
}
