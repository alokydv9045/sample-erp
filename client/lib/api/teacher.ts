import apiClient from './client';

export const teacherAPI = {
  getAll: async (params?: any) => {
    const { data } = await apiClient.get('/teachers', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get(`/teachers/${id}`);
    return data;
  },

  create: async (teacherData: any) => {
    const { data } = await apiClient.post('/teachers', teacherData);
    return data;
  },

  update: async (id: string, updates: any) => {
    const { data } = await apiClient.put(`/teachers/${id}`, updates);
    return data;
  },

  assignSubject: async (id: string, subjectId: string) => {
    const { data } = await apiClient.post(`/teachers/${id}/subjects`, { subjectId });
    return data;
  },

  getMySchedule: async () => {
    const { data } = await apiClient.get('/teachers/my-schedule');
    return data;
  },

  getMyClasses: async () => {
    const { data } = await apiClient.get('/teachers/my-classes');
    return data;
  },
};
