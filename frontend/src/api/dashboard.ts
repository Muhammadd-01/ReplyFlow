import apiClient from './client';

export interface DashboardStats {
  stats: {
    totalContacts: number;
    activeCampaigns: number;
    totalMessagesSent: number;
    totalReplies: number;
  };
  recentCampaigns: any[];
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const response = await apiClient.get('/dashboard/stats');
    return response.data.data;
  }
};
