import apiClient from './client';
import { Contact } from './contacts';

export interface Message {
  id: string;
  type: 'message' | 'reply';
  content: string;
  createdAt: string;
  sentAt?: string;
  status?: string;
  direction?: 'OUTBOUND';
}

export const inboxApi = {
  getConversations: async (page = 1, limit = 20) => {
    const response = await apiClient.get(`/inbox?page=${page}&limit=${limit}`);
    return response.data.data;
  },

  getMessages: async (contactId: string): Promise<Message[]> => {
    const response = await apiClient.get(`/inbox/${contactId}/messages`);
    return response.data.data;
  },

  sendMessage: async (contactId: string, content: string): Promise<Message> => {
    const response = await apiClient.post(`/inbox/${contactId}/reply`, { content });
    return response.data.data;
  }
};
