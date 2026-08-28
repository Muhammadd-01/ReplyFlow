import { cn } from '@/utils/cn';

type BarVariant = 'primary' | 'success' | 'warning' | 'danger';

interface ProgressBarProps {
  value: number;
  label?: string;
  variant?: BarVariant;
  showPercentage?: boolean;
  className?: string;
}

const variantColors: Record<BarVariant, string> = {
  primary: 'bg-primary-600 dark:bg-primary-500',
  success: 'bg-green-500',
  warning: 'bg-yellow-500',
  danger: 'bg-red-500',
};

export default function ProgressBar({ value, label, variant = 'primary', showPercentage = true, className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div className={cn('w-full', className)}>
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-1">
          {label && <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>}
          {showPercentage && <span className="text-sm text-gray-500 dark:text-gray-400">{Math.round(clamped)}%</span>}
        </div>
      )}
      <div className="w-full h-2.5 bg-gray-200 rounded-full dark:bg-gray-700 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500 ease-out', variantColors[variant])}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
