import { useParams, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { campaignsApi } from '@/api/campaigns';
import { exportApi } from '@/api/export';
import { toast } from 'sonner';

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignsApi.getCampaignById(id!),
    enabled: !!id,
  });

  const handleExport = async () => {
    try {
      const data = await exportApi.exportCampaign(id!);
      exportApi.downloadFile(data.downloadUrl);
      toast.success('Export downloaded');
    } catch (err) {
      toast.error('Failed to export campaign');
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;
  if (!campaign) return <div className="p-8 text-center text-red-500">Campaign not found</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => navigate('/campaigns')}
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{campaign.name}</h1>
              <Badge variant="info">{campaign.status}</Badge>
            </div>
            <p className="text-gray-500 text-sm">Created on {new Date(campaign.createdAt).toLocaleString()}</p>
          </div>
        </div>
        <Button leftIcon={<Download size={18} />} onClick={handleExport} variant="outline">
          Export Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500">Total Contacts</p>
          <p className="text-2xl font-bold">{campaign.totalContacts}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500">Sent</p>
          <p className="text-2xl font-bold text-blue-600">{campaign.sentCount}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500">Replied</p>
          <p className="text-2xl font-bold text-green-600">{campaign.repliedCount}</p>
        </Card>
        <Card className="p-4 text-center">
          <p className="text-sm text-gray-500">Failed</p>
          <p className="text-2xl font-bold text-red-600">{campaign.failedCount}</p>
        </Card>
      </div>
    </div>
  );
}
