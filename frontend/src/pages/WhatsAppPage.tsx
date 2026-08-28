import EmptyState from '@/components/ui/EmptyState';
import { MessageSquare } from 'lucide-react';

export default function WhatsAppPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">WhatsApp Connection</h1>
      <EmptyState
        icon={MessageSquare}
        title="Connect your WhatsApp"
        description="Scan the QR code to link your WhatsApp account and start messaging."
        actionLabel="Connect WhatsApp"
        onAction={() => {}}
      />
    </div>
  );
}
