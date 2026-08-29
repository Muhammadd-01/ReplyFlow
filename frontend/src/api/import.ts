import apiClient from './client';

export interface ImportAnalysisResponse {
  fileId: string;
  originalFileName: string;
  sheets: string[];
  headers: string[];
  detectedColumns: {
    phoneColumn: string;
    nameColumn: string;
    emailColumn: string;
  };
}

export interface ConfirmImportPayload {
  fileId: string;
  sheetName: string;
  phoneColumn: string;
  nameColumn?: string;
  emailColumn?: string;
  defaultCountry?: string;
}

export interface ConfirmImportResponse {
  importedFileId: string;
  totalRows: number;
  importedCount: number;
  duplicatesCount: number;
  invalidCount: number;
  invalidRows: Array<{
    rowNumber: number;
    rawPhone: string;
    reason: string;
  }>;
}

export const importApi = {
  uploadFile: async (file: File): Promise<ImportAnalysisResponse> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post('/import/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },
  
  confirmImport: async (payload: ConfirmImportPayload): Promise<ConfirmImportResponse> => {
    const response = await apiClient.post('/import/confirm', payload);
    return response.data.data;
  },
};
