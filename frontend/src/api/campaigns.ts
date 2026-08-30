import apiClient from './client';
import { WhatsAppSession } from './whatsapp';

export interface Campaign {
  id: string;
  name: string;
  status: 'DRAFT' | 'QUEUED' | 'RUNNING' | 'PAUSED' | 'COMPLETED' | 'STOPPED' | 'FAILED';
  totalContacts: number;
  pendingCount: number;
  sentCount: number;
  deliveredCount: number;
  repliedCount: number;
  failedCount: number;
  delayMin: number;
  delayMax: number;
  messageTemplate: string;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  whatsappSessionId?: any;
  parentCampaignId?: string;
}

export interface CampaignsResponse {
  items: Campaign[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateCampaignPayload {
  name: string;
  messageTemplate: string;
  whatsappSessionId: string;
  delayMin: number;
  delayMax: number;
  file?: File;
  contactIds?: string[];
  parentCampaignId?: string;
}

export const campaignsApi = {
  getCampaigns: async (page = 1, limit = 10, status?: string): Promise<CampaignsResponse> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    if (status) params.append('status', status);
    
    const response = await apiClient.get(`/campaigns?${params.toString()}`);
    return response.data.data;
  },

  getCampaignById: async (id: string): Promise<Campaign & { campaignContacts?: any[] }> => {
    const response = await apiClient.get(`/campaigns/${id}`);
    return response.data.data;
  },

  createCampaign: async (data: CreateCampaignPayload): Promise<Campaign> => {
    if (data.file) {
      const formData = new FormData();
      formData.append('name', data.name);
      formData.append('messageTemplate', data.messageTemplate);
      formData.append('whatsappSessionId', data.whatsappSessionId);
      formData.append('delayMin', data.delayMin.toString());
      formData.append('delayMax', data.delayMax.toString());
      formData.append('file', data.file);
      if (data.contactIds) formData.append('contactIds', JSON.stringify(data.contactIds));
      if (data.parentCampaignId) formData.append('parentCampaignId', data.parentCampaignId);
      
      const res = await apiClient.post<{ status: string; data: Campaign }>('/campaigns', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return res.data.data;
    }

    const res = await apiClient.post<{ status: string; data: Campaign }>('/campaigns', data);
    return res.data.data;
  },

  startCampaign: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/campaigns/${id}/start`);
    return response.data;
  },

  pauseCampaign: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/campaigns/${id}/pause`);
    return response.data;
  },

  stopCampaign: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.post(`/campaigns/${id}/stop`);
    return response.data;
  },

  updateCampaign: async (id: string, data: Partial<CreateCampaignPayload>): Promise<Campaign> => {
    const response = await apiClient.put(`/campaigns/${id}`, data);
    return response.data.data;
  },

  deleteCampaign: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete(`/campaigns/${id}`);
    return response.data;
  }
};
