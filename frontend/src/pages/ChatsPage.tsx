import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getChats, getChatMessages, Chat, ChatMessage } from '../api/chats';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { MessageCircle, User as UserIcon } from 'lucide-react';
import { socket } from '../lib/socket';

export function ChatsPage() {
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

  const { data: chats, refetch: refetchChats } = useQuery({
    queryKey: ['chats'],
    queryFn: getChats,
  });

  const { data: messages, refetch: refetchMessages } = useQuery({
    queryKey: ['chat-messages', selectedChat?.id],
    queryFn: () => getChatMessages(selectedChat!.id),
    enabled: !!selectedChat,
  });

  useEffect(() => {
    socket.on('whatsapp:new_message', (msg: ChatMessage) => {
      refetchChats();
      if (selectedChat?.id === msg.chatId) {
        refetchMessages();
      }
    });

    return () => {
      socket.off('whatsapp:new_message');
    };
  }, [selectedChat, refetchChats, refetchMessages]);

  return (
    <div className="flex h-[calc(100vh-6rem)] gap-4">
      {/* Chats List */}
      <Card className="w-1/3 flex flex-col h-full bg-slate-900/40 backdrop-blur-md border-cyan-500/20">
        <CardHeader className="pb-3 border-b border-cyan-500/20">
          <CardTitle className="text-xl flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-cyan-400" />
            Chats
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-0">
          {chats?.length === 0 ? (
            <div className="p-6 text-center text-slate-400">No chats found</div>
          ) : (
            <div className="divide-y divide-cyan-500/10">
              {chats?.map((chat: Chat) => (
                <div
                  key={chat.id}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-4 cursor-pointer hover:bg-cyan-500/5 transition-colors flex items-center gap-4 ${
                    selectedChat?.id === chat.id ? 'bg-cyan-500/10' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
                    <UserIcon className="w-5 h-5 text-pink-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-semibold text-slate-200 truncate">
                        {chat.name || chat.whatsappJid.split('@')[0]}
                      </h3>
                      {chat.lastMessageAt && (
                        <span className="text-xs text-slate-500">
                          {new Date(chat.lastMessageAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 truncate">
                      {chat.lastMessage || 'No messages yet'}
                    </p>
                  </div>
                  {chat.unreadCount > 0 && (
                    <div className="w-5 h-5 rounded-full bg-pink-500 text-white text-xs flex items-center justify-center">
                      {chat.unreadCount}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat History */}
      <Card className="flex-1 flex flex-col h-full bg-slate-900/40 backdrop-blur-md border-pink-500/20 relative overflow-hidden">
        {selectedChat ? (
          <>
            <CardHeader className="border-b border-pink-500/20 bg-slate-900/80 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center">
                  <UserIcon className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <CardTitle className="text-lg">
                    {selectedChat.name || selectedChat.whatsappJid.split('@')[0]}
                  </CardTitle>
                  <p className="text-xs text-slate-400">{selectedChat.whatsappJid.split('@')[0]}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages?.map((msg: ChatMessage) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.fromMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-lg ${
                      msg.fromMe
                        ? 'bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-tr-sm'
                        : 'bg-slate-800 text-slate-200 rounded-tl-sm border border-cyan-500/20'
                    }`}
                  >
                    <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                    <span className={`text-[10px] mt-1 block ${msg.fromMe ? 'text-pink-100/70' : 'text-slate-500'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            Select a chat to view messages
          </div>
        )}
      </Card>
    </div>
  );
}
