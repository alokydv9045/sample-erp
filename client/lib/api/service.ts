import apiClient from './client';

export interface ServiceRequest {
  id: string;
  requestNumber: string;
  requesterId: string;
  type: 'LEAVE' | 'CERTIFICATE' | 'ID_CARD' | 'COMPLAINT' | 'OTHER';
  subject: string;
  description: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'RESOLVED';
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  startDate?: string;
  endDate?: string;
  attachmentUrl?: string;
  reviewerId?: string;
  reviewerRemarks?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  requester?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    avatar?: string;
  };
  reviewer?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export const serviceAPI = {
  getAll: async (params?: any): Promise<ServiceRequest[]> => {
    const { data } = await apiClient.get('/services', { params });
    return data.requests || [];
  },

  create: async (requestData: any): Promise<{ message: string, request: ServiceRequest }> => {
    const { data } = await apiClient.post('/services', requestData);
    return data;
  },

  update: async (id: string, updates: any): Promise<{ message: string, request: ServiceRequest }> => {
    const { data } = await apiClient.patch(`/services/${id}`, updates);
    return data;
  },
};
