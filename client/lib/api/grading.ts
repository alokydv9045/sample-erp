import apiClient from './client';

export const termAPI = {
  getAll: async (params?: any) => {
    const { data } = await apiClient.get('/terms', { params });
    return data;
  },

  create: async (termData: any) => {
    const { data } = await apiClient.post('/terms', termData);
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/terms/${id}`, updates);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/terms/${id}`);
    return data;
  },
};

export const gradeScaleAPI = {
  getAll: async () => {
    const { data } = await apiClient.get('/grade-scales');
    return data;
  },

  create: async (scaleData: any) => {
    const { data } = await apiClient.post('/grade-scales', scaleData);
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/grade-scales/${id}`, updates);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/grade-scales/${id}`);
    return data;
  },
};
