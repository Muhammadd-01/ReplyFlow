import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { MessageSquare, Search } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import EmptyState from '@/components/ui/EmptyState';
import { inboxApi } from '@/api/inbox';

export default function InboxPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['inbox-conversations', page],
    queryFn: () => inboxApi.getConversations(page, 20),
  });

  const filteredItems = data?.items.filter((contact: any) => 
    contact.name?.toLowerCase().includes(search.toLowerCase()) || 
    contact.phoneNumber.includes(search)
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Inbox</h1>
          <p className="text-gray-500 dark:text-gray-400">View and respond to replies from your campaigns.</p>
        </div>
      </div>

      <Card className="flex flex-col h-[calc(100vh-200px)] min-h-[500px]">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div className="w-full sm:w-96 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search conversations..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="p-8 text-center text-gray-500">Loading conversations...</div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12">
              <EmptyState 
                icon={MessageSquare}
                title="No conversations found"
                description={search ? "No conversations match your search criteria." : "When contacts reply to your campaigns, they will appear here."}
              />
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredItems.map((contact: any) => {
                const latestReply = contact.replies[0];
                return (
                  <div 
                    key={contact.id}
                    onClick={() => navigate(`/conversations/${contact.id}`)}
                    className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer transition-colors"
                  >
                    <div className="flex justify-between items-start mb-1">
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {contact.name || contact.phoneNumber}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {latestReply ? new Date(latestReply.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {latestReply?.content || 'No replies yet'}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
