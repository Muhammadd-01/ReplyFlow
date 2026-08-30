import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Upload, Play, Rocket } from 'lucide-react';
import { campaignsApi, Campaign } from '@/api/campaigns';
import { Card } from '@/components/ui/Card';
import FileUploader from '@/components/ui/FileUploader';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';

export default function QuickSendPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [startingCampaignId, setStartingCampaignId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['campaigns'],
    queryFn: () => campaignsApi.getCampaigns(1, 100),
  });

  const createAndStartMutation = useMutation({
    mutationFn: async (templateCampaign: any) => {
      if (!file) throw new Error('Please upload an Excel sheet first');
      
      const sessionId = templateCampaign.whatsappSessionId?._id || templateCampaign.whatsappSessionId?.id || templateCampaign.whatsappSessionId;
      if (!sessionId) throw new Error('Selected campaign has no WhatsApp session configured');

      // 1. Create a new campaign cloned from the selected one, with the file
      const newCampaign = await campaignsApi.createCampaign({
        name: `${templateCampaign.name} (Quick Send)`,
        messageTemplate: templateCampaign.messageTemplate,
        whatsappSessionId: sessionId,
        delayMin: templateCampaign.delayMin,
        delayMax: templateCampaign.delayMax,
        file: file,
        parentCampaignId: templateCampaign.id,
      });

      // 2. Start it
      await campaignsApi.startCampaign(newCampaign.id);
      return newCampaign;
    },
    onSuccess: (newCampaign) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign started successfully!');
      navigate('/campaigns');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || err.message || 'Failed to start campaign');
    },
    onSettled: () => {
      setStartingCampaignId(null);
    }
  });

  const handleStart = (campaign: Campaign) => {
    if (!file) {
      toast.error('Please upload an Excel or CSV file first');
      return;
    }
    setStartingCampaignId(campaign.id);
    createAndStartMutation.mutate(campaign);
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Rocket className="text-primary-600" /> Quick Send
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-2">
          Upload an Excel sheet of numbers, then choose an existing campaign configuration to instantly start sending messages.
        </p>
      </div>

      <Card className="p-8 border-2 border-dashed border-primary-500/30 bg-primary-50/30 dark:bg-primary-900/10">
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
          <Upload size={20} /> 1. Upload Recipients List
        </h2>
        <FileUploader 
          onFileSelect={setFile} 
          accept=".xlsx,.xls,.csv" 
          maxSizeMB={10} 
        />
        {file && (
          <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium border border-green-200 dark:border-green-900/30">
            File attached: {file.name}
          </div>
        )}
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
          2. Select Campaign Template to Start
        </h2>
        
        {isLoading ? (
          <div className="text-center py-12 text-gray-500">Loading campaigns...</div>
        ) : !data?.items || data.items.length === 0 ? (
          <Card className="p-8 text-center text-gray-500">
            No campaigns found. Please create a campaign first.
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {data.items.map((campaign: Campaign) => (
              <Card key={campaign.id} className="p-5 flex flex-col justify-between hover:border-primary-400 transition-colors bg-white/50 dark:bg-gray-800/50">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{campaign.name}</h3>
                    <Badge variant="default">Template</Badge>
                  </div>
                  <div className="bg-gray-100 dark:bg-gray-900/80 p-3 rounded-lg text-xs text-gray-700 dark:text-gray-300 line-clamp-3 mb-4 font-mono">
                    {campaign.messageTemplate}
                  </div>
                </div>
                
                <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="text-xs text-gray-500">
                    Device: {campaign.whatsappSessionId?.sessionName || 'Not Set'}
                  </div>
                  <Button 
                    onClick={() => handleStart(campaign)}
                    disabled={!file || startingCampaignId !== null}
                    isLoading={startingCampaignId === campaign.id}
                    leftIcon={<Play size={16} />}
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white border-none"
                  >
                    Start Sending
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
