import apiClient from './client';

export const academicAPI = {
  getAcademicYears: async () => {
    const { data } = await apiClient.get('/academic/years');
    return data;
  },

  createAcademicYear: async (yearData: any) => {
    const { data } = await apiClient.post('/academic/years', yearData);
    return data;
  },

  setCurrentAcademicYear: async (id: string) => {
    const { data } = await apiClient.put(`/academic/years/${id}/current`);
    return data;
  },

  getClasses: async () => {
    const { data } = await apiClient.get('/academic/classes');
    return data;
  },

  getClass: async (id: string) => {
    const { data } = await apiClient.get(`/academic/classes/${id}`);
    return data;
  },

  createClass: async (classData: any) => {
    const { data } = await apiClient.post('/academic/classes', classData);
    return data;
  },

  updateClass: async (id: string, classData: any) => {
    const { data } = await apiClient.put(`/academic/classes/${id}`, classData);
    return data;
  },

  deleteClass: async (id: string) => {
    const { data } = await apiClient.delete(`/academic/classes/${id}`);
    return data;
  },

  getSubjects: async (params?: any) => {
    const { data } = await apiClient.get('/academic/subjects', { params });
    return data;
  },

  createSubject: async (subjectData: any) => {
    const { data } = await apiClient.post('/academic/subjects', subjectData);
    return data;
  },

  updateSubject: async (id: string, subjectData: any) => {
    const { data } = await apiClient.put(`/academic/subjects/${id}`, subjectData);
    return data;
  },

  deleteSubject: async (id: string) => {
    const { data } = await apiClient.delete(`/academic/subjects/${id}`);
    return data;
  },

  assignSubjectTeacher: async (assignmentData: any) => {
    const { data } = await apiClient.post('/academic/subjects/assign', assignmentData);
    return data;
  },

  getSections: async (params?: any) => {
    const { data } = await apiClient.get('/academic/sections', { params });
    return data;
  },

  createSection: async (sectionData: any) => {
    const { data } = await apiClient.post('/academic/sections', sectionData);
    return data;
  },

  updateSection: async (id: string, sectionData: any) => {
    const { data } = await apiClient.put(`/academic/sections/${id}`, sectionData);
    return data;
  },

  deleteSection: async (id: string) => {
    const { data } = await apiClient.delete(`/academic/sections/${id}`);
    return data;
  },

  getDashboardStats: async () => {
    const { data } = await apiClient.get('/academic/dashboard');
    return data;
  },
  getTimetables: async (params?: any) => {
    const { data } = await apiClient.get('/academic/timetables', { params });
    return data;
  },
  createTimetable: async (formData: FormData) => {
    const { data } = await apiClient.post('/academic/timetables', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },
  deleteTimetable: async (id: string) => {
    const { data } = await apiClient.delete(`/academic/timetables/${id}`);
    return data;
  },
};
