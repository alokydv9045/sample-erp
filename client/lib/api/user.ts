import apiClient from './client';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'ACCOUNTANT' | 'LIBRARIAN' | 'INVENTORY_MANAGER' | 'HR_MANAGER' | 'ADMISSION_MANAGER';
  roles?: string[]; // Multi-role support
  phone?: string;
  avatar?: string;
  isActive: boolean;
  emailVerified: boolean;
  lastLogin?: string;
  lastPasswordChange?: string;
  gender?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  address?: string;
  qrCode?: string;
  qrIssued?: boolean;
  qrIssuedAt?: string | null;
  createdAt: string;
  student?: any;
  teacher?: any;
  staff?: any;
}

export interface CreateUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'ACCOUNTANT' | 'LIBRARIAN' | 'INVENTORY_MANAGER' | 'HR_MANAGER' | 'ADMISSION_MANAGER';
  roles?: string[]; 
  phone?: string;
}

export const userAPI = {
  register: async (userData: CreateUserData): Promise<{ user: User; token: string }> => {
    const { data } = await apiClient.post('/auth/register', userData);
    return data;
  },

  getAll: async (params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
  }): Promise<{ users: User[]; total: number }> => {
    const { data } = await apiClient.get('/users', { params });
    return data;
  },

  getById: async (id: string): Promise<User> => {
    const { data } = await apiClient.get(`/users/${id}`);
    return data.user;
  },

  getMe: async (): Promise<User> => {
    const { data } = await apiClient.get('/auth/me');
    return data.user;
  },

  resetPassword: async (id: string, password: string): Promise<any> => {
    const { data } = await apiClient.post(`/users/${id}/reset-password`, { password });
    return data;
  },

  update: async (id: string, updates: any): Promise<any> => {
    const { data } = await apiClient.put(`/users/${id}`, updates);
    return data;
  },

  updateRoles: async (
    id: string,
    roles: string[],
    primaryRole?: string
  ): Promise<any> => {
    const { data } = await apiClient.put(`/users/${id}/roles`, {
      roles,
      primaryRole: primaryRole ?? roles[0],
    });
    return data;
  },

  updateAvatar: async (id: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('avatar', file);
    const { data } = await apiClient.patch(`/users/${id}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
  },

  changePassword: async (data: any): Promise<any> => {
    const res = await apiClient.post('/users/me/change-password', data);
    return res.data;
  },

  toggleQRIssued: async (id: string, issued: boolean): Promise<any> => {
    const { data } = await apiClient.post(`/users/${id}/qr/status`, { issued });
    return data;
  },

  regenerateQR: async (id: string): Promise<any> => {
    const { data } = await apiClient.post(`/users/${id}/qr/regenerate`);
    return data;
  },
};
