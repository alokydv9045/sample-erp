import apiClient from './client';

export const reportCardAPI = {
  getAll: async (params?: any) => {
    const { data } = await apiClient.get('/report-cards', { params });
    return data;
  },

  generate: async (generateData: any) => {
    const { data } = await apiClient.post('/report-cards/generate', generateData);
    return data;
  },

  submit: async (id: string) => {
    const { data } = await apiClient.put(`/report-cards/${id}/submit`);
    return data;
  },

  bulkSubmit: async (reportCardIds: string[]) => {
    const { data } = await apiClient.post('/report-cards/bulk-submit', { reportCardIds });
    return data;
  },

  approve: async (id: string) => {
    const { data } = await apiClient.put(`/report-cards/${id}/approve`);
    return data;
  },

  bulkApprove: async (reportCardIds: string[]) => {
    const { data } = await apiClient.post('/report-cards/bulk-approve', { reportCardIds });
    return data;
  },

  reject: async (id: string, remark: string) => {
    const { data } = await apiClient.put(`/report-cards/${id}/reject`, { remark });
    return data;
  },

  download: async (id: string) => {
    const { data } = await apiClient.get(`/report-cards/${id}/pdf`, {
      responseType: 'blob',
    });
    return data;
  },

  publish: async (reportCardIds: string[]) => {
    const { data } = await apiClient.post('/report-cards/publish', { reportCardIds });
    return data;
  },

  getTemplates: async () => {
    const { data } = await apiClient.get('/report-cards/templates');
    return data;
  },

  updateTemplate: async (id: string, templateData: any) => {
    const { data } = await apiClient.put(`/report-cards/templates/${id}`, templateData);
    return data;
  },

  createTemplate: async (templateData: any) => {
    const { data } = await apiClient.post('/report-cards/templates', templateData);
    return data;
  },
};
