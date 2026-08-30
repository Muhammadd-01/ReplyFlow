import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { Users, Send, MessageSquare, Activity, ArrowRight, Play } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import { dashboardApi } from '@/api/dashboard';
import { useAuth } from '@/store/AuthContext';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'RUNNING': return <Badge variant="info">Running</Badge>;
      case 'PAUSED': return <Badge variant="warning">Paused</Badge>;
      case 'COMPLETED': return <Badge variant="success">Completed</Badge>;
      case 'FAILED': return <Badge variant="danger">Failed</Badge>;
      case 'STOPPED': return <Badge variant="danger">Stopped</Badge>;
      default: return <Badge variant="default">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {user?.name?.split(' ')[0] || 'User'}! 👋
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Here's an overview of your messaging campaigns.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title="Total Contacts" 
          value={isLoading || !data ? '-' : data.stats.totalContacts.toString()} 
          icon={<Users className="text-blue-600 dark:text-blue-400" size={24} />} 
          trend="+12% from last month"
          trendUp={true}
        />
        <StatsCard 
          title="Active Campaigns" 
          value={isLoading || !data ? '-' : data.stats.activeCampaigns.toString()} 
          icon={<Activity className="text-primary-600 dark:text-primary-400" size={24} />} 
          trend="2 completed this week"
          trendUp={true}
        />
        <StatsCard 
          title="Messages Sent" 
          value={isLoading || !data ? '-' : data.stats.totalMessagesSent.toString()} 
          icon={<Send className="text-green-600 dark:text-green-400" size={24} />} 
          trend="+18% from last month"
          trendUp={true}
        />
        <StatsCard 
          title="Total Replies" 
          value={isLoading || !data ? '-' : data.stats.totalReplies.toString()} 
          icon={<MessageSquare className="text-warning-600 dark:text-warning-400" size={24} />} 
          trend="+5% from last month"
          trendUp={true}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Campaigns</h2>
            <button 
              onClick={() => navigate('/campaigns')}
              className="text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 flex items-center"
            >
              View All <ArrowRight size={16} className="ml-1" />
            </button>
          </div>
          
          <div className="flex-1">
            {isLoading || !data ? (
              <div className="text-center py-8 text-gray-500">Loading campaigns...</div>
            ) : data.recentCampaigns.length === 0 ? (
              <div className="text-center py-12 flex flex-col items-center border border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
                <Play className="text-gray-400 mb-3" size={32} />
                <h3 className="text-gray-900 dark:text-white font-medium mb-1">No campaigns yet</h3>
                <p className="text-sm text-gray-500 mb-4">Start your first messaging campaign</p>
                <button 
                  onClick={() => navigate('/campaigns/new')}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-sm font-medium"
                >
                  Create Campaign
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {data.recentCampaigns.map((campaign) => (
                  <div key={campaign.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-700/50">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{campaign.name}</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {campaign.sentCount} / {campaign.totalContacts} messages sent
                      </p>
                    </div>
                    {getStatusBadge(campaign.status)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
        
        <Card className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Quick Actions</h2>
          <div className="space-y-3">
            <QuickAction 
              title="Import Contacts" 
              description="Upload an Excel file with phone numbers" 
              icon={<Users size={20} className="text-blue-600 dark:text-blue-400" />}
              onClick={() => navigate('/import')}
            />
            <QuickAction 
              title="Connect WhatsApp" 
              description="Scan QR code to link a new device" 
              icon={<Activity size={20} className="text-primary-600 dark:text-primary-400" />}
              onClick={() => navigate('/whatsapp')}
            />
            <QuickAction 
              title="Create Campaign" 
              description="Start a new message broadcast" 
              icon={<Send size={20} className="text-green-600 dark:text-green-400" />}
              onClick={() => navigate('/campaigns/new')}
            />
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatsCard({ title, value, icon, trend, trendUp }: { title: string, value: string, icon: React.ReactNode, trend: string, trendUp: boolean }) {
  return (
    <Card className="p-6 flex flex-col justify-between h-32">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</h3>
        </div>
        <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
          {icon}
        </div>
      </div>
      <div className={`text-xs font-medium ${trendUp ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
        {trend}
      </div>
    </Card>
  );
}

function QuickAction({ title, description, icon, onClick }: { title: string, description: string, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="w-full flex items-center p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-xl transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700 text-left group"
    >
      <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg mr-4 group-hover:scale-110 transition-transform">
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white">{title}</h4>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </button>
  );
}
