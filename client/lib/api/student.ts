import apiClient from './client';

export interface Student {
  id: string;
  admissionNumber: string;
  rollNumber?: string;
  status: string;
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    dateOfBirth?: string;
    gender?: string;
    bloodGroup?: string;
    avatar?: string;
  };
  currentClass?: {
    id: string;
    name: string;
  };
  section?: {
    id: string;
    name: string;
  };
}

export interface CreateStudentData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  admissionNumber: string;
  rollNumber?: string;
  currentClassId?: string;
  sectionId?: string;
  academicYearId: string;
  joiningDate?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  medicalConditions?: string;
  allergies?: string;
}

export const studentAPI = {
  getAll: async (params?: any) => {
    const { data } = await apiClient.get('/students', { params });
    return data;
  },

  getById: async (id: string) => {
    const { data } = await apiClient.get(`/students/${id}`);
    return data;
  },

  getMe: async () => {
    const { data } = await apiClient.get('/students/me');
    return data;
  },

  create: async (studentData: CreateStudentData) => {
    const { data } = await apiClient.post('/students', studentData);
    return data;
  },

  register: async (studentData: any) => {
    const { data } = await apiClient.post('/students/register', studentData);
    return data;
  },

  update: async (id: string, updates: Partial<CreateStudentData>) => {
    const { data } = await apiClient.put(`/students/${id}`, updates);
    return data;
  },

  updateMe: async (updates: Partial<CreateStudentData>) => {
    const { data } = await apiClient.put('/students/me', updates);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/students/${id}`);
    return data;
  },

  getAttendance: async (id: string, params?: any) => {
    const { data } = await apiClient.get(`/students/${id}/attendance`, { params });
    return data;
  },

  getAttendanceReport: async (id: string, params?: any) => {
    const { data } = await apiClient.get(`/students/${id}/attendance/report`, { 
      params, 
      responseType: 'blob' 
    });
    return data;
  },
};
