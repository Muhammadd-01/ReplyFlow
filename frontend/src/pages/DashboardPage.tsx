import { useAuth } from '@/store/AuthContext';
import StatCard from '@/components/ui/StatCard';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { useNavigate } from 'react-router';
import {
  MessageSquare,
  Users,
  Send,
  Mail,
  Inbox,
  TrendingUp,
  Upload,
  Plus,
  Zap,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Welcome back, {user?.name?.split(' ')[0] || 'User'} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Here's what's happening with your campaigns
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard title="WhatsApp" value="Disconnected" icon={MessageSquare} description="Not connected" />
        <StatCard title="Total Contacts" value="0" icon={Users} />
        <StatCard title="Total Campaigns" value="0" icon={Send} />
        <StatCard title="Messages Sent" value="0" icon={Mail} />
        <StatCard title="Total Replies" value="0" icon={Inbox} />
        <StatCard title="Success Rate" value="0%" icon={TrendingUp} />
      </div>

      {/* Getting Started */}
      <Card>
        <CardContent className="py-8">
          <div className="text-center mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Get Started with ReplyFlow</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Follow these steps to send your first campaign
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
            {/* Step 1 */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="rounded-full bg-primary-100 p-3 dark:bg-primary-900/30 mb-3">
                <MessageSquare className="h-6 w-6 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">1. Connect WhatsApp</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Scan the QR code to link your WhatsApp
              </p>
              <Button size="sm" variant="outline" onClick={() => navigate('/whatsapp')}>
                <Zap className="h-4 w-4" />
                Connect
              </Button>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30 mb-3">
                <Upload className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">2. Import Contacts</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Upload your Excel file with phone numbers
              </p>
              <Button size="sm" variant="outline" onClick={() => navigate('/import')}>
                <Upload className="h-4 w-4" />
                Import
              </Button>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col items-center text-center p-4 rounded-xl border border-gray-200 dark:border-gray-700">
              <div className="rounded-full bg-yellow-100 p-3 dark:bg-yellow-900/30 mb-3">
                <Send className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <h3 className="font-medium text-gray-900 dark:text-white mb-1">3. Create Campaign</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                Write your message and start sending
              </p>
              <Button size="sm" variant="outline" onClick={() => navigate('/campaigns/new')}>
                <Plus className="h-4 w-4" />
                Create
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
