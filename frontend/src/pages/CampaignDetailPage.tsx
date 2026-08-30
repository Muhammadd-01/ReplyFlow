import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { campaignsApi } from '@/api/campaigns';
import { exportApi } from '@/api/export';
import { toast } from 'sonner';
import { socket } from '@/lib/socket';

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', id],
    queryFn: () => campaignsApi.getCampaignById(id!),
    enabled: !!id,
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    const handleUpdate = (update: any) => {
      if (update.campaignId === id) {
        queryClient.invalidateQueries({ queryKey: ['campaign', id] });
      }
    };
    socket.on('campaignUpdate' as any, handleUpdate);
    return () => {
      socket.off('campaignUpdate' as any, handleUpdate);
    };
  }, [id, queryClient]);

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

      <Card className="overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recipients</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
            <thead className="bg-gray-50 dark:bg-gray-800/50 text-xs uppercase text-gray-700 dark:text-gray-400">
              <tr>
                <th className="px-6 py-3">Name</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Sent At</th>
                <th className="px-6 py-3">Reply</th>
              </tr>
            </thead>
            <tbody>
              {campaign.campaignContacts?.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No contacts found for this campaign.</td>
                </tr>
              )}
              {campaign.campaignContacts?.map((cc: any, idx: number) => (
                <tr key={cc._id || cc.id || idx} className="border-b dark:border-gray-700 bg-white dark:bg-gray-900">
                  <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                    {cc.contactId?.name || '-'}
                  </td>
                  <td className="px-6 py-4">{cc.contactId?.phoneNumber}</td>
                  <td className="px-6 py-4">
                    <Badge variant={cc.status === 'SENT' ? 'success' : cc.status === 'REPLIED' ? 'info' : cc.status === 'FAILED' ? 'danger' : 'default'}>
                      {cc.status}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-xs">
                    {cc.sentAt ? new Date(cc.sentAt).toLocaleString() : '-'}
                  </td>
                  <td className="px-6 py-4 text-xs italic text-gray-500 max-w-[200px] truncate" title={cc.replyMessage}>
                    {cc.replyMessage || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
