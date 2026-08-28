import EmptyState from '@/components/ui/EmptyState';
import { Users } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function ContactsPage() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Contacts</h1>
      </div>
      <EmptyState
        icon={Users}
        title="No contacts yet"
        description="Import contacts from an Excel file to get started."
        actionLabel="Import Contacts"
        onAction={() => navigate('/import')}
      />
    </div>
  );
}
