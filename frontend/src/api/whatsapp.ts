import apiClient from './client';

export interface WhatsAppSession {
  id: string;
  sessionName: string;
  status: 'DISCONNECTED' | 'CONNECTING' | 'QR_REQUIRED' | 'CONNECTED' | 'ERROR';
  phoneNumber?: string;
  connectedAt?: string;
  lastSeenAt?: string;
  createdAt: string;
}

export const whatsappApi = {
  getSessions: async (): Promise<WhatsAppSession[]> => {
    const response = await apiClient.get('/whatsapp/sessions');
    return response.data.data;
  },

  createSession: async (sessionName: string): Promise<WhatsAppSession> => {
    const response = await apiClient.post('/whatsapp/sessions', { sessionName });
    return response.data.data;
  },

  startSession: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/whatsapp/sessions/${id}/start`);
    return response.data;
  },

  getSessionStatus: async (id: string): Promise<{ status: string; qr: string | null; session: WhatsAppSession }> => {
    const response = await apiClient.get(`/whatsapp/sessions/${id}/status`);
    return response.data.data;
  },

  disconnectSession: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/whatsapp/sessions/${id}/disconnect`);
    return response.data;
  }
};
