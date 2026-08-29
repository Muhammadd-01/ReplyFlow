import apiClient from './client';

export const exportApi = {
  exportCampaign: async (campaignId: string): Promise<{ downloadUrl: string }> => {
    const response = await apiClient.get(`/export/campaigns/${campaignId}`);
    return response.data.data;
  },
  
  downloadFile: (downloadUrl: string) => {
    // In browser, navigate or create anchor tag
    const url = `${(import.meta as any).env.VITE_API_URL || 'http://localhost:3001'}${downloadUrl}`;
    window.open(url, '_blank');
  }
};
