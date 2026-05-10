import apiClient from './client';

export const documentAPI = {
  upload: async (studentId: string, payload: { file: File, documentType: string, documentName: string }) => {
    const formData = new FormData();
    formData.append('file', payload.file);
    formData.append('documentType', payload.documentType);
    formData.append('documentName', payload.documentName);

    const { data } = await apiClient.post(`/students/${studentId}/documents`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  getAll: async (studentId: string) => {
    const { data } = await apiClient.get(`/students/${studentId}/documents`);
    return data;
  },

  delete: async (documentId: string) => {
    const { data } = await apiClient.delete(`/students/documents/${documentId}`);
    return data;
  },
};

export const scannerAPI = {
  getAll: async (params?: any) => {
    const { data } = await apiClient.get('/scanners', { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/scanners/${id}`);
    return data;
  },
  create: async (scannerData: any) => {
    const { data } = await apiClient.post('/scanners', scannerData);
    return data;
  },
  update: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/scanners/${id}`, updates);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/scanners/${id}`);
    return data;
  },
  getStats: async (id: string) => {
    const { data } = await apiClient.get(`/scanners/${id}/stats`);
    return data;
  },
};
