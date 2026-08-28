import EmptyState from '@/components/ui/EmptyState';
import { Inbox } from 'lucide-react';

export default function InboxPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Reply Inbox</h1>
      <EmptyState
        icon={Inbox}
        title="No replies yet"
        description="Replies from your WhatsApp campaigns will appear here."
      />
    </div>
  );
}
