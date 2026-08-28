import { Card, CardContent } from '@/components/ui/Card';
import { Send } from 'lucide-react';

export default function NewCampaignPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Create Campaign</h1>
      <Card>
        <CardContent className="py-16 text-center">
          <Send className="h-12 w-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Campaign creation wizard coming soon</p>
        </CardContent>
      </Card>
    </div>
  );
}
