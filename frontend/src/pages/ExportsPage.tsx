import EmptyState from '@/components/ui/EmptyState';
import { Download } from 'lucide-react';

export default function ExportsPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Exports</h1>
      <EmptyState
        icon={Download}
        title="No exports yet"
        description="Export campaign data to Excel from the campaign detail page."
      />
    </div>
  );
}
