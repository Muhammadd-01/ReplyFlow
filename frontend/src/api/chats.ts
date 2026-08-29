import api from './client';

export interface Chat {
  id: string;
  whatsappJid: string;
  name: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export interface ChatMessage {
  id: string;
  chatId: string;
  whatsappMessageId: string;
  fromMe: boolean;
  content: string;
  timestamp: string;
}

export const getChats = async () => {
  const { data } = await api.get('/chats');
  return data;
};

export const getChatMessages = async (chatId: string) => {
  const { data } = await api.get(`/chats/${chatId}/messages`);
  return data;
};
