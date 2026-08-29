import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Send } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { inboxApi } from '@/api/inbox';
import { socket } from '@/lib/socket';

export default function ConversationPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [content, setContent] = useState('');

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['conversation-messages', id],
    queryFn: () => inboxApi.getMessages(id!),
    enabled: !!id,
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket || !id) return;

    const handleReply = (data: any) => {
      if (data.contactId === id) {
        queryClient.invalidateQueries({ queryKey: ['conversation-messages', id] });
      }
    };

    socket.on('whatsapp:reply' as any, handleReply);
    return () => {
      socket.off('whatsapp:reply' as any, handleReply);
    };
  }, [id, queryClient]);

  const sendMutation = useMutation({
    mutationFn: (msg: string) => inboxApi.sendMessage(id!, msg),
    onSuccess: (newMessage) => {
      setContent('');
      queryClient.setQueryData(['conversation-messages', id], (old: any) => {
        return [...(old || []), newMessage];
      });
    }
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    sendMutation.mutate(content);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="flex items-center space-x-4 mb-4">
        <button 
          onClick={() => navigate('/inbox')}
          className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">Conversation</h1>
        </div>
      </div>

      <Card className="flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {isLoading ? (
            <div className="text-center text-gray-500 py-4">Loading messages...</div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-500 py-12">No messages found.</div>
          ) : (
            messages.map((msg) => {
              const isOutbound = msg.type === 'message' && msg.direction === 'OUTBOUND';
              
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                      isOutbound 
                        ? 'bg-primary-600 text-white rounded-tr-none' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                    <div className={`text-[10px] mt-1 text-right ${isOutbound ? 'text-primary-100' : 'text-gray-500'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30">
          <form onSubmit={handleSend} className="flex space-x-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-gray-900 dark:text-white"
              disabled={sendMutation.isPending}
            />
            <Button 
              type="submit" 
              className="rounded-full w-10 h-10 p-0 flex items-center justify-center flex-shrink-0"
              disabled={!content.trim() || sendMutation.isPending}
              isLoading={sendMutation.isPending}
            >
              <Send size={18} className={sendMutation.isPending ? 'hidden' : 'ml-[-2px] mt-[2px]'} />
            </Button>
          </form>
        </div>
      </Card>
    </div>
  );
}
