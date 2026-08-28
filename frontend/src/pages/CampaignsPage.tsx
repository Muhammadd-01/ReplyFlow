import EmptyState from '@/components/ui/EmptyState';
import { Send } from 'lucide-react';
import { useNavigate } from 'react-router';

export default function CampaignsPage() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Campaigns</h1>
      </div>
      <EmptyState
        icon={Send}
        title="No campaigns yet"
        description="Create your first campaign to start collecting WhatsApp replies."
        actionLabel="Create Campaign"
        onAction={() => navigate('/campaigns/new')}
      />
    </div>
  );
}
