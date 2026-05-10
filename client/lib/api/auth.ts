import apiClient from './client';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  firstName: string;
  lastName: string;
  phone?: string;
  role?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  roles?: string[];
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  address?: string;
  emailVerified?: boolean;
  lastLogin?: string;
  lastPasswordChange?: string;
  createdAt?: string;
  isActive: boolean;
  teacher?: { id: string; assignedScannerId: string | null };
  staff?: { id: string; assignedScannerId: string | null };
}

export interface AuthResponse {
  user: User;
  message: string;
}

export const authAPI = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/login', credentials);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.token) localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  register: async (userData: RegisterData): Promise<AuthResponse> => {
    const { data } = await apiClient.post('/auth/register', userData);
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(data.user));
      if (data.token) localStorage.setItem('auth_token', data.token);
    }
    return data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
        window.location.href = '/login';
      }
    }
  },

  getCurrentUser: (): User | null => {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch (e) {
      localStorage.removeItem('user');
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    if (typeof window === 'undefined') return false;
    // Note: We can't check the HttpOnly cookie from JS.
    // We rely on the existence of the user object or the /me call.
    return !!localStorage.getItem('user');
  },

  getProfile: async (): Promise<{ user: User }> => {
    const { data } = await apiClient.get('/auth/me');
    return data;
  },
};
