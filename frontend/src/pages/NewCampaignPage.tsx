import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Send } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import FileUploader from '@/components/ui/FileUploader';
import { campaignsApi } from '@/api/campaigns';
import { whatsappApi } from '@/api/whatsapp';

export default function NewCampaignPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [name, setName] = useState('');
  const [sessionId, setSessionId] = useState('');
  const [template, setTemplate] = useState('Hi {name}, ');
  const [delayMin, setDelayMin] = useState(3);
  const [delayMax, setDelayMax] = useState(8);
  const [file, setFile] = useState<File | null>(null);

  const { data: sessions = [] } = useQuery({
    queryKey: ['whatsapp-sessions'],
    queryFn: whatsappApi.getSessions,
  });

  const connectedSessions = sessions.filter(s => s.status === 'CONNECTED');

  const createMutation = useMutation({
    mutationFn: () => campaignsApi.createCampaign({
      name,
      messageTemplate: template,
      whatsappSessionId: sessionId,
      delayMin,
      delayMax,
      file: file || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      toast.success('Campaign created successfully');
      navigate('/campaigns');
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Failed to create campaign');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId) {
      toast.error('Please select a connected WhatsApp device');
      return;
    }
    createMutation.mutate();
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/campaigns')}
          className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Create Campaign</h1>
          <p className="text-gray-500 dark:text-gray-400">Set up a new message broadcast to your contacts.</p>
        </div>
      </div>

      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Campaign Name"
            placeholder="e.g. Summer Sale 2024"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <Select
            label="Sending Device (WhatsApp Account)"
            value={sessionId}
            onChange={(e) => setSessionId(e.target.value)}
            required
            placeholder="-- Select Device --"
            options={connectedSessions.map(s => ({
              label: `${s.sessionName} (+${s.phoneNumber})`,
              value: s.id
            }))}
          />
          
          {connectedSessions.length === 0 && (
            <p className="text-sm text-warning-600 mt-[-1rem]">
              You don't have any connected devices. Please connect one in the WhatsApp Devices tab.
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Recipients List (Excel/CSV)
            </label>
            <FileUploader 
              onFileSelect={setFile} 
              accept=".xlsx,.xls,.csv" 
              maxSizeMB={10} 
            />
            {!file && (
              <p className="text-sm text-gray-500 mt-2">
                If no file is provided, this campaign will be sent to ALL active contacts in your database.
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message Template
            </label>
            <textarea
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-primary-500 focus:ring-1 focus:ring-primary-500 min-h-[150px]"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-2">
              Available variables: <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{"{name}"}</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{"{phone}"}</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{"{id}"}</code>, <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded">{"{date}"}</code>
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Min Delay (seconds)"
              type="number"
              min={1}
              value={delayMin}
              onChange={(e) => setDelayMin(Number(e.target.value))}
              required
            />
            <Input
              label="Max Delay (seconds)"
              type="number"
              min={delayMin}
              value={delayMax}
              onChange={(e) => setDelayMax(Number(e.target.value))}
              required
            />
          </div>
          <p className="text-xs text-gray-500 mt-[-1rem]">
            To prevent account bans, messages will be sent with a random delay between these values. A 1-3 second "composing..." typing indicator is also added automatically.
          </p>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex justify-end space-x-3">
            <Button variant="outline" type="button" onClick={() => navigate('/campaigns')}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={connectedSessions.length === 0 || createMutation.isPending}
              isLoading={createMutation.isPending}
              leftIcon={<Send size={18} />}
            >
              Create Campaign
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
