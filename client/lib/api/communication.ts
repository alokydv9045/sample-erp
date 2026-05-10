import apiClient from './client';

export const announcementAPI = {
  getAll: async (params?: any) => {
    const { data } = await apiClient.get('/announcements', { params });
    return data;
  },

  getActive: async () => {
    const { data } = await apiClient.get('/announcements/active');
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get(`/announcements/${id}`);
    return data;
  },

  create: async (announcementData: any) => {
    const { data } = await apiClient.post('/announcements', announcementData);
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/announcements/${id}`, updates);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/announcements/${id}`);
    return data;
  },
};

export const enquiryAPI = {
  getAll: async (params?: any) => {
    const { data } = await apiClient.get('/enquiries', { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/enquiries/${id}`);
    return data;
  },
  create: async (enquiryData: any) => {
    const { data } = await apiClient.post('/enquiries', enquiryData);
    return data;
  },
  update: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/enquiries/${id}`, updates);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/enquiries/${id}`);
    return data;
  },
  addFollowUp: async (id: string, followUpData: any) => {
    const { data } = await apiClient.post(`/enquiries/${id}/follow-up`, followUpData);
    return data;
  },
};
