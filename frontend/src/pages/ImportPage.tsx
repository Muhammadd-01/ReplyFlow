import EmptyState from '@/components/ui/EmptyState';
import { Upload } from 'lucide-react';

export default function ImportPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Import Contacts</h1>
      <EmptyState
        icon={Upload}
        title="Upload Excel File"
        description="Upload a .xlsx, .xls, or .csv file containing phone numbers and contact information."
        actionLabel="Upload File"
        onAction={() => {}}
      />
    </div>
  );
}
