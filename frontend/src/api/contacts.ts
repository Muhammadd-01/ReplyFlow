import apiClient from './client';

export interface Contact {
  id: string;
  phoneNumber: string;
  normalizedPhoneNumber: string;
  name: string | null;
  email: string | null;
  source: string;
  isOptedOut: boolean;
  createdAt: string;
}

export interface ContactsResponse {
  items: Contact[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ContactQuery {
  page?: number;
  limit?: number;
  search?: string;
  source?: string;
  isOptedOut?: boolean;
}

export const contactsApi = {
  getContacts: async (query?: ContactQuery): Promise<ContactsResponse> => {
    const params = new URLSearchParams();
    if (query?.page) params.append('page', query.page.toString());
    if (query?.limit) params.append('limit', query.limit.toString());
    if (query?.search) params.append('search', query.search);
    if (query?.source) params.append('source', query.source);
    if (query?.isOptedOut !== undefined) params.append('isOptedOut', query.isOptedOut.toString());

    const response = await apiClient.get(`/contacts?${params.toString()}`);
    return response.data.data;
  },

  getContactById: async (id: string): Promise<any> => {
    const response = await apiClient.get(`/contacts/${id}`);
    return response.data.data;
  },

  createContact: async (data: { phoneNumber: string; name?: string; email?: string; defaultCountry?: string }) => {
    const response = await apiClient.post('/contacts', data);
    return response.data.data;
  },

  updateContact: async (id: string, data: { name?: string; email?: string }) => {
    const response = await apiClient.put(`/contacts/${id}`, data);
    return response.data.data;
  },

  deleteContact: async (id: string) => {
    const response = await apiClient.delete(`/contacts/${id}`);
    return response.data;
  },

  optOutContact: async (id: string, reason?: string) => {
    const response = await apiClient.post(`/contacts/${id}/opt-out`, { reason });
    return response.data;
  }
};
