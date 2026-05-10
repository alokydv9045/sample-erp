import apiClient from './client';

export const schoolConfigAPI = {
  getConfig: async () => {
    const { data } = await apiClient.get('/school-config');
    return data;
  },

  uploadLogo: async (file: File) => {
    const formData = new FormData();
    formData.append('logo', file);
    const { data } = await apiClient.post('/school-config/logo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  updateConfig: async (payload: { key: string; value: string }) => {
    const { data } = await apiClient.put('/school-config', payload);
    return data;
  },
};
