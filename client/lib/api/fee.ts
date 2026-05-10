import apiClient from './client';

export const feeAPI = {
  getStructures: async (params?: any) => {
    const { data } = await apiClient.get('/fees/structures', { params });
    return data;
  },

  getStructureById: async (id: string) => {
    const { data } = await apiClient.get(`/fees/structures/${id}`);
    return data;
  },

  createStructure: async (structureData: any) => {
    const { data } = await apiClient.post('/fees/structures', structureData);
    return data;
  },

  updateStructure: async (id: string, structureData: any) => {
    const { data } = await apiClient.put(`/fees/structures/${id}`, structureData);
    return data;
  },

  deleteStructure: async (id: string) => {
    const { data } = await apiClient.delete(`/fees/structures/${id}`);
    return data;
  },

  getPayments: async (params?: any) => {
    const { data } = await apiClient.get('/fees/payments', { params });
    return data;
  },

  createPayment: async (paymentData: any) => {
    const { data } = await apiClient.post('/fees/payments', paymentData);
    return data;
  },

  getStudentStatus: async (studentId: string, params?: any) => {
    const { data } = await apiClient.get(`/fees/students/${studentId}/status`, { params });
    return data;
  },

  getAdjustments: async (params?: any) => {
    const { data } = await apiClient.get('/fees/adjustments', { params });
    return data;
  },

  requestAdjustment: async (adjustmentData: any) => {
    const { data } = await apiClient.post('/fees/adjustments/request', adjustmentData);
    return data;
  },

  approveAdjustment: async (id: string, statusData: any) => {
    const { data } = await apiClient.put(`/fees/adjustments/${id}/approve`, statusData);
    return data;
  },

  processRefund: async (refundData: any) => {
    const { data } = await apiClient.post('/fees/refunds', refundData);
    return data;
  },
  getStats: async () => {
    const { data } = await apiClient.get('/fees/stats');
    return data;
  },

  getFeeStudents: async (params?: any) => {
    const { data } = await apiClient.get('/fees/students', { params });
    return data;
  },
  downloadStatement: async (studentId: string) => {
    const response = await apiClient.get(`/fees/students/${studentId}/statement`, {
      responseType: 'blob',
    });
    return response.data;
  },
  getClassWiseReport: async (params?: any) => {
    const { data } = await apiClient.get('/fees/reports/class-wise', { params });
    return data;
  },
};
