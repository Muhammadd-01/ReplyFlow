import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Download, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import EmptyState from '@/components/ui/EmptyState';
import { campaignsApi } from '@/api/campaigns';
import { exportApi } from '@/api/export';

export default function ExportsPage() {
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns', page],
    queryFn: () => campaignsApi.getCampaigns(page, 20),
  });

  const exportMutation = useMutation({
    mutationFn: (id: string) => exportApi.exportCampaign(id),
    onSuccess: (data) => {
      toast.success('Export generated successfully!');
      exportApi.downloadFile(data.downloadUrl);
    },
    onError: () => {
      toast.error('Failed to generate export');
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Exports</h1>
          <p className="text-gray-500 dark:text-gray-400">Download Excel reports of your campaigns, contacts, and messages.</p>
        </div>
      </div>

      <Card>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="font-semibold text-gray-900 dark:text-white">Campaign Reports</h2>
          <p className="text-sm text-gray-500">Includes Campaign Info, Contacts Status, Outbound Messages, and Incoming Replies sheets.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700/50 dark:text-gray-300">
              <tr>
                <th className="px-6 py-4">Campaign Name</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Progress</th>
                <th className="px-6 py-4">Created Date</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Loading campaigns...
                  </td>
                </tr>
              ) : data?.items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12">
                    <EmptyState 
                      icon={FileSpreadsheet}
                      title="No data to export"
                      description="Create and run campaigns to generate exportable reports."
                    />
                  </td>
                </tr>
              ) : (
                data?.items.map((campaign) => (
                  <tr key={campaign.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      {campaign.name}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        campaign.status === 'COMPLETED' ? 'success' : 
                        campaign.status === 'RUNNING' ? 'info' : 
                        campaign.status === 'FAILED' ? 'danger' : 'default'
                      }>
                        {campaign.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">
                      {campaign.sentCount} / {campaign.totalContacts} sent
                    </td>
                    <td className="px-6 py-4">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button 
                        variant="outline"
                        size="sm"
                        leftIcon={<Download size={14} />}
                        onClick={() => exportMutation.mutate(campaign.id)}
                        isLoading={exportMutation.isPending && exportMutation.variables === campaign.id}
                        disabled={exportMutation.isPending}
                      >
                        Export Excel
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
