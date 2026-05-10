import apiClient from './client';

export const hrAPI = {
  getEmployees: async (params?: any) => {
    const { data } = await apiClient.get('/hr', { params });
    return data;
  },
  getEmployee: async (id: string) => {
    const { data } = await apiClient.get(`/hr/${id}`);
    return data;
  },
  createEmployee: async (employee: any) => {
    const { data } = await apiClient.post('/hr', employee);
    return data;
  },
  updateEmployee: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/hr/${id}`, updates);
    return data;
  },
  toggleStatus: async (id: string, payload: { isActive: boolean; status?: string }) => {
    const { data } = await apiClient.patch(`/hr/${id}/status`, payload);
    return data;
  },

  // Leave Management
  initializeLeaves: async (payload: { employeeId: string; academicYearId: string }) => {
    const { data } = await apiClient.post('/hr/leaves/initialize', payload);
    return data;
  },
  getMyLeaveBalances: async (academicYearId?: string) => {
    const { data } = await apiClient.get('/hr/leaves/my-balances', { params: { academicYearId } });
    return data;
  },
  requestLeave: async (leaveData: any) => {
    const { data } = await apiClient.post('/hr/leaves/request', leaveData);
    return data;
  },
  processLeave: async (id: string, payload: { status: string; remarks?: string }) => {
    const { data } = await apiClient.post(`/hr/leaves/${id}/process`, payload);
    return data;
  },

  // Performance Reviews
  createReview: async (reviewData: any) => {
    const { data } = await apiClient.post('/hr/reviews', reviewData);
    return data;
  },
  getEmployeeReviews: async (employeeId: string) => {
    const { data } = await apiClient.get(`/hr/${employeeId}/reviews`);
    return data;
  },
  acknowledgeReview: async (id: string) => {
    const { data } = await apiClient.patch(`/hr/reviews/${id}/acknowledge`);
    return data;
  },
};
